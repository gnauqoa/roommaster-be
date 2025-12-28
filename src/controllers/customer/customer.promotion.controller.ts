import { Injectable } from 'core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { PromotionService } from 'services/promotion.service';
import { sendData } from 'utils/responseWrapper';

@Injectable()
export class CustomerPromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  /**
   * Get all available promotions (public listing) with pagination and filters
   * GET /customer-api/v1/promotions/available
   */
  getAvailablePromotions = catchAsync(async (req: Request, res: Response) => {
    const { page, limit, code, description, maxDiscount, startDate, endDate } = req.query;

    const result = await this.promotionService.getActivePromotions({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      code: code as string,
      description: description as string,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount as string) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    sendData(res, result);
  });

  /**
   * Get customer's claimed promotions with pagination and filters
   * GET /customer-api/v1/promotions/my-promotions
   */
  getMyPromotions = catchAsync(async (req: Request, res: Response) => {
    if (!req.customer?.id) {
      throw new Error('Customer not authenticated');
    }

    const { page, limit, code, description, maxDiscount, startDate, endDate } = req.query;

    const result = await this.promotionService.getAvailablePromotions(req.customer.id, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      code: code as string,
      description: description as string,
      maxDiscount: maxDiscount ? parseFloat(maxDiscount as string) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    sendData(res, result);
  });

  /**
   * Claim a promotion
   * POST /customer-api/v1/promotions/claim
   */
  claimPromotion = catchAsync(async (req: Request, res: Response) => {
    if (!req.customer?.id) {
      throw new Error('Customer not authenticated');
    }

    const customerPromotion = await this.promotionService.claimPromotion({
      customerId: req.customer.id,
      promotionCode: req.body.promotionCode
    });

    sendData(res, customerPromotion, httpStatus.CREATED);
  });
}

export default CustomerPromotionController;
