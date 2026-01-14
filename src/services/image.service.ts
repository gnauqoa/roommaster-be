import { PrismaClient, RoomTypeImage, ServiceImage, RoomImage } from '@prisma/client';
import cloudinary, { CLOUDINARY_FOLDERS } from '../config/cloudinary';
import { Injectable } from '@/core/decorators';
import ApiError from '@/utils/ApiError';
import httpStatus from 'http-status';

// Extended file type from multer-storage-cloudinary
// Note: multer-storage-cloudinary uses 'path' for secure_url and 'filename' for public_id
interface CloudinaryFile extends Express.Multer.File {
  path: string; // This is the secure_url from Cloudinary
  filename: string; // This is the public_id from Cloudinary
}

interface UploadOptions {
  isDefault?: boolean;
  sortOrder?: number;
}

interface DirectUploadData {
  cloudinaryId: string;
  url: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
}

@Injectable()
export class ImageService {
  constructor(private readonly prisma: PrismaClient) {}

  // ==================== ROOM TYPE IMAGES ====================

  /**
   * Upload image and create database record for RoomType
   */
  async uploadRoomTypeImage(
    roomTypeId: string,
    file: Express.Multer.File,
    options?: UploadOptions
  ): Promise<RoomTypeImage> {
    const cloudinaryFile = file as CloudinaryFile;

    // multer-storage-cloudinary uses:
    // - path: the secure URL to access the image
    // - filename: the public_id in Cloudinary
    const publicId = cloudinaryFile.filename;
    const secureUrl = cloudinaryFile.path;

    const image = await this.prisma.roomTypeImage.create({
      data: {
        roomType: { connect: { id: roomTypeId } },
        cloudinaryId: publicId,
        url: secureUrl, // Using secure URL for both
        secureUrl: secureUrl,
        thumbnailUrl: this.generateThumbnailUrl(publicId),
        isDefault: options?.isDefault ?? false,
        sortOrder: options?.sortOrder ?? 0
      }
    });

    return image;
  }

  /**
   * Get all images for a room type
   */
  async getRoomTypeImages(roomTypeId: string): Promise<RoomTypeImage[]> {
    return this.prisma.roomTypeImage.findMany({
      where: { roomTypeId },
      orderBy: { sortOrder: 'asc' }
    });
  }

  /**
   * Delete RoomType image from BOTH Cloudinary AND database
   */
  async deleteRoomTypeImage(imageId: string): Promise<{ success: boolean }> {
    const image = await this.prisma.roomTypeImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Image not found');
    }

    // Delete from Cloudinary FIRST
    await cloudinary.uploader.destroy(image.cloudinaryId);

    // Then delete from database
    await this.prisma.roomTypeImage.delete({
      where: { id: imageId }
    });

