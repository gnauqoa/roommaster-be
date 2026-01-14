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
  CUSTOMERS: 'hotel/customers',
  PAYMENTS: 'hotel/payments'
} as const;

export default cloudinary;
