/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { processBookingServicePayment } from '../../../../src/services/transaction/handlers/booking-service-payment';
import { createMockPrismaClient } from '../../../utils/testContainer';
import { Prisma, TransactionStatus, PaymentMethod, TransactionType } from '@prisma/client';
import ApiError from '../../../../src/utils/ApiError';
import * as promotionValidator from '../../../../src/services/transaction/validators/promotion-validator';
import * as discountCalculator from '../../../../src/services/transaction/calculators/discount-calculator';
import * as amountAggregator from '../../../../src/services/transaction/calculators/amount-aggregator';
import * as bookingUpdater from '../../../../src/services/transaction/helpers/booking-updater';

// Mock dependencies
jest.mock('../../../../src/services/transaction/validators/promotion-validator');
jest.mock('../../../../src/services/transaction/calculators/discount-calculator');
jest.mock('../../../../src/services/transaction/calculators/amount-aggregator');
jest.mock('../../../../src/services/transaction/helpers/booking-updater');

describe('processBookingServicePayment', () => {
  let mockPrisma: any;
  let mockActivityService: any;
  let mockUsageServiceService: any;
  let mockPromotionService: any;
  let mockTx: any;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();

    // Mock transaction
    mockTx = {
      serviceUsage: {
        findUnique: jest.fn()
      },
      transaction: {
        create: jest.fn(),
        findUnique: jest.fn()
      },
      transactionDetail: {
        create: jest.fn(),
        findFirst: jest.fn()
      },
      customerPromotion: {
        findUnique: jest.fn(),
        update: jest.fn()
      },
      usedPromotion: {
        create: jest.fn()
      },
      booking: {
        findUnique: jest.fn()
      }
    };

    mockPrisma.$transaction = jest.fn((callback: any) => callback(mockTx)) as any;

    mockActivityService = {
      createTransactionActivity: jest.fn()
    };

    mockUsageServiceService = {
      updateServiceUsagePayment: jest.fn()
    };

    mockPromotionService = {};

    jest.clearAllMocks();

    jest.mocked(promotionValidator.validatePromotions).mockResolvedValue(undefined);

    jest.mocked(discountCalculator.calculateDiscounts).mockResolvedValue(new Map());
    jest
      .mocked(discountCalculator.applyDiscountsToDetails)
      .mockImplementation((details: any) => details);

    jest.mocked(amountAggregator.aggregateTransactionAmounts).mockReturnValue({
      baseAmount: 100,
      discountAmount: 0,
      amount: 100
    });

    jest.mocked(bookingUpdater.updateBookingTotals).mockResolvedValue(undefined);
  });

  it('should throw error if bookingId is missing', async () => {
    const payload = {
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    await expect(
      processBookingServicePayment(
        payload as any,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      )
    ).rejects.toThrow(ApiError);
  });

  it('should throw error if serviceUsageId is missing', async () => {
    const payload = {
      bookingId: 'booking-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    await expect(
      processBookingServicePayment(
        payload as any,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      )
    ).rejects.toThrow(ApiError);
  });

  it('should throw error if service usage not found', async () => {
    const payload = {
      bookingId: 'booking-123',
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    mockTx.serviceUsage.findUnique.mockResolvedValue(null);

    await expect(
      processBookingServicePayment(
        payload,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      )
    ).rejects.toThrow('Service usage not found');
  });

  it('should throw error if service does not belong to booking', async () => {
    const payload = {
      bookingId: 'booking-123',
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    const serviceUsage = {
      id: 'service-123',
      totalPrice: new Prisma.Decimal(100),
      totalPaid: new Prisma.Decimal(0),
      service: { name: 'Test Service' },
      bookingRoom: {
        bookingId: 'different-booking-456',
        booking: {}
      }
    };

    mockTx.serviceUsage.findUnique.mockResolvedValue(serviceUsage);

    await expect(
      processBookingServicePayment(
        payload,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      )
    ).rejects.toThrow('Service does not belong to this booking');
  });

  it('should throw error if service is already fully paid', async () => {
    const payload = {
      bookingId: 'booking-123',
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    const serviceUsage = {
      id: 'service-123',
      totalPrice: new Prisma.Decimal(100),
      totalPaid: new Prisma.Decimal(100), // Fully paid
      service: { name: 'Test Service' },
      bookingRoom: {
        bookingId: 'booking-123',
        booking: {}
      }
    };

    mockTx.serviceUsage.findUnique.mockResolvedValue(serviceUsage);

    await expect(
      processBookingServicePayment(
        payload,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      )
    ).rejects.toThrow('Service is already fully paid');
  });

  it('should successfully process booking service payment without promotions', async () => {
    const payload = {
      bookingId: 'booking-123',
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123',
      promotionApplications: []
    };

    const serviceUsage = {
      id: 'service-123',
      totalPrice: new Prisma.Decimal(100),
      totalPaid: new Prisma.Decimal(0),
      service: { name: 'Test Service' },
      bookingRoom: {
        bookingId: 'booking-123',
        booking: {}
      }
    };

    const createdTransaction = {
      id: 'transaction-123',
      bookingId: 'booking-123',
      type: TransactionType.SERVICE_CHARGE,
      amount: new Prisma.Decimal(100),
      status: TransactionStatus.COMPLETED
    };

    const createdDetail = {
      id: 'detail-123',
      transactionId: 'transaction-123',
      serviceUsageId: 'service-123',
      amount: new Prisma.Decimal(100)
    };

    mockTx.serviceUsage.findUnique.mockResolvedValue(serviceUsage);
    mockTx.transaction.create.mockResolvedValue(createdTransaction);
    mockTx.transactionDetail.create.mockResolvedValue(createdDetail);
    mockTx.transaction.findUnique.mockResolvedValue({
      ...createdTransaction,
      details: [createdDetail],
      usedPromotions: []
    });
    mockTx.booking.findUnique.mockResolvedValue({
      id: 'booking-123',
      bookingRooms: [],
      transactions: []
    });

    const result = await processBookingServicePayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(result.transaction).toBeDefined();
    expect(result.booking).toBeDefined();
    expect(mockTx.transaction.create).toHaveBeenCalled();
    expect(mockTx.transactionDetail.create).toHaveBeenCalled();
    expect(mockUsageServiceService.updateServiceUsagePayment).toHaveBeenCalledWith(
      'service-123',
      100,
      'employee-123',
      mockTx
    );
    expect(mockActivityService.createTransactionActivity).toHaveBeenCalled();
  });

  it('should successfully process booking service payment with promotions', async () => {
    const payload = {
      bookingId: 'booking-123',
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123',
      promotionApplications: [
        {
          customerPromotionId: 'customer-promo-123'
        }
      ]
    };

    const serviceUsage = {
      id: 'service-123',
      totalPrice: new Prisma.Decimal(100),
      totalPaid: new Prisma.Decimal(0),
      service: { name: 'Test Service' },
      bookingRoom: {
        bookingId: 'booking-123',
        booking: {}
      }
    };

    const createdTransaction = {
      id: 'transaction-123',
      bookingId: 'booking-123',
      type: TransactionType.SERVICE_CHARGE,
      amount: new Prisma.Decimal(90),
      status: TransactionStatus.COMPLETED
    };

    const createdDetail = {
      id: 'detail-123',
      transactionId: 'transaction-123',
      serviceUsageId: 'service-123',
      amount: new Prisma.Decimal(90)
    };

    const customerPromotion = {
      id: 'customer-promo-123',
      promotionId: 'promo-123'
    };

    const discountMap = new Map();
    discountMap.set('customer-promo-123', {
      amount: 10,
      customerPromotionId: 'customer-promo-123'
    });
    jest.mocked(discountCalculator.calculateDiscounts).mockResolvedValue(discountMap);
    jest.mocked(discountCalculator.applyDiscountsToDetails).mockReturnValue([
      {
        serviceUsageId: 'service-123',
        baseAmount: 100,
        discountAmount: 10,
        amount: 90
      }
    ]);

    jest.mocked(amountAggregator.aggregateTransactionAmounts).mockReturnValue({
      baseAmount: 100,
      discountAmount: 10,
      amount: 90
    });

    mockTx.serviceUsage.findUnique.mockResolvedValue(serviceUsage);
    mockTx.transaction.create.mockResolvedValue(createdTransaction);
    mockTx.transactionDetail.create.mockResolvedValue(createdDetail);
    mockTx.customerPromotion.findUnique.mockResolvedValue(customerPromotion);
    mockTx.transaction.findUnique.mockResolvedValue({
      ...createdTransaction,
      details: [createdDetail],
      usedPromotions: []
    });
    mockTx.booking.findUnique.mockResolvedValue({
      id: 'booking-123',
      bookingRooms: [],
      transactions: []
    });

    const result = await processBookingServicePayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(result.transaction).toBeDefined();
    expect(mockTx.usedPromotion.create).toHaveBeenCalled();
    expect(mockTx.customerPromotion.update).toHaveBeenCalledWith({
      where: { id: 'customer-promo-123' },
      data: expect.objectContaining({
        status: 'USED',
        transactionDetailId: 'detail-123'
      })
    });
  });

  it('should handle custom description', async () => {
    const payload = {
      bookingId: 'booking-123',
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123',
      description: 'Custom payment description'
    };

    const serviceUsage = {
      id: 'service-123',
      totalPrice: new Prisma.Decimal(100),
      totalPaid: new Prisma.Decimal(0),
      service: { name: 'Test Service' },
      bookingRoom: {
        bookingId: 'booking-123',
        booking: {}
      }
    };

    mockTx.serviceUsage.findUnique.mockResolvedValue(serviceUsage);
    mockTx.transaction.create.mockResolvedValue({ id: 'transaction-123' });
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-123' });
    mockTx.transaction.findUnique.mockResolvedValue({
      id: 'transaction-123',
      details: [],
      usedPromotions: []
    });
    mockTx.booking.findUnique.mockResolvedValue({ id: 'booking-123' });

    await processBookingServicePayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(mockTx.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: 'Custom payment description'
        })
      })
    );
  });

  it('should skip promotions with zero discount amount', async () => {
    const payload = {
      bookingId: 'booking-123',
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123',
      promotionApplications: [
        {
          customerPromotionId: 'customer-promo-123'
        }
      ]
    };

    const serviceUsage = {
      id: 'service-123',
      totalPrice: new Prisma.Decimal(100),
      totalPaid: new Prisma.Decimal(0),
      service: { name: 'Test Service' },
      bookingRoom: {
        bookingId: 'booking-123',
        booking: {}
      }
    };

    // Mock discount with zero amount
    const discountMap = new Map();
    discountMap.set('customer-promo-123', { amount: 0, customerPromotionId: 'customer-promo-123' });
    jest.mocked(discountCalculator.calculateDiscounts).mockResolvedValue(discountMap);

    mockTx.serviceUsage.findUnique.mockResolvedValue(serviceUsage);
    mockTx.transaction.create.mockResolvedValue({ id: 'transaction-123' });
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-123' });
    mockTx.transaction.findUnique.mockResolvedValue({
      id: 'transaction-123',
      details: [],
      usedPromotions: []
    });
    mockTx.booking.findUnique.mockResolvedValue({ id: 'booking-123' });

    await processBookingServicePayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(mockTx.usedPromotion.create).not.toHaveBeenCalled();
    expect(mockTx.customerPromotion.update).not.toHaveBeenCalled();
  });
});