    return { success: true };
  }

  /**
   * Delete all images when RoomType is deleted
   */
  async deleteRoomTypeImages(roomTypeId: string): Promise<{ deletedCount: number }> {
    const images = await this.prisma.roomTypeImage.findMany({
      where: { roomTypeId },
      select: { cloudinaryId: true }
    });

    if (images.length > 0) {
      const cloudinaryIds = images.map((img) => img.cloudinaryId);

      // Bulk delete from Cloudinary
      await cloudinary.api.delete_resources(cloudinaryIds, {
        resource_type: 'image'
      });
    }

    // Database records will be cascade deleted with RoomType
    return { deletedCount: images.length };
  }

  /**
   * Batch upload with Promise.allSettled to handle partial failures
   */
  async uploadRoomTypeImagesBatch(
    roomTypeId: string,
    files: Express.Multer.File[]
  ): Promise<{
    successful: RoomTypeImage[];
    failed: { error: string }[];
    total: number;
    successCount: number;
    failureCount: number;
  }> {
    const results = await Promise.allSettled(
      files.map((file, index) => this.uploadRoomTypeImage(roomTypeId, file, { sortOrder: index }))
    );

    const successful = results
      .filter((r): r is PromiseFulfilledResult<RoomTypeImage> => r.status === 'fulfilled')
      .map((r) => r.value);

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => ({ error: r.reason.message }));

    return {
      successful,
      failed,
      total: files.length,
      successCount: successful.length,
      failureCount: failed.length
    };
  }

  // ==================== SERVICE IMAGES ====================

  /**
   * Upload image and create database record for Service
   */
  async uploadServiceImage(
    serviceId: string,
    file: Express.Multer.File,
    options?: UploadOptions
  ): Promise<ServiceImage> {
    const cloudinaryFile = file as CloudinaryFile;

    const publicId = cloudinaryFile.filename;
    const secureUrl = cloudinaryFile.path;

    return await this.prisma.serviceImage.create({
      data: {
        service: { connect: { id: serviceId } },
        cloudinaryId: publicId,
        url: secureUrl,
        secureUrl: secureUrl,
        thumbnailUrl: this.generateThumbnailUrl(publicId),
        isDefault: options?.isDefault ?? false,
        sortOrder: options?.sortOrder ?? 0
      }
    });
  }

  /**
   * Get all images for a service
   */
  async getServiceImages(serviceId: string): Promise<ServiceImage[]> {
    return this.prisma.serviceImage.findMany({
      where: { serviceId },
      orderBy: { sortOrder: 'asc' }
    });
  }

  /**
   * Delete Service image from BOTH Cloudinary AND database
   */
  async deleteServiceImage(imageId: string): Promise<{ success: boolean }> {
    const image = await this.prisma.serviceImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Image not found');
    }

    await cloudinary.uploader.destroy(image.cloudinaryId);
    await this.prisma.serviceImage.delete({ where: { id: imageId } });

    return { success: true };
  }

  /**
   * Delete all images when Service is deleted
   */
  async deleteServiceImages(serviceId: string): Promise<{ deletedCount: number }> {
    const images = await this.prisma.serviceImage.findMany({
      where: { serviceId },
      select: { cloudinaryId: true }
    });

    if (images.length > 0) {
      const cloudinaryIds = images.map((img) => img.cloudinaryId);
      await cloudinary.api.delete_resources(cloudinaryIds, {
        resource_type: 'image'
      });
    }

    return { deletedCount: images.length };
  }

  /**
   * Batch upload for Service images
   */
  async uploadServiceImagesBatch(
    serviceId: string,
    files: Express.Multer.File[]
  ): Promise<{
    successful: ServiceImage[];
    failed: { error: string }[];
    total: number;
    successCount: number;
    failureCount: number;
  }> {
    const results = await Promise.allSettled(
      files.map((file, index) => this.uploadServiceImage(serviceId, file, { sortOrder: index }))
    );

    const successful = results
      .filter((r): r is PromiseFulfilledResult<ServiceImage> => r.status === 'fulfilled')
      .map((r) => r.value);

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => ({ error: r.reason.message }));

    return {
      successful,
      failed,
      total: files.length,
      successCount: successful.length,
      failureCount: failed.length
    };
  }

  // ==================== ROOM IMAGES ====================

  /**
   * Upload image and create database record for Room
   */
  async uploadRoomImage(
    roomId: string,
    file: Express.Multer.File,
    options?: UploadOptions
  ): Promise<RoomImage> {
    const cloudinaryFile = file as CloudinaryFile;

    const publicId = cloudinaryFile.filename;
    const secureUrl = cloudinaryFile.path;

    return await this.prisma.roomImage.create({
      data: {
        room: { connect: { id: roomId } },
        cloudinaryId: publicId,
        url: secureUrl,
        secureUrl: secureUrl,
        thumbnailUrl: this.generateThumbnailUrl(publicId),
        isDefault: options?.isDefault ?? false,
        sortOrder: options?.sortOrder ?? 0
      }
    });
  }

  /**
   * Get all images for a room
   */
  async getRoomImages(roomId: string): Promise<RoomImage[]> {
    return this.prisma.roomImage.findMany({
      where: { roomId },
      orderBy: { sortOrder: 'asc' }
    });
  }

  /**
   * Delete Room image from BOTH Cloudinary AND database
   */
  async deleteRoomImage(imageId: string): Promise<{ success: boolean }> {
    const image = await this.prisma.roomImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Image not found');
    }

    await cloudinary.uploader.destroy(image.cloudinaryId);
    await this.prisma.roomImage.delete({ where: { id: imageId } });

    return { success: true };
  }

  /**
   * Delete all images when Room is deleted
   */
  async deleteRoomImages(roomId: string): Promise<{ deletedCount: number }> {
    const images = await this.prisma.roomImage.findMany({
      where: { roomId },
      select: { cloudinaryId: true }
    });

    if (images.length > 0) {
      const cloudinaryIds = images.map((img) => img.cloudinaryId);
      await cloudinary.api.delete_resources(cloudinaryIds, {
        resource_type: 'image'
      });
    }

    return { deletedCount: images.length };
  }

  // ==================== PAYMENT IMAGES ====================

  /**
   * Upload payment proof image for a booking
   */
  async uploadPaymentImage(
    bookingId: string,
    file: Express.Multer.File,
    options?: UploadOptions & { paymentMethod?: string; description?: string }
  ): Promise<any> {
    const cloudinaryFile = file as CloudinaryFile;

    const publicId = cloudinaryFile.filename;
    const secureUrl = cloudinaryFile.path;

    return await this.prisma.paymentImage.create({
      data: {
        booking: { connect: { id: bookingId } },
        cloudinaryId: publicId,
        url: secureUrl,
        secureUrl: secureUrl,
        thumbnailUrl: this.generateThumbnailUrl(publicId),
        isDefault: options?.isDefault ?? false,
        sortOrder: options?.sortOrder ?? 0,
        paymentMethod: options?.paymentMethod,
        description: options?.description
      }
    });
  }

  /**
   * Get all payment images for a booking
   */
  async getPaymentImages(bookingId: string): Promise<any[]> {
    return this.prisma.paymentImage.findMany({
      where: { bookingId },
      orderBy: { sortOrder: 'asc' }
    });
  }

  /**
   * Delete payment image from BOTH Cloudinary AND database
   */
  async deletePaymentImage(imageId: string): Promise<{ success: boolean }> {
    const image = await this.prisma.paymentImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment image not found');
    }

    await cloudinary.uploader.destroy(image.cloudinaryId);
    await this.prisma.paymentImage.delete({ where: { id: imageId } });

    return { success: true };
  }

  /**
   * Delete all payment images when Booking is deleted (cascade handled by DB)
   */
  async deletePaymentImages(bookingId: string): Promise<{ deletedCount: number }> {
    const images = await this.prisma.paymentImage.findMany({
      where: { bookingId },
      select: { cloudinaryId: true }
    });

    if (images.length > 0) {
      const cloudinaryIds = images.map((img) => img.cloudinaryId);
      await cloudinary.api.delete_resources(cloudinaryIds, {
        resource_type: 'image'
      });
    }

    return { deletedCount: images.length };
  }

  /**
   * Batch upload for payment images
   */
  async uploadPaymentImagesBatch(
    bookingId: string,
    files: Express.Multer.File[]
  ): Promise<{
    successful: any[];
    failed: { error: string }[];
    total: number;
    successCount: number;
    failureCount: number;
  }> {
    const results = await Promise.allSettled(
      files.map((file, index) => this.uploadPaymentImage(bookingId, file, { sortOrder: index }))
    );

    const successful = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value);

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => ({ error: r.reason.message }));

    return {
      successful,
      failed,
      total: files.length,
      successCount: successful.length,
      failureCount: failed.length
    };
  }

  // ==================== SHARED UTILITIES ====================

  /**
   * Reorder images by updating sortOrder
   */
  async reorderImages(
    imageIds: string[],
    type: 'roomType' | 'service' | 'room' | 'payment'
  ): Promise<{ success: boolean }> {
    const model =
      type === 'roomType'
        ? this.prisma.roomTypeImage
        : type === 'service'
        ? this.prisma.serviceImage
        : type === 'payment'
        ? this.prisma.paymentImage
        : this.prisma.roomImage;

    const updates = imageIds.map((id, index) =>
      (model as any).update({
        where: { id },
        data: { sortOrder: index }
      })
    );

    await this.prisma.$transaction(updates);
    return { success: true };
  }

  /**
   * Set default image for an entity
   */
  async setDefaultImage(
    imageId: string,
    type: 'roomType' | 'service' | 'room' | 'payment'
  ): Promise<{ success: boolean }> {
    const model =
      type === 'roomType'
        ? this.prisma.roomTypeImage
        : type === 'service'
        ? this.prisma.serviceImage
        : type === 'payment'
        ? this.prisma.paymentImage
        : this.prisma.roomImage;

    // Get the image to find its parent entity
    const image = await (model as any).findUnique({ where: { id: imageId } });
    if (!image) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Image not found');
    }

    const parentIdField =
      type === 'roomType'
        ? 'roomTypeId'
        : type === 'service'
        ? 'serviceId'
        : type === 'payment'
        ? 'bookingId'
        : 'roomId';
    const parentId = image[parentIdField];

    // Reset all images for this entity to not default
    await (model as any).updateMany({
      where: { [parentIdField]: parentId },
      data: { isDefault: false }
    });

    // Set the selected image as default
    await (model as any).update({
      where: { id: imageId },
      data: { isDefault: true }
    });

    return { success: true };
  }

  /**
   * Generate signed upload parameters for direct upload (Mobile App)
   */
  generateUploadSignature(folder: string): {
    signature: string;
    timestamp: number;
    cloudName: string | undefined;
    apiKey: string | undefined;
    folder: string;
    tags: string;
  } {
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

  /**
   * Save image metadata after direct upload (Mobile App)
   */
  async saveDirectUpload(
    entityId: string,
    type: 'roomType' | 'service' | 'room' | 'payment',
    data: DirectUploadData,
    options?: UploadOptions
  ): Promise<RoomTypeImage | ServiceImage | RoomImage | any> {
    const imageData = {
      cloudinaryId: data.cloudinaryId,
      url: data.url,
      secureUrl: data.secureUrl,
      thumbnailUrl: this.generateThumbnailUrl(data.cloudinaryId),
      width: data.width,
      height: data.height,
      format: data.format,
      sortOrder: options?.sortOrder ?? 0,
      isDefault: options?.isDefault ?? false
    };

    if (type === 'roomType') {
      return this.prisma.roomTypeImage.create({
        data: { ...imageData, roomType: { connect: { id: entityId } } }
      });
    } else if (type === 'service') {
      return this.prisma.serviceImage.create({
        data: { ...imageData, service: { connect: { id: entityId } } }
      });
    } else if (type === 'payment') {
      return this.prisma.paymentImage.create({
        data: { ...imageData, booking: { connect: { id: entityId } } }
      });
    } else {
      return this.prisma.roomImage.create({
        data: { ...imageData, room: { connect: { id: entityId } } }
      });
    }
  }

  /**
   * Confirm upload - remove pending tag (for orphaned image cleanup)
   */
  async confirmUpload(cloudinaryId: string): Promise<{ success: boolean }> {
    try {
      await cloudinary.uploader.remove_tag('status_pending', [cloudinaryId]);
      await cloudinary.uploader.add_tag('status_confirmed', [cloudinaryId]);
      return { success: true };
    } catch (error) {
      console.error('Failed to confirm upload:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail URL with Cloudinary transformations
   */
  private generateThumbnailUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      transformation: [
        { width: 400, height: 300, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });
  }
}

export default ImageService;
