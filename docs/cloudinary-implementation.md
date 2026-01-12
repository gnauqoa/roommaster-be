# Cloudinary Implementation Plan - Hotel Management System

## Overview

This plan covers implementing Cloudinary for managing images of Rooms, RoomTypes, and Services in your hotel management system with Express.js backend, Next.js web frontend, and React Native mobile app.

## Architecture Decision: Upload Flow

### Option 1: Backend Upload (For Admin/Staff - Stable Connection) ✅

**Flow**: FE → Backend → Cloudinary → Backend → Database → FE

**Pros:**

- Better security (API keys hidden)
- Centralized validation
- Easier to add preprocessing (resize, watermark)
- Transaction consistency (DB + Cloudinary together)
- Better error handling
- Perfect for hotel staff on stable Wi-Fi

**Cons:**

- Higher server bandwidth usage
- Slightly slower for large files
- "Double-hop" can timeout on slow mobile connections

**Use Case:** Admin dashboard, hotel staff management

### Option 2: Signed Direct Upload (For Mobile App - Customer Side) ✅

**Flow**: FE → Get signature from Backend → FE → Cloudinary → FE → Backend → Database

**Pros:**

- Reduced server load
- Faster uploads
- Better for mobile on 4G/5G
- Leverages Cloudinary's global edge servers
- Higher success rate on unstable connections

**Cons:**

- More complex implementation
- Risk of "orphaned images" (uploaded to Cloudinary but not in DB)
- Requires cleanup worker

**Use Case:** Mobile customer app (profile pictures, review photos)

**Decision**:

- **Backend Upload** for Next.js Admin Dashboard (stable connection)
- **Signed Direct Upload** for React Native Mobile App (unstable connection)

### Critical: The "Orphaned Image" Problem & Solution

**Problem:** If user uploads to Cloudinary but loses connection before saving to DB, images become orphaned.

**Solution:** Tagging system with cleanup worker (detailed in section 8)

## 1. Database Schema Updates

### Current State Analysis

Your schema already has `imageUrl` fields:

- `RoomType.imageUrl` (String?)
- `Service.imageUrl` (String?)
- `Customer.imageUrl` (String?)

### Recommended Schema Enhancement

```prisma
model RoomType {
  id        String  @id @default(cuid())
  name      String
  capacity  Int
  totalBed  Int     @default(0)
  basePrice Decimal @db.Decimal(10, 2)

  // Multiple images support
  images    RoomTypeImage[]

  // Deprecated - keep for migration
  imageUrl  String?

  // ... rest of fields
}

model RoomTypeImage {
  id           String   @id @default(cuid())
  roomTypeId   String
  cloudinaryId String   // Cloudinary public_id for deletion
  url          String   // Full Cloudinary URL
  secureUrl    String   // HTTPS URL
  thumbnailUrl String?  // Transformed thumbnail URL
  width        Int?
  height       Int?
  format       String?  // jpg, png, webp
  sortOrder    Int      @default(0)
  isDefault    Boolean  @default(false)

  roomType     RoomType @relation(fields: [roomTypeId], references: [id], onDelete: Cascade)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([roomTypeId])
  @@index([sortOrder])
}

model Service {
  id       String  @id @default(cuid())
  name     String
  price    Decimal @db.Decimal(10, 2)

  // Multiple images support
  images   ServiceImage[]

  // Deprecated - keep for migration
  imageUrl String?

  // ... rest of fields
}

model ServiceImage {
  id           String   @id @default(cuid())
  serviceId    String
  cloudinaryId String
  url          String
  secureUrl    String
  thumbnailUrl String?
  width        Int?
  height       Int?
  format       String?
  sortOrder    Int      @default(0)
  isDefault    Boolean  @default(false)

  service      Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([serviceId])
  @@index([sortOrder])
}

// Optional: If you want multiple images per Room
model Room {
  id         String     @id @default(cuid())
  roomNumber String     @unique

  images     RoomImage[]

  // ... rest of fields
}

model RoomImage {
  id           String   @id @default(cuid())
  roomId       String
  cloudinaryId String
  url          String
  secureUrl    String
  thumbnailUrl String?
  width        Int?
  height       Int?
  format       String?
  sortOrder    Int      @default(0)
  isDefault    Boolean  @default(false)

  room         Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([roomId])
  @@index([sortOrder])
}
```

