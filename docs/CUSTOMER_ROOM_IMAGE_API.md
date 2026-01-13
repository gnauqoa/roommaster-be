# Customer Room Image API - Test Requests

## Prerequisites

- Server running on http://localhost:3000
- Valid customer JWT token
- At least one room with images in the database

## Variables

```
@baseUrl = http://localhost:3000/customer-api/v1
@token = YOUR_CUSTOMER_JWT_TOKEN_HERE
```

---

## 1. Get Available Rooms with Images

### Test the primary booking search endpoint with images

GET {{baseUrl}}/rooms/available?checkInDate=2026-01-15&checkOutDate=2026-01-20
Authorization: Bearer {{token}}

### Expected Response:

```json
{
  "data": [
    {
      "roomType": {
        "id": "...",
        "name": "Deluxe Suite",
        "capacity": 2,
        "basePrice": 1500000,
        "images": [
          {
            "id": "...",
            "url": "https://res.cloudinary.com/...",
            "thumbnailUrl": "https://res.cloudinary.com/...",
            "sortOrder": 0,
            "isDefault": true
          }
        ]
      },
      "availableCount": 3,
      "rooms": [
        {
          "id": "...",
          "roomNumber": "101",
          "images": [...]
        }
      ]
    }
  ]
}
```

---

## 2. Get Room Details with Images

### Test single room retrieval with images

GET {{baseUrl}}/rooms/{roomId}
Authorization: Bearer {{token}}

### Replace {roomId} with actual room ID

### Expected Response:

```json
{
  "id": "room-id",
  "roomNumber": "101",
  "floor": 1,
  "status": "AVAILABLE",
  "roomType": {
    "id": "...",
    "name": "Deluxe Suite",
    "images": [...]
  },
  "images": [
    {
      "id": "...",
      "url": "https://res.cloudinary.com/...",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "sortOrder": 0,
      "isDefault": true
    }
  ]
}
```

---

## 3. Get Room Images Only

### Test dedicated room images endpoint

GET {{baseUrl}}/rooms/{roomId}/images
Authorization: Bearer {{token}}

### Replace {roomId} with actual room ID

### Expected Response:

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
    "createdAt": "2026-01-12T10:00:00Z"
  }
]
```

---

## 4. Get Room Type Images Only

### Test dedicated room type images endpoint

GET {{baseUrl}}/room-types/{roomTypeId}/images
Authorization: Bearer {{token}}

### Replace {roomTypeId} with actual room type ID

### Expected Response:

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
    "createdAt": "2026-01-12T10:00:00Z"
  }
]
```

---

## 5. Check Room Availability with Images

### Test availability check with images included

GET {{baseUrl}}/rooms/{roomId}/availability?checkInDate=2026-01-15&checkOutDate=2026-01-20
Authorization: Bearer {{token}}

### Replace {roomId} with actual room ID

---

## 6. Search Rooms (Current Status) with Images

### Test deprecated search endpoint (still includes images)

GET {{baseUrl}}/rooms?floor=1&page=1&limit=10
Authorization: Bearer {{token}}

---

## 7. Get Customer Bookings with Images

### Test bookings list with image data

GET {{baseUrl}}/bookings
Authorization: Bearer {{token}}

### Expected Response:

```json
{
  "data": [
    {
      "id": "booking-id",
      "bookingCode": "BK123...",
      "bookingRooms": [
        {
          "room": {
            "images": [
               {
                 "url": "https://res.cloudinary.com/...",
                 "thumbnailUrl": "https://res.cloudinary.com/...",
                 "isDefault": true
               }
            ]
          },
          "roomType": {
            "images": [...]
          }
        }
      ]
    }
  ],
  "pagination": {
     "page": 1,
     "limit": 10,
     "total": 1
  }
}
```

---

## 8. Get Single Booking with Images

### Test single booking details

GET {{baseUrl}}/bookings/{bookingId}
Authorization: Bearer {{token}}

