import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import catchAsync from '@/utils/catchAsync';
import { ImageService } from '@/services';
import { sendData } from '@/utils/responseWrapper';

/**
 * Customer Image Controller
 * Read-only endpoints for customers to access room and room type images
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
}

export default CustomerImageController;
