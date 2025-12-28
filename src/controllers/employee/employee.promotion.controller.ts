import { Injectable } from 'core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { PromotionService } from 'services/promotion.service';
import { sendData } from 'utils/responseWrapper';

@Injectable()
export class EmployeePromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  /**
   * Create a new promotion
   * POST /employee-api/v1/promotions
   */
  createPromotion = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const promotion = await this.promotionService.createPromotion({
      ...req.body,
      employeeId: req.employee.id
    });

    sendData(res, promotion, httpStatus.CREATED);
  });

  /**
   * Get all promotions with pagination and filters
   * GET /employee-api/v1/promotions
   */
  getPromotions = catchAsync(async (req: Request, res: Response) => {
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
   * Update a promotion
   * PATCH /employee-api/v1/promotions/:id
   */
  updatePromotion = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const promotion = await this.promotionService.updatePromotion({
      id: req.params.id,
      ...req.body,
      employeeId: req.employee.id
    });

    sendData(res, promotion);
  });
}

export default EmployeePromotionController;
