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

const resolvedPromiseMock = <T>(value: T) => jest.fn<() => Promise<T>>().mockResolvedValue(value);

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
      update: jest.fn() as any,
      delete: jest.fn()
    } as any;

    // @ts-expect-error - Mock setup
    mockPrisma.customerPromotion = {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn() as any,
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

  describe('updatePromotion', () => {
    it('should throw error if promotion not found', async () => {
      const payload = {
        id: 'non-existent',
        employeeId: 'employee-123'
      };

      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(promotionService.updatePromotion(payload)).rejects.toThrow('Promotion not found');
    });

    it('should throw error if new code already exists', async () => {
      const existingPromotion = {
        id: 'promo-123',
        code: 'OLD_CODE',
        value: 10
      };

      const codeExists = {
        id: 'promo-456',
        code: 'NEW_CODE'
      };

      const payload = {
        id: 'promo-123',
        code: 'NEW_CODE',
        employeeId: 'employee-123'
      };

      const findUniqueMock = jest.fn<() => Promise<any>>();
      findUniqueMock.mockResolvedValueOnce(existingPromotion).mockResolvedValueOnce(codeExists);
      mockPrisma.promotion!.findUnique = findUniqueMock as any;

      await expect(promotionService.updatePromotion(payload)).rejects.toThrow(
        'Promotion code "NEW_CODE" already exists'
      );
    });

    it('should successfully update promotion', async () => {
      const existingPromotion = {
        id: 'promo-123',
        code: 'OLD_CODE',
        value: 10
      };

      const updatedPromotion = {
        id: 'promo-123',
        code: 'OLD_CODE',
        value: 15
      };

      const payload = {
        id: 'promo-123',
        value: 15,
        employeeId: 'employee-123'
      };

      const findUniqueMock = jest.fn<() => Promise<any>>();
      findUniqueMock.mockResolvedValue(existingPromotion);
      const updateMock = jest.fn<() => Promise<any>>();
      updateMock.mockResolvedValue(updatedPromotion);

      mockPrisma.promotion!.findUnique = findUniqueMock as any;
      mockPrisma.promotion!.update = updateMock as any;
      mockPrisma.$transaction = jest.fn((callback: any) =>
        callback({
          promotion: mockPrisma.promotion
        })
      ) as any;

      const result = await promotionService.updatePromotion(payload);

      expect(result.id).toBe('promo-123');
      expect(mockActivityService.createActivity).toHaveBeenCalled();
    });
  });

  describe('claimPromotion', () => {
    it('should throw error if promotion not found', async () => {
      const payload = {
        customerId: 'customer-123',
        promotionCode: 'INVALID'
      };

      const mockTx = {
        promotion: {
          findUnique: resolvedPromiseMock(null) as any
        }
      };

      mockPrisma.$transaction = jest.fn((callback: any) => callback(mockTx)) as any;

      await expect(promotionService.claimPromotion(payload)).rejects.toThrow('Promotion not found');
    });

    it('should throw error if promotion is disabled', async () => {
      const payload = {
        customerId: 'customer-123',
        promotionCode: 'DISABLED'
      };

      const promotion = {
        id: 'promo-123',
        code: 'DISABLED',
        disabledAt: new Date('2024-01-01'),
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        remainingQty: 10,
        perCustomerLimit: 1
      };

      const mockTx = {
        promotion: {
          findUnique: resolvedPromiseMock(promotion) as any
        }
      };

      mockPrisma.$transaction = jest.fn((callback: any) => callback(mockTx)) as any;

      await expect(promotionService.claimPromotion(payload)).rejects.toThrow(
        'Promotion has been disabled'
      );
    });

    it('should throw error if promotion is not in valid date range', async () => {
      const payload = {
        customerId: 'customer-123',
        promotionCode: 'FUTURE'
      };

      const promotion = {
        id: 'promo-123',
        code: 'FUTURE',
        disabledAt: null,
        startDate: new Date('2030-01-01'),
        endDate: new Date('2030-12-31'),
        remainingQty: 10,
        perCustomerLimit: 1
      };

      const mockTx = {
        promotion: {
          findUnique: resolvedPromiseMock(promotion) as any
        }
      };

      mockPrisma.$transaction = jest.fn((callback: any) => callback(mockTx)) as any;

      await expect(promotionService.claimPromotion(payload)).rejects.toThrow(
        'Promotion is not valid at this time'
      );
    });

    it('should throw error if promotion quantity exhausted', async () => {
      const payload = {
        customerId: 'customer-123',
        promotionCode: 'EXHAUSTED'
      };

      const promotion = {
        id: 'promo-123',
        code: 'EXHAUSTED',
        disabledAt: null,
        startDate: new Date('2020-01-01'),
        endDate: new Date('2030-12-31'),
        remainingQty: 0,
        perCustomerLimit: 1
      };

      const mockTx = {
        promotion: {
          findUnique: resolvedPromiseMock(promotion) as any
        }
      };

      mockPrisma.$transaction = jest.fn((callback: any) => callback(mockTx)) as any;

      await expect(promotionService.claimPromotion(payload)).rejects.toThrow(
        'Promotion is no longer available'
      );
    });

    it('should throw error if per-customer limit reached', async () => {
      const payload = {
        customerId: 'customer-123',
        promotionCode: 'LIMITED'
      };

      const promotion = {
        id: 'promo-123',
        code: 'LIMITED',
        disabledAt: null,
        startDate: new Date('2020-01-01'),
        endDate: new Date('2030-12-31'),
        remainingQty: 10,
        perCustomerLimit: 2
      };

      const mockTx = {
        promotion: {
          findUnique: resolvedPromiseMock(promotion) as any
        },
        customerPromotion: {
          count: resolvedPromiseMock(2) as any,
          create: jest.fn() as any
        }
      };

      mockPrisma.$transaction = jest.fn((callback: any) => callback(mockTx)) as any;

      await expect(promotionService.claimPromotion(payload)).rejects.toThrow(
        'You have already claimed this promotion 2 time(s)'
      );
    });

    it('should successfully claim promotion', async () => {
      const payload = {
        customerId: 'customer-123',
        promotionCode: 'SUMMER2024'
      };

      const promotion = {
        id: 'promo-123',
        code: 'SUMMER2024',
        disabledAt: null,
        startDate: new Date('2020-01-01'),
        endDate: new Date('2030-12-31'),
        remainingQty: 10,
        perCustomerLimit: 1
      };

      const customerPromotion = {
        id: 'cp-123',
        customerId: 'customer-123',
        promotionId: 'promo-123',
        status: CustomerPromotionStatus.AVAILABLE
      };

      const mockTx = {
        promotion: {
          findUnique: resolvedPromiseMock(promotion) as any,
          update: jest.fn() as any
        },
        customerPromotion: {
          count: resolvedPromiseMock(0) as any,
          create: resolvedPromiseMock(customerPromotion) as any
        }
      };

      mockPrisma.$transaction = jest.fn((callback: any) => callback(mockTx)) as any;

      const result = await promotionService.claimPromotion(payload);

      expect(result.id).toBe('cp-123');
      expect(mockTx.promotion.update).toHaveBeenCalledWith({
        where: { id: 'promo-123' },
        data: { remainingQty: 9 }
      });
      expect(mockActivityService.createActivity).toHaveBeenCalled();
    });

    it('should not decrement remainingQty if null', async () => {
      const payload = {
        customerId: 'customer-123',
        promotionCode: 'UNLIMITED'
      };

      const promotion = {
        id: 'promo-123',
        code: 'UNLIMITED',
        disabledAt: null,
        startDate: new Date('2020-01-01'),
        endDate: new Date('2030-12-31'),
        remainingQty: null,
        perCustomerLimit: 1
      };

      const customerPromotion = {
        id: 'cp-123',
        customerId: 'customer-123',
        promotionId: 'promo-123',
        status: CustomerPromotionStatus.AVAILABLE
      };

      const mockTx = {
        promotion: {
          findUnique: resolvedPromiseMock(promotion) as any,
          update: jest.fn() as any
        },
        customerPromotion: {
          count: resolvedPromiseMock(0) as any,
          create: resolvedPromiseMock(customerPromotion) as any
        }
      };

      mockPrisma.$transaction = jest.fn((callback: any) => callback(mockTx)) as any;

      await promotionService.claimPromotion(payload);

      expect(mockTx.promotion.update).not.toHaveBeenCalled();
    });
  });

  describe('applyPromotion', () => {
    it('should throw error if customer promotion not found', async () => {
      const payload = {
        customerPromotionId: 'non-existent',
        transactionDetailId: 'detail-123',
        baseAmount: 100,
        employeeId: 'employee-123'
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customerPromotion!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(promotionService.applyPromotion(payload)).rejects.toThrow(
        'Customer promotion not found'
      );
    });

    it('should throw error if promotion is not available', async () => {
      const payload = {
        customerPromotionId: 'cp-123',
        transactionDetailId: 'detail-123',
        baseAmount: 100,
        employeeId: 'employee-123'
      };

      const customerPromotion = {
        id: 'cp-123',
        status: CustomerPromotionStatus.USED,
        promotionId: 'promo-123',
        customerId: 'customer-123',
        promotion: {
          id: 'promo-123',
          code: 'TEST',
          minBookingAmount: new Prisma.Decimal(0)
        }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customerPromotion!.findUnique = jest.fn().mockResolvedValue(customerPromotion);

      await expect(promotionService.applyPromotion(payload)).rejects.toThrow(
        'Promotion is not available'
      );
    });

    it('should throw error if base amount does not meet minimum', async () => {
      const payload = {
        customerPromotionId: 'cp-123',
        transactionDetailId: 'detail-123',
        baseAmount: 50,
        employeeId: 'employee-123'
      };

      const customerPromotion = {
        id: 'cp-123',
        status: CustomerPromotionStatus.AVAILABLE,
        promotionId: 'promo-123',
        customerId: 'customer-123',
        promotion: {
          id: 'promo-123',
          code: 'TEST',
          type: PromotionType.PERCENTAGE,
          value: new Prisma.Decimal(10),
          minBookingAmount: new Prisma.Decimal(100),
          maxDiscount: null
        }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.customerPromotion!.findUnique = jest.fn().mockResolvedValue(customerPromotion);
      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.findUnique = jest.fn().mockResolvedValue(customerPromotion.promotion);

      await expect(promotionService.applyPromotion(payload)).rejects.toThrow(
        'Base amount (50) does not meet minimum requirement'
      );
    });

    it('should successfully apply promotion', async () => {
      const payload = {
        customerPromotionId: 'cp-123',
        transactionDetailId: 'detail-123',
        baseAmount: 100,
        employeeId: 'employee-123'
      };

      const customerPromotion = {
        id: 'cp-123',
        status: CustomerPromotionStatus.AVAILABLE,
        promotionId: 'promo-123',
        customerId: 'customer-123',
        promotion: {
          id: 'promo-123',
          code: 'TEST',
          type: PromotionType.PERCENTAGE,
          value: new Prisma.Decimal(10),
          minBookingAmount: new Prisma.Decimal(0),
          maxDiscount: null
        },
        customer: { id: 'customer-123' }
      };

      const usedPromotion = {
        id: 'used-123',
        promotionId: 'promo-123',
        discountAmount: 10,
        transactionDetailId: 'detail-123'
      };

      // @ts-ignore
      mockPrisma.customerPromotion!.findUnique = jest.fn().mockResolvedValue(customerPromotion) as any;
      // @ts-ignore
      mockPrisma.customerPromotion!.update = jest.fn() as any;
      // @ts-ignore
      mockPrisma.promotion!.findUnique = jest.fn().mockResolvedValue(customerPromotion.promotion);
      // @ts-ignore
      mockPrisma.usedPromotion = {
        create: resolvedPromiseMock(usedPromotion) as any
      } as any;

      const result = await promotionService.applyPromotion(payload);

      expect(result.discountAmount).toBe(10);
      expect(result.usedPromotion).toBeDefined();
      expect(mockPrisma.customerPromotion!.update).toHaveBeenCalledWith({
        where: { id: 'cp-123' },
        data: expect.objectContaining({
          status: CustomerPromotionStatus.USED,
          transactionDetailId: 'detail-123'
        })
      });
      expect(mockActivityService.createActivity).toHaveBeenCalled();
    });
  });

  describe('getAvailablePromotions', () => {
    it('should return paginated available promotions for customer', async () => {
      const customerPromotions = [
        {
          id: 'cp-1',
          customerId: 'customer-123',
          status: CustomerPromotionStatus.AVAILABLE,
          promotion: { id: 'promo-1', code: 'CODE1' }
        },
        {
          id: 'cp-2',
          customerId: 'customer-123',
          status: CustomerPromotionStatus.AVAILABLE,
          promotion: { id: 'promo-2', code: 'CODE2' }
        }
      ];

      // @ts-expect-error - Mock setup
      mockPrisma.customerPromotion!.findMany = jest.fn().mockResolvedValue(customerPromotions);
      // @ts-expect-error - Mock setup
      mockPrisma.customerPromotion!.count = jest.fn().mockResolvedValue(2);

      const result = await promotionService.getAvailablePromotions('customer-123', {
        page: 1,
        limit: 10
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter by code', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.customerPromotion!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.customerPromotion!.count = jest.fn().mockResolvedValue(0);

      await promotionService.getAvailablePromotions('customer-123', {
        code: 'SUMMER'
      });

      expect(mockPrisma.customerPromotion!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            promotion: expect.objectContaining({
              code: { contains: 'SUMMER', mode: 'insensitive' }
            })
          })
        })
      );
    });
  });

  describe('getActivePromotions', () => {
    it('should return paginated active promotions', async () => {
      const promotions = [
        { id: 'promo-1', code: 'CODE1', remainingQty: 10 },
        { id: 'promo-2', code: 'CODE2', remainingQty: null }
      ];

      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.findMany = jest.fn().mockResolvedValue(promotions);
      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.count = jest.fn().mockResolvedValue(2);

      const result = await promotionService.getActivePromotions({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter by description', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.count = jest.fn().mockResolvedValue(0);

      await promotionService.getActivePromotions({
        description: 'Holiday'
      });

      expect(mockPrisma.promotion!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            description: { contains: 'Holiday', mode: 'insensitive' }
          })
        })
      );
    });

    it('should filter by maxDiscount', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.findMany = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock setup
      mockPrisma.promotion!.count = jest.fn().mockResolvedValue(0);

      await promotionService.getActivePromotions({
        maxDiscount: 50
      });

      expect(mockPrisma.promotion!.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            maxDiscount: { lte: 50 }
          })
        })
      );
    });
  });
});
