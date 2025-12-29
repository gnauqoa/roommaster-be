/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  calculateDiscounts,
  getBaseAmountForPromotion,
  applyDiscountsToDetails
} from '../../../../src/services/transaction/calculators/discount-calculator';
import ApiError from '../../../../src/utils/ApiError';

const createMockPromotionService = () => ({
  calculateDiscount: jest.fn() as any
});

const createMockPrisma = () => ({
  customerPromotion: {
    findUnique: jest.fn() as any
  }
});

describe('discount-calculator', () => {
  let mockPromotionService: ReturnType<typeof createMockPromotionService>;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPromotionService = createMockPromotionService();
    mockPrisma = createMockPrisma();
    jest.clearAllMocks();
  });

  describe('getBaseAmountForPromotion', () => {
    const transactionDetails = [
      { bookingRoomId: 'room-1', baseAmount: 1000, discountAmount: 0, amount: 1000 },
      { bookingRoomId: 'room-2', baseAmount: 1500, discountAmount: 0, amount: 1500 },
      { serviceUsageId: 'service-1', baseAmount: 500, discountAmount: 0, amount: 500 }
    ];

    it('should return base amount for specific booking room', () => {
      const app = { bookingRoomId: 'room-1', customerPromotionId: 'promo-1' };
      const result = getBaseAmountForPromotion(app, transactionDetails);

      expect(result).toBe(1000);
    });

    it('should return base amount for specific service usage', () => {
      const app = { serviceUsageId: 'service-1', customerPromotionId: 'promo-1' };
      const result = getBaseAmountForPromotion(app, transactionDetails);

      expect(result).toBe(500);
    });

    it('should return total amount for transaction-level promotion', () => {
      const app = { customerPromotionId: 'promo-1' };
      const result = getBaseAmountForPromotion(app, transactionDetails);

      expect(result).toBe(3000); // 1000 + 1500 + 500
    });

    it('should return 0 if booking room not found', () => {
      const app = { bookingRoomId: 'non-existent', customerPromotionId: 'promo-1' };
      const result = getBaseAmountForPromotion(app, transactionDetails);

      expect(result).toBe(0);
    });

    it('should return 0 if service usage not found', () => {
      const app = { serviceUsageId: 'non-existent', customerPromotionId: 'promo-1' };
      const result = getBaseAmountForPromotion(app, transactionDetails);

      expect(result).toBe(0);
    });

    it('should handle empty transaction details', () => {
      const app = { customerPromotionId: 'promo-1' };
      const result = getBaseAmountForPromotion(app, []);

      expect(result).toBe(0);
    });
  });

  describe('applyDiscountsToDetails', () => {
    const details = [
      { bookingRoomId: 'room-1', baseAmount: 1000, discountAmount: 0, amount: 1000 },
      { bookingRoomId: 'room-2', baseAmount: 1500, discountAmount: 0, amount: 1500 },
      { serviceUsageId: 'service-1', baseAmount: 500, discountAmount: 0, amount: 500 }
    ];

    it('should apply discount to specific booking room', () => {
      const discounts = new Map();
      discounts.set('promo-1', {
        amount: 100,
        target: { bookingRoomId: 'room-1', customerPromotionId: 'promo-1' }
      });

      const result = applyDiscountsToDetails(details, discounts);

      expect(result[0].discountAmount).toBe(100);
      expect(result[0].amount).toBe(900); // 1000 - 100
      expect(result[1].discountAmount).toBe(0);
      expect(result[2].discountAmount).toBe(0);
    });

    it('should apply discount to specific service usage', () => {
      const discounts = new Map();
      discounts.set('promo-1', {
        amount: 50,
        target: { serviceUsageId: 'service-1', customerPromotionId: 'promo-1' }
      });

      const result = applyDiscountsToDetails(details, discounts);

      expect(result[2].discountAmount).toBe(50);
      expect(result[2].amount).toBe(450); // 500 - 50
      expect(result[0].discountAmount).toBe(0);
      expect(result[1].discountAmount).toBe(0);
    });

    it('should apply multiple discounts to same detail', () => {
      const discounts = new Map();
      discounts.set('promo-1', {
        amount: 100,
        target: { bookingRoomId: 'room-1', customerPromotionId: 'promo-1' }
      });
      discounts.set('promo-2', {
        amount: 50,
        target: { bookingRoomId: 'room-1', customerPromotionId: 'promo-2' }
      });

      const result = applyDiscountsToDetails(details, discounts);

      expect(result[0].discountAmount).toBe(150); // 100 + 50
      expect(result[0].amount).toBe(850); // 1000 - 150
    });

    it('should not apply transaction-level discounts in this function', () => {
      const discounts = new Map();
      discounts.set('promo-1', {
        amount: 200,
        target: { customerPromotionId: 'promo-1' }
      });

      const result = applyDiscountsToDetails(details, discounts);

      // Transaction-level discounts should not modify details directly
      expect(result[0].discountAmount).toBe(0);
      expect(result[1].discountAmount).toBe(0);
      expect(result[2].discountAmount).toBe(0);
    });

    it('should handle empty discounts map', () => {
      const discounts = new Map();
      const result = applyDiscountsToDetails(details, discounts);

      expect(result[0].discountAmount).toBe(0);
      expect(result[0].amount).toBe(1000);
      expect(result[1].discountAmount).toBe(0);
      expect(result[2].discountAmount).toBe(0);
    });

    it('should preserve original detail properties', () => {
      const discounts = new Map();
      const result = applyDiscountsToDetails(details, discounts);

      expect(result[0].bookingRoomId).toBe('room-1');
      expect(result[0].baseAmount).toBe(1000);
      expect(result[2].serviceUsageId).toBe('service-1');
    });
  });

  describe('calculateDiscounts', () => {
    it('should calculate discounts for all promotion applications', async () => {
      const promotionApplications = [{ customerPromotionId: 'cp-1', bookingRoomId: 'room-1' }];

      const transactionDetails = [
        { bookingRoomId: 'room-1', baseAmount: 1000, discountAmount: 0, amount: 1000 }
      ];

      mockPrisma.customerPromotion.findUnique = (jest.fn() as any).mockResolvedValue({
        id: 'cp-1',
        promotionId: 'promo-1'
      }) as any;

      mockPromotionService.calculateDiscount = (jest.fn() as any).mockResolvedValue(100);

      const result = await calculateDiscounts(
        promotionApplications,
        transactionDetails,
        mockPromotionService as any,
        mockPrisma as any
      );

      expect(result.size).toBe(1);
      expect(result.get('cp-1')).toEqual({
        amount: 100,
        target: promotionApplications[0]
      });
    });

    it('should throw error if customer promotion not found', async () => {
      const promotionApplications = [
        { customerPromotionId: 'non-existent', bookingRoomId: 'room-1' }
      ];

      const transactionDetails = [
        { bookingRoomId: 'room-1', baseAmount: 1000, discountAmount: 0, amount: 1000 }
      ];

      mockPrisma.customerPromotion.findUnique = (jest.fn() as any).mockResolvedValue(null);

      await expect(
        calculateDiscounts(
          promotionApplications,
          transactionDetails,
          mockPromotionService as any,
          mockPrisma as any
        )
      ).rejects.toThrow(ApiError);
    });

    it('should handle multiple promotions', async () => {
      const promotionApplications = [
        { customerPromotionId: 'cp-1', bookingRoomId: 'room-1' },
        { customerPromotionId: 'cp-2', serviceUsageId: 'service-1' }
      ];

      const transactionDetails = [
        { bookingRoomId: 'room-1', baseAmount: 1000, discountAmount: 0, amount: 1000 },
        { serviceUsageId: 'service-1', baseAmount: 500, discountAmount: 0, amount: 500 }
      ];

      mockPrisma.customerPromotion.findUnique = (jest
        .fn() as any)
        .mockResolvedValueOnce({ id: 'cp-1', promotionId: 'promo-1' })
        .mockResolvedValueOnce({ id: 'cp-2', promotionId: 'promo-2' });

      mockPromotionService.calculateDiscount = (jest
        .fn() as any)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(50);

      const result = await calculateDiscounts(
        promotionApplications,
        transactionDetails,
        mockPromotionService as any,
        mockPrisma as any
      );

      expect(result.size).toBe(2);
      expect(result.get('cp-1')?.amount).toBe(100);
      expect(result.get('cp-2')?.amount).toBe(50);
    });
  });
});
