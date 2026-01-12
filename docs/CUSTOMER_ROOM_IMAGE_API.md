# Customer Room & Image API Documentation

## Overview

This document describes how images are included in customer room endpoints and the dedicated image endpoints available.

## Image Inclusion in Room Endpoints

All customer room endpoints now automatically include images in their responses. This eliminates the need for separate API calls to fetch images.

### Endpoints with Image Support

#### 1. GET `/customer/rooms/available`

**Purpose:** Search rooms available for booking dates (Primary booking search endpoint)

**Image Data Included:**

- Room images (ordered by `sortOrder`)
- Room type images (ordered by `sortOrder`)

**Response Structure:**

```json
{
  "data": [
    {
      "roomType": {
        "id": "room-type-id",
        "name": "Deluxe Suite",
        "capacity": 2,
        "basePrice": 1500000,
        "images": [
          {
            "id": "image-id",
            "roomTypeId": "room-type-id",
            "cloudinaryId": "roommaster/room-types/abc123",
            "url": "https://res.cloudinary.com/.../image.jpg",
            "secureUrl": "https://res.cloudinary.com/.../image.jpg",
            "thumbnailUrl": "https://res.cloudinary.com/.../c_thumb,w_300/image.jpg",
            "width": 1920,
            "height": 1080,
            "format": "jpg",
            "sortOrder": 0,
            "isDefault": true,
            "createdAt": "2026-01-12T10:00:00Z"
          }
        ]
      },
      "availableCount": 3,
      "rooms": [
        {
          "id": "room-id",
          "roomNumber": "101",
          "floor": 1,
          "code": "DLX-101",
          "status": "AVAILABLE",
          "images": [
            {
              "id": "room-image-id",
              "roomId": "room-id",
              "cloudinaryId": "roommaster/rooms/xyz789",
              "url": "https://res.cloudinary.com/.../room-image.jpg",
              "secureUrl": "https://res.cloudinary.com/.../room-image.jpg",
              "thumbnailUrl": "https://res.cloudinary.com/.../c_thumb,w_300/room-image.jpg",
              "width": 1920,
              "height": 1080,
              "format": "jpg",
              "sortOrder": 0,
              "isDefault": true,
              "createdAt": "2026-01-12T11:00:00Z"
            }
          ]
        }
      ]
    }
  ],
  "total": 10,
  "checkInDate": "2026-01-15",
  "checkOutDate": "2026-01-20"
}
```

#### 2. GET `/customer/rooms/:roomId`

**Purpose:** Get detailed information about a specific room

**Image Data Included:**

- Room images (ordered by `sortOrder`)
- Room type images (ordered by `sortOrder`)

**Response Structure:**

```json
{
  "id": "room-id",
  "roomNumber": "101",
  "floor": 1,
  "code": "DLX-101",
  "status": "AVAILABLE",
  "roomType": {
    "id": "room-type-id",
    "name": "Deluxe Suite",
    "capacity": 2,
    "basePrice": 1500000,
    "images": [
      {
        "id": "image-id",
        "url": "https://...",
        "thumbnailUrl": "https://...",
        "sortOrder": 0,
        "isDefault": true
      }
    ]
  },
  "images": [
    {
      "id": "room-image-id",
      "url": "https://...",
      "thumbnailUrl": "https://...",
      "sortOrder": 0,
      "isDefault": true
    }
  ]
}
```

#### 3. GET `/customer/rooms`

**Purpose:** Search rooms by current status (deprecated - use `/available` for booking)

**Image Data Included:**

- Room images (ordered by `sortOrder`)
- Room type images (ordered by `sortOrder`)

#### 4. GET `/customer/rooms/:roomId/availability`

**Purpose:** Check if a specific room is available for a date range

**Image Data Included:**

- Room images (ordered by `sortOrder`)
- Room type images (ordered by `sortOrder`)

## Dedicated Image Endpoints

For cases where you need to fetch images separately (e.g., lazy loading, image gallery view), dedicated endpoints are available:

### 1. GET `/customer/rooms/:roomId/images`

**Purpose:** Get all images for a specific room

**Parameters:**

- `roomId` (path) - Room ID

**Response:**

```json
[
  {
    "id": "image-id",
    "roomId": "room-id",
    "cloudinaryId": "roommaster/rooms/xyz789",
    "url": "https://res.cloudinary.com/.../image.jpg",
    "secureUrl": "https://res.cloudinary.com/.../image.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../c_thumb,w_300/image.jpg",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "sortOrder": 0,
    "isDefault": true,
    "createdAt": "2026-01-12T10:00:00Z",
    "updatedAt": "2026-01-12T10:00:00Z"
  }
]
```