### Replace {bookingId} with actual booking ID

### Expected Response:

```json
{
  "id": "booking-id",
  "bookingCode": "BK123...",
  "bookingRooms": [
    {
      "room": {
        "images": [...]
      },
      "roomType": {
        "images": [...]
      }
    }
  ]
}
```

---

## Testing Checklist

### Basic Functionality

- [ ] GET /rooms/available returns images
- [ ] GET /rooms/:roomId returns images
- [ ] GET /bookings returns images in room and roomType
- [ ] GET /bookings/:id returns images in room and roomType
- [ ] GET /rooms/:roomId/images works
- [ ] GET /room-types/:roomTypeId/images works
- [ ] Images are ordered by sortOrder
- [ ] Default image has isDefault: true

### Authentication

- [ ] Endpoints require authentication
- [ ] Returns 401 without token
- [ ] Returns 401 with invalid token

### Edge Cases

- [ ] Handles rooms with no images (empty array)
- [ ] Handles rooms with multiple images
- [ ] Handles non-existent room ID (404)
- [ ] Handles non-existent room type ID (404)

### Performance

- [ ] Response time is acceptable
- [ ] Images load via CDN
- [ ] Thumbnail URLs work
- [ ] Secure URLs work

### Data Quality

- [ ] Image URLs are valid
- [ ] Cloudinary URLs are accessible
- [ ] Image metadata is complete
- [ ] Image order matches sortOrder

---

## cURL Examples

### Get Available Rooms

```bash
curl -X GET "http://localhost:3000/customer-api/v1/rooms/available?checkInDate=2026-01-15&checkOutDate=2026-01-20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Room Details

```bash
curl -X GET "http://localhost:3000/customer-api/v1/rooms/ROOM_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Room Images

```bash
curl -X GET "http://localhost:3000/customer-api/v1/rooms/ROOM_ID/images" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Room Type Images

```bash
curl -X GET "http://localhost:3000/customer-api/v1/room-types/ROOM_TYPE_ID/images" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Bookings

```bash
curl -X GET "http://localhost:3000/customer-api/v1/bookings" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Postman Collection

Import these requests into Postman:

1. Create a new collection: "Customer Room Images API"
2. Add environment variable: `baseUrl` = `http://localhost:3000/customer-api/v1`
3. Add environment variable: `token` = Your customer JWT token
4. Import the requests above

---

## Expected Image Fields

Every image object should contain:

| Field             | Type     | Required | Description          |
| ----------------- | -------- | -------- | -------------------- |
| id                | string   | ✓        | Unique image ID      |
| roomId/roomTypeId | string   | ✓        | Parent entity ID     |
| cloudinaryId      | string   | ✓        | Cloudinary public ID |
| url               | string   | ✓        | HTTP URL             |
| secureUrl         | string   | ✓        | HTTPS URL            |
| thumbnailUrl      | string   | ✓        | Thumbnail URL        |
| width             | number   | ✓        | Image width (px)     |
| height            | number   | ✓        | Image height (px)    |
| format            | string   | ✓        | Image format         |
| sortOrder         | number   | ✓        | Display order        |
| isDefault         | boolean  | ✓        | Default flag         |
| createdAt         | datetime | ✓        | Creation time        |
| updatedAt         | datetime | ✓        | Update time          |

---

## Troubleshooting

### No images returned

- Check if room/room type has uploaded images
- Verify Cloudinary integration is working
- Check database for RoomImage/RoomTypeImage records

### 401 Unauthorized

- Verify token is valid and not expired
- Check Authorization header format: `Bearer <token>`
- Ensure customer authentication is configured

### 404 Not Found

- Verify room ID or room type ID exists
- Check database for the entity

### Images not loading

- Verify Cloudinary credentials are correct
- Check network connectivity to Cloudinary CDN
- Verify image URLs are properly formatted
