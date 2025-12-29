import { PromotionService } from '@/services/promotion.service';
import { PromotionApplication } from '@/services/transaction/types';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';

/**
 * Validate all promotion applications
 * Checks scope, availability, and date range for each promotion
 */
export async function validatePromotions(
  promotionApplications: PromotionApplication[],
  promotionService: PromotionService
): Promise<void> {
  for (const app of promotionApplications) {
    const targetType = app.bookingRoomId ? 'room' : app.serviceUsageId ? 'service' : 'transaction';

    const validation = await promotionService.validatePromotionApplicability({
      customerPromotionId: app.customerPromotionId,
      targetType,
      bookingRoomId: app.bookingRoomId,
      serviceUsageId: app.serviceUsageId
    });

    if (!validation.valid) {
      throw new ApiError(httpStatus.BAD_REQUEST, validation.reason || 'Invalid promotion');
    }
  }
}
