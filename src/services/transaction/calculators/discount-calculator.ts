import { PrismaClient } from '@prisma/client';
import { PromotionService } from '@/services/promotion.service';
import {
  PromotionApplication,
  TransactionDetailData,
  DiscountInfo
} from '@/services/transaction/types';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';

/**
 * Calculate discounts for all promotions
 */
export async function calculateDiscounts(
  promotionApplications: PromotionApplication[],
  transactionDetails: TransactionDetailData[],
  promotionService: PromotionService,
  prisma: PrismaClient
): Promise<Map<string, DiscountInfo>> {
  const discounts = new Map<string, DiscountInfo>();

  for (const app of promotionApplications) {
    // Find matching detail or use transaction total
    const baseAmount = getBaseAmountForPromotion(app, transactionDetails);

    // Get customer promotion to access promotionId
    const customerPromotion = await prisma.customerPromotion.findUnique({
      where: { id: app.customerPromotionId }
    });

    if (!customerPromotion) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer promotion not found');
    }

    const discount = await promotionService.calculateDiscount({
      promotionId: customerPromotion.promotionId,
      baseAmount
    });

    discounts.set(app.customerPromotionId, {
      amount: discount,
      target: app
    });
  }

  return discounts;
}

/**
 * Get base amount for a specific promotion application
 */
export function getBaseAmountForPromotion(
  app: PromotionApplication,
  details: TransactionDetailData[]
): number {
  if (app.bookingRoomId) {
    const detail = details.find((d) => d.bookingRoomId === app.bookingRoomId);
    return detail?.baseAmount || 0;
  }

  if (app.serviceUsageId) {
    const detail = details.find((d) => d.serviceUsageId === app.serviceUsageId);
    return detail?.baseAmount || 0;
  }

  // Transaction-level: sum all details
  return details.reduce((sum, d) => sum + d.baseAmount, 0);
}

/**
 * Apply discounts to transaction details
 */
export function applyDiscountsToDetails(
  details: TransactionDetailData[],
  discounts: Map<string, DiscountInfo>
): TransactionDetailData[] {
  return details.map((detail) => {
    let detailDiscount = 0;

    // Find promotions that apply to this specific detail
    for (const [, discountInfo] of discounts) {
      const { target, amount } = discountInfo;

      if (
        (target.bookingRoomId && target.bookingRoomId === detail.bookingRoomId) ||
        (target.serviceUsageId && target.serviceUsageId === detail.serviceUsageId)
      ) {
        detailDiscount += amount;
      }
    }

    return {
      ...detail,
      discountAmount: detailDiscount,
      amount: detail.baseAmount - detailDiscount
    };
  });
}