### 2. GET `/customer/room-types/:roomTypeId/images`

**Purpose:** Get all images for a specific room type

**Parameters:**

- `roomTypeId` (path) - Room Type ID

**Response:**

```json
[
  {
    "id": "image-id",
    "roomTypeId": "room-type-id",
    "cloudinaryId": "roommaster/room-types/abc123",
    "url": "https://res.cloudinary.com/.../image.jpg",
    "secureUrl": "https://res.cloudinary.com/.../image.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/.../c_thumb,w_300/image.jpg",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "sortOrder": 0,
    "isDefault": true,
    "createdAt": "2026-01-12T10:00:00Z",
    "updatedAt": "2026-01-12T10:00:00Z"
  }
]
```

## Image Properties Explained

| Property                | Type     | Description                                                  |
| ----------------------- | -------- | ------------------------------------------------------------ |
| `id`                    | string   | Unique image ID                                              |
| `roomId` / `roomTypeId` | string   | Parent entity ID                                             |
| `cloudinaryId`          | string   | Cloudinary public ID (used for deletion and transformations) |
| `url`                   | string   | Full Cloudinary URL (HTTP)                                   |
| `secureUrl`             | string   | HTTPS Cloudinary URL (recommended)                           |
| `thumbnailUrl`          | string   | Pre-generated thumbnail URL (300px width)                    |
| `width`                 | number   | Image width in pixels                                        |
| `height`                | number   | Image height in pixels                                       |
| `format`                | string   | Image format (jpg, png, webp, etc.)                          |
| `sortOrder`             | number   | Display order (ascending)                                    |
| `isDefault`             | boolean  | Whether this is the default/featured image                   |
| `createdAt`             | datetime | Creation timestamp                                           |
| `updatedAt`             | datetime | Last update timestamp                                        |

## Usage Recommendations

### For Mobile Apps

**Primary Search Flow:**

1. Use `GET /customer/rooms/available` with check-in/check-out dates
2. Display room type images in the list view
3. When user taps on a room, you already have all the images

**Detail View:**

1. Use `GET /customer/rooms/:roomId` to get full room details
2. Create an image gallery using both room images and room type images
3. Use `thumbnailUrl` for grid views and `secureUrl` for full-size views

**Lazy Loading (Optional):**

- If initial load is slow, you can fetch room list without images first
- Then use dedicated endpoints to load images on-demand
- However, the recommended approach is to include images by default

### Image Display Best Practices

1. **Always use `secureUrl`** (HTTPS) for production
2. **Use `thumbnailUrl`** for:
   - List views
   - Grid views
   - Small previews
3. **Use `secureUrl`** for:
   - Full-screen image galleries
   - Detail views
   - Hero images
4. **Sort by `sortOrder`** (images are pre-sorted in API response)
5. **Display default image first** (where `isDefault: true`)
6. **Fallback**: If no images exist, use a placeholder image

### CDN & Performance

All images are served via Cloudinary CDN with:

- Global edge caching
- Automatic format optimization (WebP for supported browsers)
- Responsive image transformations
- Fast delivery worldwide

## Error Handling

All image endpoints return:

- `200 OK` - Success with image array (may be empty if no images)
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Room or room type doesn't exist

## Authentication

All customer endpoints require authentication:

```
Authorization: Bearer <customer_jwt_token>
```

## Example Integration (React Native)

```typescript
// Fetch available rooms with images
const response = await fetch(
  `${API_BASE}/customer/rooms/available?checkInDate=2026-01-15&checkOutDate=2026-01-20`,
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

const { data } = await response.json();

// Display room type images
data.forEach((roomTypeGroup) => {
  const defaultImage =
    roomTypeGroup.roomType.images.find((img) => img.isDefault) || roomTypeGroup.roomType.images[0];

  // Use thumbnailUrl for list view
  console.log('Thumbnail:', defaultImage.thumbnailUrl);

  // Use secureUrl for full view
  console.log('Full image:', defaultImage.secureUrl);
});
```

## Changes from Previous Version

**Before:**

- Room endpoints did NOT include images
- Required separate API calls to fetch images
- Multiple round trips needed for complete data

**After:**

- All room endpoints include images by default
- Single API call gets complete data
- Optional dedicated endpoints for specific use cases
- Better performance and user experience