### Migration Strategy

1. Create new image tables
2. Migrate existing `imageUrl` data to new tables
3. Keep old `imageUrl` fields temporarily for backward compatibility
4. Remove deprecated fields after full migration

---

## 2. Backend Implementation (Express.js + Prisma)

### 2.1 Dependencies Installation

```bash
# Cloudinary SDK (we use the official SDK for easier management)
npm install cloudinary

# Multer for handling multipart/form-data
npm install multer multer-storage-cloudinary

# TypeScript types
npm install --save-dev @types/multer @types/multer-storage-cloudinary
```

**Why Cloudinary SDK?**

- Official support and updates
- Built-in transformations and optimizations
- Easier deletion and management
- Better error handling
- URL generation helpers

### 2.2 Cloudinary Configuration

**File: `src/config/cloudinary.ts`**

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const CLOUDINARY_FOLDERS = {
  ROOM_TYPES: 'hotel/room-types',
  ROOMS: 'hotel/rooms',
  SERVICES: 'hotel/services',
  CUSTOMERS: 'hotel/customers'
} as const;

export default cloudinary;
```

**Environment Variables (`.env`)**:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2.3 Upload Middleware

**File: `src/middleware/upload.middleware.ts`**

```typescript
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary, { CLOUDINARY_FOLDERS } from '../config/cloudinary';

// Generic Cloudinary storage factory
const createCloudinaryStorage = (folder: string) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 2000, height: 2000, crop: 'limit' }]
    } as any
  });
};

