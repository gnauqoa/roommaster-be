/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { PromotionService } from '../../../src/services/promotion.service';
import { createMockPrismaClient } from '../../utils/testContainer';
import {
  PrismaClient,
  Prisma,
  PromotionType,
  PromotionScope,
  CustomerPromotionStatus
} from '@prisma/client';
import ApiError from '../../../src/utils/ApiError';

describe('PromotionService', () => {
  let promotionService: PromotionService;
  let mockPrisma: jest.Mocked<Partial<PrismaClient>>;
  let mockActivityService: any;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();

    // Initialize promotion and customerPromotion mocks
    // @ts-expect-error - Mock setup
    mockPrisma.promotion = {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    // @ts-expect-error - Mock setup
    mockPrisma.customerPromotion = {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn()
    } as any;

    mockActivityService = {
      createActivity: jest.fn()
    };

    promotionService = new PromotionService(mockPrisma as PrismaClient, mockActivityService);
    jest.clearAllMocks();
  });

  describe('createPromotion', () => {
    it('should throw error if start date is after end date', async () => {
      const promotionData = {
        code: 'SUMMER2024',
        type: PromotionType.PERCENTAGE,
        value: 20,
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'), // Before start date
        employeeId: 'employee-123'
      };

      await expect(promotionService.createPromotion(promotionData)).rejects.toThrow(ApiError);
      await expect(promotionService.createPromotion(promotionData)).rejects.toThrow(
        'Start date must be before end date'
      );
    });

    it('should throw error if promotion code already exists', async () => {
      const promotionData = {
        code: 'EXISTING',
        type: PromotionType.PERCENTAGE,
        value: 15,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        employeeId: 'employee-123'
      };
      const existingPromotion = {
        id: 'promo-123',
        code: 'EXISTING',
        type: PromotionType.PERCENTAGE,
        value: 10
      };

      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.findUnique = jest.fn().mockResolvedValue(existingPromotion);

      await expect(promotionService.createPromotion(promotionData)).rejects.toThrow(ApiError);
      await expect(promotionService.createPromotion(promotionData)).rejects.toThrow(
        'Promotion code "EXISTING" already exists'
      );
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate percentage discount correctly', async () => {
      const promotion = {
        id: 'promo-123',
        type: PromotionType.PERCENTAGE,
        value: new Prisma.Decimal(20), // 20%
        minBookingAmount: new Prisma.Decimal(0),
        maxDiscount: null
      };

      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.findUnique = jest.fn().mockResolvedValue(promotion);

      const discount = await promotionService.calculateDiscount({
        promotionId: 'promo-123',
        baseAmount: 1000
      });

      expect(discount).toBe(200); // 20% of 1000
    });

    it('should apply max discount cap for percentage promotions', async () => {
      const promotion = {
        id: 'promo-123',
        type: PromotionType.PERCENTAGE,
        value: new Prisma.Decimal(50), // 50%
        minBookingAmount: new Prisma.Decimal(0),
        maxDiscount: new Prisma.Decimal(100) // Cap at 100
      };

      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.findUnique = jest.fn().mockResolvedValue(promotion);

      const discount = await promotionService.calculateDiscount({
        promotionId: 'promo-123',
        baseAmount: 1000 // 50% would be 500, but capped at 100
      });

      expect(discount).toBe(100);
    });

    it('should calculate fixed amount discount correctly', async () => {
      const promotion = {
        id: 'promo-123',
        type: PromotionType.FIXED_AMOUNT,
        value: new Prisma.Decimal(50), // Fixed 50
        minBookingAmount: new Prisma.Decimal(0),
        maxDiscount: null
      };

      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.findUnique = jest.fn().mockResolvedValue(promotion);

      const discount = await promotionService.calculateDiscount({
        promotionId: 'promo-123',
        baseAmount: 1000
      });

      expect(discount).toBe(50);
    });

    it('should not exceed base amount for fixed discount', async () => {
      const promotion = {
        id: 'promo-123',
        type: PromotionType.FIXED_AMOUNT,
        value: new Prisma.Decimal(150), // Fixed 150
        minBookingAmount: new Prisma.Decimal(0),
        maxDiscount: null
      };

      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.findUnique = jest.fn().mockResolvedValue(promotion);

      const discount = await promotionService.calculateDiscount({
        promotionId: 'promo-123',
        baseAmount: 100 // Discount can't exceed this
      });

      expect(discount).toBe(100);
    });

    it('should return 0 if base amount is below minimum', async () => {
      const promotion = {
        id: 'promo-123',
        type: PromotionType.PERCENTAGE,
        value: new Prisma.Decimal(20),
        minBookingAmount: new Prisma.Decimal(500), // Minimum 500
        maxDiscount: null
      };

      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.findUnique = jest.fn().mockResolvedValue(promotion);

      const discount = await promotionService.calculateDiscount({
        promotionId: 'promo-123',
        baseAmount: 300 // Below minimum
      });

      expect(discount).toBe(0);
    });

    it('should throw error if promotion not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        promotionService.calculateDiscount({
          promotionId: 'non-existent',
          baseAmount: 1000
        })
      ).rejects.toThrow(ApiError);
      await expect(
        promotionService.calculateDiscount({
          promotionId: 'non-existent',
          baseAmount: 1000
        })
      ).rejects.toThrow('Promotion not found');
    });
  });

  describe('validatePromotionApplicability', () => {
    it('should return invalid if customer promotion not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.customerPromotion!.findUnique = jest.fn().mockResolvedValue(null);

      const result = await promotionService.validatePromotionApplicability({
        customerPromotionId: 'non-existent',
        targetType: 'room',
        bookingRoomId: 'room-123'
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Customer promotion not found');
    });

    it('should return invalid if promotion is not available', async () => {
      const customerPromotion = {
        id: 'cp-123',
        status: CustomerPromotionStatus.USED,
        promotion: {
          id: 'promo-123',
          scope: PromotionScope.ALL,
          disabledAt: null,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customerPromotion!.findUnique = jest.fn().mockResolvedValue(customerPromotion);

      const result = await promotionService.validatePromotionApplicability({
        customerPromotionId: 'cp-123',
        targetType: 'room',
        bookingRoomId: 'room-123'
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('used');
    });

    it('should return invalid if promotion is disabled', async () => {
      const customerPromotion = {
        id: 'cp-123',
        status: CustomerPromotionStatus.AVAILABLE,
        promotion: {
          id: 'promo-123',
          scope: PromotionScope.ALL,
          disabledAt: new Date('2024-01-01'), // Disabled
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customerPromotion!.findUnique = jest.fn().mockResolvedValue(customerPromotion);

      const result = await promotionService.validatePromotionApplicability({
        customerPromotionId: 'cp-123',
        targetType: 'room',
        bookingRoomId: 'room-123'
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Promotion has been disabled');
    });

    it('should return invalid if ROOM scope promotion applied to non-room target', async () => {
      const customerPromotion = {
        id: 'cp-123',
        status: CustomerPromotionStatus.AVAILABLE,
        promotion: {
          id: 'promo-123',
          scope: PromotionScope.ROOM, // Room-only promotion
          disabledAt: null,
          startDate: new Date('2020-01-01'),
          endDate: new Date('2030-12-31')
        }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customerPromotion!.findUnique = jest.fn().mockResolvedValue(customerPromotion);

      const result = await promotionService.validatePromotionApplicability({
        customerPromotionId: 'cp-123',
        targetType: 'service', // Trying to apply to service
        serviceUsageId: 'service-123'
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('room charges');
    });

    it('should return invalid if SERVICE scope promotion applied to non-service target', async () => {
      const customerPromotion = {
        id: 'cp-123',
        status: CustomerPromotionStatus.AVAILABLE,
        promotion: {
          id: 'promo-123',
          scope: PromotionScope.SERVICE, // Service-only promotion
          disabledAt: null,
          startDate: new Date('2020-01-01'),
          endDate: new Date('2030-12-31')
        }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customerPromotion!.findUnique = jest.fn().mockResolvedValue(customerPromotion);

      const result = await promotionService.validatePromotionApplicability({
        customerPromotionId: 'cp-123',
        targetType: 'room', // Trying to apply to room
        bookingRoomId: 'room-123'
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('service charges');
    });

    it('should return valid for ALL scope promotion on any target', async () => {
      const customerPromotion = {
        id: 'cp-123',
        status: CustomerPromotionStatus.AVAILABLE,
        promotion: {
          id: 'promo-123',
          scope: PromotionScope.ALL, // Can apply to anything
          disabledAt: null,
          startDate: new Date('2020-01-01'),
          endDate: new Date('2030-12-31')
        }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customerPromotion!.findUnique = jest.fn().mockResolvedValue(customerPromotion);

      const result = await promotionService.validatePromotionApplicability({
        customerPromotionId: 'cp-123',
        targetType: 'transaction'
      });

      expect(result.valid).toBe(true);
      expect(result.promotion).toBeDefined();
    });
  });

  describe('expirePromotions', () => {
    it('should expire available promotions past their end date', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.customerPromotion!.updateMany = jest.fn().mockResolvedValue({ count: 5 });

      const result = await promotionService.expirePromotions();

      expect(result.count).toBe(5);
      expect(mockPrisma.customerPromotion!.updateMany).toHaveBeenCalledWith({
        where: {
          status: CustomerPromotionStatus.AVAILABLE,
          promotion: {
            endDate: expect.objectContaining({ lt: expect.any(Date) })
          }
        },
        data: {
          status: CustomerPromotionStatus.EXPIRED
        }
      });
    });
  });
});
