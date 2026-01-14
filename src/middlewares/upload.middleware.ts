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

// Memory storage for buffer-based uploads (alternative approach)
export const memoryStorage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// Specific upload instances for each entity type
export const uploadRoomTypeImage = multer({
  storage: createCloudinaryStorage(CLOUDINARY_FOLDERS.ROOM_TYPES),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

export const uploadRoomImage = multer({
  storage: createCloudinaryStorage(CLOUDINARY_FOLDERS.ROOMS),
  limits: { fileSize: 5 * 1024 * 1024 }
});

export const uploadServiceImage = multer({
  storage: createCloudinaryStorage(CLOUDINARY_FOLDERS.SERVICES),
  limits: { fileSize: 5 * 1024 * 1024 }
});

export const uploadCustomerImage = multer({
  storage: createCloudinaryStorage(CLOUDINARY_FOLDERS.CUSTOMERS),
  limits: { fileSize: 5 * 1024 * 1024 }
});
