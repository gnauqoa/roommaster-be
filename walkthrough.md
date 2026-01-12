# Cloudinary Implementation Walkthrough

## Summary

Successfully implemented Cloudinary-based image management for the hotel management system. This enables uploading, storing, and managing images for **RoomTypes**, **Services**, and **Rooms**.

## Changes Made

### Key Fixes & Improvements

- **Route Structure**: Image routes directly integrated into existing entity routes (`room-types`, `services`, `rooms`) for better RESTful structure.
- **Payload Limit**: Increased [json](file:///d:/HOTEL_MS/roommaster-be/package.json) and `urlencoded` body limits to **50MB** in [app.ts](file:///d:/HOTEL_MS/roommaster-be/src/app.ts) to support large batch uploads.
- **Upload Reliability**: Fixed `multer-storage-cloudinary` property mapping (`path` -> `secureUrl`, `filename` -> `cloudinaryId`) to ensure correct database storage.

---

### Database Schema

Added 3 new image models to [schema.prisma](file:///d:/HOTEL_MS/roommaster-be/prisma/schema.prisma):

| Model                                                                                   | Purpose                            |
| --------------------------------------------------------------------------------------- | ---------------------------------- |
| [RoomTypeImage](file:///d:/HOTEL_MS/roommaster-be/src/services/image.service.ts#65-74)  | Stores images for room types       |
| [ServiceImage](file:///d:/HOTEL_MS/roommaster-be/src/services/image.service.ts#182-191) | Stores images for hotel services   |
| [RoomImage](file:///d:/HOTEL_MS/roommaster-be/src/services/image.service.ts#291-300)    | Stores images for individual rooms |

Relation fields added to [RoomType](file:///d:/HOTEL_MS/roommaster-be/src/services/roomType.service.ts#41-82), [Service](file:///d:/HOTEL_MS/roommaster-be/src/services/image.service.ts#28-500), and [Room](file:///d:/HOTEL_MS/roommaster-be/src/services/image.service.ts#291-300) models to support `1:N` image relationships.

---

### Configuration

#### [cloudinary.ts](file:///d:/HOTEL_MS/roommaster-be/src/config/cloudinary.ts)

Cloudinary SDK configuration with folder constants (`hotel/room-types`, etc.).

#### [app.ts](file:///d:/HOTEL_MS/roommaster-be/src/app.ts)

Updated body parser limits:

```typescript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

---

### Services & Logic

#### [image.service.ts](file:///d:/HOTEL_MS/roommaster-be/src/services/image.service.ts)

Central service handling:

- **Uploads**: Single and Batch (with atomic transaction support where applicable)
- **Deletions**: Remove from Cloudinary first, then Database
- **Direct Uploads**: Generate signatures for mobile apps
- **Ordering**: Reorder images via `sortOrder`
- **Defaults**: Set `isDefault` flag atomically

#### [upload.middleware.ts](file:///d:/HOTEL_MS/roommaster-be/src/middlewares/upload.middleware.ts)

Multer middleware configured with `multer-storage-cloudinary` for auto-optimization (max 2000x2000, allowed formats: jpg/png/webp).

---

### API Routes

Image endpoints are now nested under their respective entity routes for consistency.

#### 1. Room Type Images

Routes defined in: [roomType.route.ts](file:///d:/HOTEL_MS/roommaster-be/src/routes/v1/employee/roomType.route.ts)

| Method   | Endpoint                                            | Description            |
| -------- | --------------------------------------------------- | ---------------------- |
| `POST`   | `/employee/room-types/:roomTypeId/images`           | Upload single image    |
| `GET`    | `/employee/room-types/:roomTypeId/images`           | Get all images         |
| `POST`   | `/employee/room-types/:roomTypeId/images/batch`     | Batch upload (max 10)  |
| `PUT`    | `/employee/room-types/:roomTypeId/images/reorder`   | Update display order   |
| `DELETE` | `/employee/room-types/images/:imageId`              | Delete image           |
| `PUT`    | `/employee/room-types/images/:imageId/default`      | Set as default         |
| `GET`    | `/employee/room-types/:roomTypeId/upload-signature` | Get mobile upload sign |
| `POST`   | `/employee/room-types/:roomTypeId/images/direct`    | Save mobile upload     |

#### 2. Service Images

Routes defined in: [service.route.ts](file:///d:/HOTEL_MS/roommaster-be/src/routes/v1/employee/service.route.ts)

| Method   | Endpoint                                     | Description         |
| -------- | -------------------------------------------- | ------------------- |
| `POST`   | `/employee/services/:serviceId/images`       | Upload single image |
| `GET`    | `/employee/services/:serviceId/images`       | Get all images      |
| `POST`   | `/employee/services/:serviceId/images/batch` | Batch upload        |
| `DELETE` | `/employee/services/images/:imageId`         | Delete image        |
| `PUT`    | `/employee/services/images/:imageId/default` | Set as default      |

#### 3. Room Images

Routes defined in: [room.route.ts](file:///d:/HOTEL_MS/roommaster-be/src/routes/v1/employee/room.route.ts)

| Method   | Endpoint                                  | Description         |
| -------- | ----------------------------------------- | ------------------- |
| `POST`   | `/employee/rooms/:roomId/images`          | Upload single image |
| `GET`    | `/employee/rooms/:roomId/images`          | Get all images      |
| `DELETE` | `/employee/rooms/images/:imageId`         | Delete image        |
| `PUT`    | `/employee/rooms/images/:imageId/default` | Set as default      |

---

## Testing Instructions

### Via Swagger

1. Go to `/api-docs`
2. Look for **Room Types**, **Services**, or **Rooms** tags.
3. Image endpoints are listed alongside crud operations (e.g. `POST /employee/room-types/{roomTypeId}/images`).

### Via cURL (Example)

```bash
# Upload Room Type Image
curl -X POST \
  http://localhost:8080/v1/employee/room-types/{id}/images \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/image.jpg"

# Batch Upload
curl -X POST \
  http://localhost:8080/v1/employee/room-types/{id}/images/batch \
  -H "Authorization: Bearer <token>" \
  -F "images=@file1.jpg" \
  -F "images=@file2.jpg"
```

### Verification Checklist

- [x] Room Type single upload
- [x] Room Type batch upload
- [x] Service upload
- [x] Room upload
- [x] Deletion (removes from Cloudinary & DB)
