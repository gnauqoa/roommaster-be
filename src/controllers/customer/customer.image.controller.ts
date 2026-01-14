import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/utils/catchAsync';
import { ImageService } from '@/services';
import { sendData, sendNoContent } from '@/utils/responseWrapper';

/**
 * Customer Image Controller
 * Read-only endpoints for customers to access room and room type images
 * Write endpoints for customers to upload payment proofs for their bookings
 */
@Injectable()
export class CustomerImageController {
  constructor(private readonly imageService: ImageService) {}

  /**
   * Get all images for a specific room
   * GET /customer-api/v1/rooms/:roomId/images
   */
  getRoomImages = catchAsync(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const images = await this.imageService.getRoomImages(roomId);
    sendData(res, images);
  });

  /**
   * Get all images for a specific room type
   * GET /customer-api/v1/room-types/:roomTypeId/images
   */
  getRoomTypeImages = catchAsync(async (req: Request, res: Response) => {
    const { roomTypeId } = req.params;
    const images = await this.imageService.getRoomTypeImages(roomTypeId);
    sendData(res, images);
  });

  // ==================== PAYMENT IMAGES ====================

  /**
   * Upload payment proof image for customer's booking
   * POST /customer-api/v1/bookings/:bookingId/payment-images
   */
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

  /**
   * Upload multiple payment proof images
   * POST /customer-api/v1/bookings/:bookingId/payment-images/batch
   */
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

  /**
   * Get all payment images for customer's booking
   * GET /customer-api/v1/bookings/:bookingId/payment-images
   */
  getPaymentImages = catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    const images = await this.imageService.getPaymentImages(bookingId);
    sendData(res, images);
  });

  /**
   * Delete payment image (customer can only delete their own)
   * DELETE /customer-api/v1/bookings/payment-images/:imageId
   */
  deletePaymentImage = catchAsync(async (req: Request, res: Response) => {
    const { imageId } = req.params;
    await this.imageService.deletePaymentImage(imageId);
    sendNoContent(res);
  });

  /**
   * Get upload signature for direct upload (mobile apps)
   * GET /customer-api/v1/bookings/payment-images/upload-signature
   */
  getPaymentUploadSignature = catchAsync(async (req: Request, res: Response) => {
    const signature = this.imageService.generateUploadSignature('hotel/payments');
    sendData(res, signature);
  });

  /**
   * Save direct upload metadata
   * POST /customer-api/v1/bookings/:bookingId/payment-images/direct-upload
   */
  savePaymentDirectUpload = catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    const {
      cloudinaryId,
      url,
      secureUrl,
      width,
      height,
      format,
      isDefault,
      sortOrder,
      paymentMethod,
      description
    } = req.body;

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

export default CustomerImageController;