// Specific upload instances
export const uploadRoomTypeImage = multer({
  storage: createCloudinaryStorage(CLOUDINARY_FOLDERS.ROOM_TYPES),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

export const uploadRoomImage = multer({
  storage: createCloudinaryStorage(CLOUDINARY_FOLDERS.ROOMS),
  limits: { fileSize: 5 * 1024 * 1024 }
});

export const uploadServiceImage = multer({
  storage: createCloudinaryStorage(CLOUDINARY_FOLDERS.SERVICES),
  limits: { fileSize: 5 * 1024 * 1024 }
});
```

### 2.4 Image Service Layer

**File: `src/services/image.service.ts`**

```typescript
import cloudinary from '../config/cloudinary';
import { prisma } from '../config/database';

export class ImageService {
  // Upload image and create database record
  async uploadRoomTypeImage(
    roomTypeId: string,
    file: Express.Multer.File,
    options?: { isDefault?: boolean; sortOrder?: number }
  ) {
    const cloudinaryFile = file as any;

    const image = await prisma.roomTypeImage.create({
      data: {
        roomTypeId,
        cloudinaryId: cloudinaryFile.public_id,
        url: cloudinaryFile.url,
        secureUrl: cloudinaryFile.secure_url,
        thumbnailUrl: this.generateThumbnailUrl(cloudinaryFile.public_id),
        width: cloudinaryFile.width,
        height: cloudinaryFile.height,
        format: cloudinaryFile.format,
        isDefault: options?.isDefault ?? false,
        sortOrder: options?.sortOrder ?? 0
      }
    });

    return image;
  }

  // CRITICAL: Delete image from BOTH Cloudinary AND database
  async deleteRoomTypeImage(imageId: string) {
    const image = await prisma.roomTypeImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // Delete from Cloudinary FIRST
    await cloudinary.uploader.destroy(image.cloudinaryId);

    // Then delete from database
    await prisma.roomTypeImage.delete({
      where: { id: imageId }
    });

    return { success: true };
  }

  // CRITICAL: Delete RoomType with proper Cloudinary cleanup
  async deleteRoomType(roomTypeId: string) {
    // 1. Fetch all cloudinaryIds associated with this RoomType
    const images = await prisma.roomTypeImage.findMany({
      where: { roomTypeId },
      select: { cloudinaryId: true }
    });

    // 2. Delete all images from Cloudinary in parallel
    if (images.length > 0) {
      const cloudinaryIds = images.map((img) => img.cloudinaryId);

      // Bulk delete from Cloudinary
      await cloudinary.api.delete_resources(cloudinaryIds, {
        resource_type: 'image'
      });
    }

    // 3. Delete the RoomType (Cascade will handle DB images)
    await prisma.roomType.delete({
      where: { id: roomTypeId }
    });

    return { success: true, deletedImages: images.length };
  }

  // Batch upload with Promise.allSettled to handle partial failures
  async uploadRoomTypeImagesBatch(roomTypeId: string, files: Express.Multer.File[]) {
    const results = await Promise.allSettled(
      files.map((file, index) => this.uploadRoomTypeImage(roomTypeId, file, { sortOrder: index }))
    );

    const successful = results.filter((r) => r.status === 'fulfilled').map((r: any) => r.value);

    const failed = results
      .filter((r) => r.status === 'rejected')
      .map((r: any) => ({ error: r.reason.message }));

    return {
      successful,
      failed,
      total: files.length,
      successCount: successful.length,
      failureCount: failed.length
    };
  }

  // Generate thumbnail URL with Cloudinary transformations
  private generateThumbnailUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      transformation: [
        { width: 400, height: 300, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
  }

  // Similar methods for Service and Room images
  async uploadServiceImage(serviceId: string, file: Express.Multer.File, options?: any) {
    const cloudinaryFile = file as any;

    return await prisma.serviceImage.create({
      data: {
        serviceId,
        cloudinaryId: cloudinaryFile.public_id,
        url: cloudinaryFile.url,
        secureUrl: cloudinaryFile.secure_url,
        thumbnailUrl: this.generateThumbnailUrl(cloudinaryFile.public_id),
        width: cloudinaryFile.width,
        height: cloudinaryFile.height,
        format: cloudinaryFile.format,
        isDefault: options?.isDefault ?? false,
        sortOrder: options?.sortOrder ?? 0
      }
    });
  }

  async deleteServiceImage(imageId: string) {
    const image = await prisma.serviceImage.findUnique({
      where: { id: imageId }
    });

    if (!image) throw new Error('Image not found');

    // Delete from Cloudinary FIRST
    await cloudinary.uploader.destroy(image.cloudinaryId);

    // Then delete from database
    await prisma.serviceImage.delete({ where: { id: imageId } });

    return { success: true };
  }

  async deleteService(serviceId: string) {
    const images = await prisma.serviceImage.findMany({
      where: { serviceId },
      select: { cloudinaryId: true }
    });

    if (images.length > 0) {
      const cloudinaryIds = images.map((img) => img.cloudinaryId);
      await cloudinary.api.delete_resources(cloudinaryIds, {
        resource_type: 'image'
      });
    }

    await prisma.service.delete({ where: { id: serviceId } });

    return { success: true, deletedImages: images.length };
  }

  async uploadServiceImagesBatch(serviceId: string, files: Express.Multer.File[]) {
    const results = await Promise.allSettled(
      files.map((file, index) => this.uploadServiceImage(serviceId, file, { sortOrder: index }))
    );

    const successful = results.filter((r) => r.status === 'fulfilled').map((r: any) => r.value);

    const failed = results
      .filter((r) => r.status === 'rejected')
      .map((r: any) => ({ error: r.reason.message }));

    return {
      successful,
      failed,
      total: files.length,
      successCount: successful.length,
      failureCount: failed.length
    };
  }

  // Reorder images
  async reorderImages(imageIds: string[], type: 'roomType' | 'service' | 'room') {
    const model =
      type === 'roomType'
        ? prisma.roomTypeImage
        : type === 'service'
        ? prisma.serviceImage
        : prisma.roomImage;

    const updates = imageIds.map((id, index) =>
      model.update({
        where: { id },
        data: { sortOrder: index }
      })
    );

    await prisma.$transaction(updates);
    return { success: true };
  }

  // Generate signed upload parameters for direct upload
  generateUploadSignature(folder: string) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
      timestamp,
      folder,
      tags: 'status_pending' // For orphaned image cleanup
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return {
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
      tags: 'status_pending'
    };
  }

  // Mark image as confirmed (remove pending tag)
  async confirmUpload(cloudinaryId: string) {
    try {
      await cloudinary.uploader.remove_tag('status_pending', [cloudinaryId]);
      await cloudinary.uploader.add_tag('status_confirmed', [cloudinaryId]);
      return { success: true };
    } catch (error) {
      console.error('Failed to confirm upload:', error);
      throw error;
    }
  }
}

export const imageService = new ImageService();
```

### 2.5 API Routes

**File: `src/routes/roomType.routes.ts`**

```typescript
import express from 'express';
import { uploadRoomTypeImage } from '../middleware/upload.middleware';
import { imageService } from '../services/image.service';

const router = express.Router();

// Upload single image
router.post('/:id/images', uploadRoomTypeImage.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isDefault, sortOrder } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const image = await imageService.uploadRoomTypeImage(id, req.file, {
      isDefault: isDefault === 'true',
      sortOrder: parseInt(sortOrder) || 0
    });

    // Confirm upload (remove pending tag)
    await imageService.confirmUpload(image.cloudinaryId);

    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload multiple images with partial failure handling
router.post('/:id/images/batch', uploadRoomTypeImage.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const result = await imageService.uploadRoomTypeImagesBatch(id, files);

    // Confirm all successful uploads
    await Promise.all(result.successful.map((img) => imageService.confirmUpload(img.cloudinaryId)));

    // Return detailed results
    if (result.failureCount > 0) {
      return res.status(207).json({
        message: `Uploaded ${result.successCount} of ${result.total} images`,
        ...result
      });
    }

    res.json({
      message: 'All images uploaded successfully',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all images for a room type
router.get('/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const images = await prisma.roomTypeImage.findMany({
      where: { roomTypeId: id },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete image
router.delete('/images/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const result = await imageService.deleteRoomTypeImage(imageId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete room type (with Cloudinary cleanup)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await imageService.deleteRoomType(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder images
router.put('/:id/images/reorder', async (req, res) => {
  try {
    const { imageIds } = req.body;
    const result = await imageService.reorderImages(imageIds, 'roomType');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get upload signature for direct upload (Mobile)
router.get('/:id/upload-signature', async (req, res) => {
  try {
    const signature = imageService.generateUploadSignature('hotel/room-types');
    res.json(signature);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save image metadata after direct upload
router.post('/:id/images/direct', async (req, res) => {
  try {
    const { id } = req.params;
    const { cloudinaryId, url, secureUrl, width, height, format } = req.body;

    const image = await prisma.roomTypeImage.create({
      data: {
        roomTypeId: id,
        cloudinaryId,
        url,
        secureUrl,
        thumbnailUrl: cloudinary.url(cloudinaryId, {
          transformation: [{ width: 400, height: 300, crop: 'fill' }, { quality: 'auto' }]
        }),
        width,
        height,
        format,
        sortOrder: 0,
        isDefault: false
      }
    });

    // Confirm upload
    await imageService.confirmUpload(cloudinaryId);

    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**Similar routes for Services:**

```typescript
// src/routes/service.routes.ts
import express from 'express';
import { uploadServiceImage } from '../middleware/upload.middleware';
import { imageService } from '../services/image.service';

const router = express.Router();

// Similar structure to roomType routes...

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await imageService.deleteService(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```
