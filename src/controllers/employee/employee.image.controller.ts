// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/utils/catchAsync';
import { ImageService } from '@/services';
import { sendData, sendNoContent } from '@/utils/responseWrapper';

@Injectable()
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  // ==================== ROOM TYPE IMAGES ====================

  uploadRoomTypeImage = catchAsync(async (req: Request, res: Response) => {
    const { roomTypeId } = req.params;
    const { isDefault, sortOrder } = req.body;

    if (!req.file) {
      return res.status(httpStatus.BAD_REQUEST).json({ error: 'No file uploaded' });
    }

    const image = await this.imageService.uploadRoomTypeImage(roomTypeId, req.file, {
      isDefault: isDefault === 'true',
      sortOrder: parseInt(sortOrder) || 0
    });

    // Confirm upload (remove pending tag)
    await this.imageService.confirmUpload(image.cloudinaryId);

    sendData(res, image, httpStatus.CREATED);
  });

  uploadRoomTypeImagesBatch = catchAsync(async (req: Request, res: Response) => {
    const { roomTypeId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json({ error: 'No files uploaded' });
    }

    const result = await this.imageService.uploadRoomTypeImagesBatch(roomTypeId, files);

    // Confirm all successful uploads
    await Promise.all(
      result.successful.map((img) => this.imageService.confirmUpload(img.cloudinaryId))
    );

    // Return appropriate status based on partial failures
    if (result.failureCount > 0) {
      return res.status(httpStatus.MULTI_STATUS).json({
        message: `Uploaded ${result.successCount} of ${result.total} images`,
        ...result
      });
    }

    sendData(res, {
      message: 'All images uploaded successfully',
      ...result
    });
  });

  getRoomTypeImages = catchAsync(async (req: Request, res: Response) => {
    const { roomTypeId } = req.params;
    const images = await this.imageService.getRoomTypeImages(roomTypeId);
    sendData(res, images);
  });

  deleteRoomTypeImage = catchAsync(async (req: Request, res: Response) => {
    const { imageId } = req.params;
    await this.imageService.deleteRoomTypeImage(imageId);
    sendNoContent(res);
  });

  reorderRoomTypeImages = catchAsync(async (req: Request, res: Response) => {
    const { imageIds } = req.body;
    const result = await this.imageService.reorderImages(imageIds, 'roomType');
    sendData(res, result);
  });

  setDefaultRoomTypeImage = catchAsync(async (req: Request, res: Response) => {
    const { imageId } = req.params;
    const result = await this.imageService.setDefaultImage(imageId, 'roomType');
    sendData(res, result);
  });

  getRoomTypeUploadSignature = catchAsync(async (req: Request, res: Response) => {
    const signature = this.imageService.generateUploadSignature('hotel/room-types');
    sendData(res, signature);
  });

  saveRoomTypeDirectUpload = catchAsync(async (req: Request, res: Response) => {
    const { roomTypeId } = req.params;
    const { cloudinaryId, url, secureUrl, width, height, format, isDefault, sortOrder } = req.body;

    const image = await this.imageService.saveDirectUpload(
      roomTypeId,
      'roomType',
      { cloudinaryId, url, secureUrl, width, height, format },
      { isDefault, sortOrder }
    );

    // Confirm upload
    await this.imageService.confirmUpload(cloudinaryId);

    sendData(res, image, httpStatus.CREATED);
  });

  // ==================== SERVICE IMAGES ====================

  uploadServiceImage = catchAsync(async (req: Request, res: Response) => {
    const { serviceId } = req.params;
    const { isDefault, sortOrder } = req.body;

    if (!req.file) {
      return res.status(httpStatus.BAD_REQUEST).json({ error: 'No file uploaded' });
    }

    const image = await this.imageService.uploadServiceImage(serviceId, req.file, {
      isDefault: isDefault === 'true',
      sortOrder: parseInt(sortOrder) || 0
    });

    await this.imageService.confirmUpload(image.cloudinaryId);
    sendData(res, image, httpStatus.CREATED);
  });

  uploadServiceImagesBatch = catchAsync(async (req: Request, res: Response) => {
    const { serviceId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json({ error: 'No files uploaded' });
    }

    const result = await this.imageService.uploadServiceImagesBatch(serviceId, files);

    await Promise.all(
      result.successful.map((img) => this.imageService.confirmUpload(img.cloudinaryId))
    );

    if (result.failureCount > 0) {
      return res.status(httpStatus.MULTI_STATUS).json({
        message: `Uploaded ${result.successCount} of ${result.total} images`,
        ...result
      });
    }

    sendData(res, {
      message: 'All images uploaded successfully',
      ...result
    });
  });

  getServiceImages = catchAsync(async (req: Request, res: Response) => {
    const { serviceId } = req.params;
    const images = await this.imageService.getServiceImages(serviceId);
    sendData(res, images);
  });

  deleteServiceImage = catchAsync(async (req: Request, res: Response) => {
    const { imageId } = req.params;
    await this.imageService.deleteServiceImage(imageId);
    sendNoContent(res);
  });

  reorderServiceImages = catchAsync(async (req: Request, res: Response) => {
    const { imageIds } = req.body;
    const result = await this.imageService.reorderImages(imageIds, 'service');
    sendData(res, result);
  });

  setDefaultServiceImage = catchAsync(async (req: Request, res: Response) => {
    const { imageId } = req.params;
    const result = await this.imageService.setDefaultImage(imageId, 'service');
    sendData(res, result);
  });

  getServiceUploadSignature = catchAsync(async (req: Request, res: Response) => {
    const signature = this.imageService.generateUploadSignature('hotel/services');
    sendData(res, signature);
  });

  saveServiceDirectUpload = catchAsync(async (req: Request, res: Response) => {
    const { serviceId } = req.params;
    const { cloudinaryId, url, secureUrl, width, height, format, isDefault, sortOrder } = req.body;

    const image = await this.imageService.saveDirectUpload(
      serviceId,
      'service',
      { cloudinaryId, url, secureUrl, width, height, format },
      { isDefault, sortOrder }
    );

    await this.imageService.confirmUpload(cloudinaryId);
    sendData(res, image, httpStatus.CREATED);
  });

  // ==================== ROOM IMAGES ====================

  uploadRoomImage = catchAsync(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const { isDefault, sortOrder } = req.body;

    if (!req.file) {
      return res.status(httpStatus.BAD_REQUEST).json({ error: 'No file uploaded' });
    }

    const image = await this.imageService.uploadRoomImage(roomId, req.file, {
      isDefault: isDefault === 'true',
      sortOrder: parseInt(sortOrder) || 0
    });

    await this.imageService.confirmUpload(image.cloudinaryId);
    sendData(res, image, httpStatus.CREATED);
  });

  getRoomImages = catchAsync(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const images = await this.imageService.getRoomImages(roomId);
    sendData(res, images);
  });

  deleteRoomImage = catchAsync(async (req: Request, res: Response) => {
    const { imageId } = req.params;
    await this.imageService.deleteRoomImage(imageId);
    sendNoContent(res);
  });

  reorderRoomImages = catchAsync(async (req: Request, res: Response) => {
    const { imageIds } = req.body;
    const result = await this.imageService.reorderImages(imageIds, 'room');
    sendData(res, result);
  });

  setDefaultRoomImage = catchAsync(async (req: Request, res: Response) => {
    const { imageId } = req.params;
    const result = await this.imageService.setDefaultImage(imageId, 'room');
    sendData(res, result);
  });

  // ==================== PAYMENT IMAGES ====================

  uploadPaymentImage = catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    const { isDefault, sortOrder, paymentMethod, description } = req.body;

    if (!req.file) {
      return res.status(httpStatus.BAD_REQUEST).json({ error: 'No file uploaded' });
    }

    const image = await this.imageService.uploadPaymentImage(bookingId, req.file, {
      isDefault: isDefault === 'true',
      sortOrder: parseInt(sortOrder) || 0,
      paymentMethod,
      description
    });

    await this.imageService.confirmUpload(image.cloudinaryId);
    sendData(res, image, httpStatus.CREATED);
  });

  uploadPaymentImagesBatch = catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).json({ error: 'No files uploaded' });
    }

    const result = await this.imageService.uploadPaymentImagesBatch(bookingId, files);

    await Promise.all(
      result.successful.map((img) => this.imageService.confirmUpload(img.cloudinaryId))
    );

    if (result.failureCount > 0) {
      return res.status(httpStatus.MULTI_STATUS).json({
        message: `Uploaded ${result.successCount} of ${result.total} images`,
        ...result
      });
    }

    sendData(res, {
      message: 'All payment images uploaded successfully',
      ...result
    });
  });

  getPaymentImages = catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    const images = await this.imageService.getPaymentImages(bookingId);
    sendData(res, images);
  });

  deletePaymentImage = catchAsync(async (req: Request, res: Response) => {
    const { imageId } = req.params;
    await this.imageService.deletePaymentImage(imageId);
    sendNoContent(res);
  });

  reorderPaymentImages = catchAsync(async (req: Request, res: Response) => {
    const { imageIds } = req.body;
    const result = await this.imageService.reorderImages(imageIds, 'payment');
    sendData(res, result);
  });

  setDefaultPaymentImage = catchAsync(async (req: Request, res: Response) => {
    const { imageId } = req.params;
    const result = await this.imageService.setDefaultImage(imageId, 'payment');
    sendData(res, result);
  });

  getPaymentUploadSignature = catchAsync(async (req: Request, res: Response) => {
    const signature = this.imageService.generateUploadSignature('hotel/payments');
    sendData(res, signature);
  });

  savePaymentDirectUpload = catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    const { cloudinaryId, url, secureUrl, width, height, format, isDefault, sortOrder } = req.body;

    const image = await this.imageService.saveDirectUpload(
      bookingId,
      'payment',
      { cloudinaryId, url, secureUrl, width, height, format },
      { isDefault, sortOrder }
    );

    await this.imageService.confirmUpload(cloudinaryId);
    sendData(res, image, httpStatus.CREATED);
  });
}

export default ImageController;
