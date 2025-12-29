/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { processFullBookingPayment } from '../../../../src/services/transaction/handlers/full-booking-payment';
import { createMockPrismaClient } from '../../../utils/testContainer';
import { PrismaClient, Prisma, TransactionStatus, BookingStatus, PaymentMethod, TransactionType } from '@prisma/client';
import ApiError from '../../../../src/utils/ApiError';

// Mock dependencies
jest.mock('../../../../src/services/transaction/validators/promotion-validator');
jest.mock('../../../../src/services/transaction/calculators/discount-calculator');
jest.mock('../../../../src/services/transaction/calculators/amount-aggregator');
jest.mock('../../../../src/services/transaction/helpers/booking-updater');

describe('processFullBookingPayment', () => {
  let mockPrisma: any;
  let mockActivityService: any;
  let mockUsageServiceService: any;
  let mockPromotionService: any;
  let mockTx: any;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    
    mockTx = {
      booking: {
        findUnique: jest.fn(),
        update: jest.fn()
      },
      bookingRoom: {
        update: jest.fn(),
        updateMany: jest.fn()
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

    // Setup mock implementations
    const { validatePromotions } = require('../../../../src/services/transaction/validators/promotion-validator');
    validatePromotions.mockResolvedValue(undefined);

    const { calculateDiscounts, applyDiscountsToDetails } = require('../../../../src/services/transaction/calculators/discount-calculator');
    calculateDiscounts.mockResolvedValue(new Map());
    applyDiscountsToDetails.mockImplementation((details: any) => details);

    const { aggregateTransactionAmounts } = require('../../../../src/services/transaction/calculators/amount-aggregator');
    aggregateTransactionAmounts.mockReturnValue({
      baseAmount: 200,
      discountAmount: 0,
      amount: 200
    });

    const { updateBookingTotals, getDefaultDescription } = require('../../../../src/services/transaction/helpers/booking-updater');
    updateBookingTotals.mockResolvedValue(undefined);
    getDefaultDescription.mockReturnValue('Payment for booking');
  });

  it('should throw error if bookingId is missing', async () => {
    const payload = {
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    await expect(
      processFullBookingPayment(
        payload as any,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      )
    ).rejects.toThrow('Booking ID is required');
  });

  it('should throw error if booking not found', async () => {
    const payload = {
      bookingId: 'booking-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    mockTx.booking.findUnique.mockResolvedValue(null);

    await expect(
      processFullBookingPayment(
        payload,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      )
    ).rejects.toThrow('Booking not found');
  });

  it('should successfully process full booking payment without promotions', async () => {
    const payload = {
      bookingId: 'booking-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123',
      promotionApplications: []
    };

    const booking = {
      id: 'booking-123',
      bookingCode: 'BK123',
      bookingRooms: [
        {
          id: 'room-1',
          subtotalRoom: new Prisma.Decimal(100),
          totalPaid: new Prisma.Decimal(0),
          totalAmount: new Prisma.Decimal(100),
          room: { id: 'room-1' },
          serviceUsages: [
            {
              id: 'service-1',
              totalPrice: new Prisma.Decimal(50),
              totalPaid: new Prisma.Decimal(0),
              status: 'ACTIVE'
            }
          ]
        }
      ]
    };

    const createdTransaction = {
      id: 'transaction-123',
      bookingId: 'booking-123',
      type: TransactionType.ROOM_CHARGE,
      amount: new Prisma.Decimal(150),
      status: TransactionStatus.COMPLETED
    };

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.transaction.create.mockResolvedValue(createdTransaction);
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-1' });
    mockTx.transaction.findUnique.mockResolvedValue({
      ...createdTransaction,
      details: [],
      usedPromotions: []
    });

    const result = await processFullBookingPayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(result.transaction).toBeDefined();
    expect(result.booking).toBeDefined();
    expect(mockTx.transaction.create).toHaveBeenCalled();
    expect(mockTx.transactionDetail.create).toHaveBeenCalledTimes(2); // Room + Service
    expect(mockActivityService.createTransactionActivity).toHaveBeenCalled();
  });

  it('should process with promotions and update customer promotions', async () => {
    const payload = {
      bookingId: 'booking-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123',
      promotionApplications: [
        {
          customerPromotionId: 'customer-promo-1',
          bookingRoomId: 'room-1'
        }
      ]
    };

    const booking = {
      id: 'booking-123',
      bookingCode: 'BK123',
      bookingRooms: [
        {
          id: 'room-1',
          subtotalRoom: new Prisma.Decimal(100),
          totalPaid: new Prisma.Decimal(0),
          totalAmount: new Prisma.Decimal(100),
          room: { id: 'room-1' },
          serviceUsages: []
        }
      ]
    };

    const customerPromotion = {
      id: 'customer-promo-1',
      promotionId: 'promo-1'
    };

    // Mock discount calculation
    const { calculateDiscounts, applyDiscountsToDetails } = require('../../../../src/services/transaction/calculators/discount-calculator');
    const discountMap = new Map();
    discountMap.set('customer-promo-1', { amount: 10, customerPromotionId: 'customer-promo-1' });
    calculateDiscounts.mockResolvedValue(discountMap);
    applyDiscountsToDetails.mockReturnValue([
      {
        bookingRoomId: 'room-1',
        baseAmount: 100,
        discountAmount: 10,
        amount: 90
      }
    ]);

    const { aggregateTransactionAmounts } = require('../../../../src/services/transaction/calculators/amount-aggregator');
    aggregateTransactionAmounts.mockReturnValue({
      baseAmount: 100,
      discountAmount: 10,
      amount: 90
    });

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.transaction.create.mockResolvedValue({ id: 'transaction-123' });
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-1' });
    mockTx.transactionDetail.findFirst.mockResolvedValue({ id: 'detail-1' });
    mockTx.customerPromotion.findUnique.mockResolvedValue(customerPromotion);
    mockTx.transaction.findUnique.mockResolvedValue({
      id: 'transaction-123',
      details: [],
      usedPromotions: []
    });

    await processFullBookingPayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(mockTx.usedPromotion.create).toHaveBeenCalled();
    expect(mockTx.customerPromotion.update).toHaveBeenCalledWith({
      where: { id: 'customer-promo-1' },
      data: expect.objectContaining({
        status: 'USED',
        transactionDetailId: 'detail-1'
      })
    });
  });

  it('should update booking status to CONFIRMED for DEPOSIT transaction', async () => {
    const payload = {
      bookingId: 'booking-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.DEPOSIT,
      employeeId: 'employee-123'
    };

    const booking = {
      id: 'booking-123',
      bookingCode: 'BK123',
      bookingRooms: [
        {
          id: 'room-1',
          subtotalRoom: new Prisma.Decimal(100),
          totalPaid: new Prisma.Decimal(0),
          totalAmount: new Prisma.Decimal(100),
          room: { id: 'room-1' },
          serviceUsages: []
        }
      ]
    };

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.transaction.create.mockResolvedValue({ id: 'transaction-123' });
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-1' });
    mockTx.transaction.findUnique.mockResolvedValue({
      id: 'transaction-123',
      details: [],
      usedPromotions: []
    });

    await processFullBookingPayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(mockTx.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-123' },
      data: { status: BookingStatus.CONFIRMED }
    });

    expect(mockTx.bookingRoom.updateMany).toHaveBeenCalledWith({
      where: { bookingId: 'booking-123', status: BookingStatus.PENDING },
      data: { status: BookingStatus.CONFIRMED }
    });
  });

  it('should skip rooms with zero balance', async () => {
    const payload = {
      bookingId: 'booking-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    const booking = {
      id: 'booking-123',
      bookingCode: 'BK123',
      bookingRooms: [
        {
          id: 'room-1',
          subtotalRoom: new Prisma.Decimal(100),
          totalPaid: new Prisma.Decimal(100), // Fully paid
          totalAmount: new Prisma.Decimal(100),
          room: { id: 'room-1' },
          serviceUsages: []
        }
      ]
    };

    const { applyDiscountsToDetails } = require('../../../../src/services/transaction/calculators/discount-calculator');
    applyDiscountsToDetails.mockReturnValue([]);

    const { aggregateTransactionAmounts } = require('../../../../src/services/transaction/calculators/amount-aggregator');
    aggregateTransactionAmounts.mockReturnValue({
      baseAmount: 0,
      discountAmount: 0,
      amount: 0
    });

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.transaction.create.mockResolvedValue({ id: 'transaction-123' });
    mockTx.transaction.findUnique.mockResolvedValue({
      id: 'transaction-123',
      details: [],
      usedPromotions: []
    });

    await processFullBookingPayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(mockTx.transactionDetail.create).not.toHaveBeenCalled();
  });

  it('should update service payment through usageServiceService', async () => {
    const payload = {
      bookingId: 'booking-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    const booking = {
      id: 'booking-123',
      bookingCode: 'BK123',
      bookingRooms: [
        {
          id: 'room-1',
          subtotalRoom: new Prisma.Decimal(0),
          totalPaid: new Prisma.Decimal(0),
          totalAmount: new Prisma.Decimal(0),
          room: { id: 'room-1' },
          serviceUsages: [
            {
              id: 'service-1',
              totalPrice: new Prisma.Decimal(50),
              totalPaid: new Prisma.Decimal(0),
              status: 'ACTIVE'
            }
          ]
        }
      ]
    };

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.transaction.create.mockResolvedValue({ id: 'transaction-123' });
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-1' });
    mockTx.transaction.findUnique.mockResolvedValue({
      id: 'transaction-123',
      details: [],
      usedPromotions: []
    });

    await processFullBookingPayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(mockUsageServiceService.updateServiceUsagePayment).toHaveBeenCalledWith(
      'service-1',
      50,
      'employee-123',
      mockTx
    );
  });

  it('should skip cancelled services', async () => {
    const payload = {
      bookingId: 'booking-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    const booking = {
      id: 'booking-123',
      bookingCode: 'BK123',
      bookingRooms: [
        {
          id: 'room-1',
          subtotalRoom: new Prisma.Decimal(100),
          totalPaid: new Prisma.Decimal(0),
          totalAmount: new Prisma.Decimal(100),
          room: { id: 'room-1' },
          serviceUsages: [] // No services (cancelled ones filtered in query)
        }
      ]
    };

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.transaction.create.mockResolvedValue({ id: 'transaction-123' });
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-1' });
    mockTx.transaction.findUnique.mockResolvedValue({
      id: 'transaction-123',
      details: [],
      usedPromotions: []
    });

    await processFullBookingPayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(mockUsageServiceService.updateServiceUsagePayment).not.toHaveBeenCalled();
  });

  it('should handle promotion without matching detail gracefully', async () => {
    const payload = {
      bookingId: 'booking-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123',
      promotionApplications: [
        {
          customerPromotionId: 'customer-promo-1',
          serviceUsageId: 'non-existent-service'
        }
      ]
    };

    const booking = {
      id: 'booking-123',
      bookingCode: 'BK123',
      bookingRooms: [
        {
          id: 'room-1',
          subtotalRoom: new Prisma.Decimal(100),
          totalPaid: new Prisma.Decimal(0),
          totalAmount: new Prisma.Decimal(100),
          room: { id: 'room-1' },
          serviceUsages: []
        }
      ]
    };

    const { calculateDiscounts } = require('../../../../src/services/transaction/calculators/discount-calculator');
    const discountMap = new Map();
    discountMap.set('customer-promo-1', { amount: 10, customerPromotionId: 'customer-promo-1' });
    calculateDiscounts.mockResolvedValue(discountMap);

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.transaction.create.mockResolvedValue({ id: 'transaction-123' });
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-1' });
    mockTx.transaction.findUnique.mockResolvedValue({
      id: 'transaction-123',
      details: [],
      usedPromotions: []
    });

    await processFullBookingPayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    // Should not crash, just skip the invalid promotion
    expect(mockTx.usedPromotion.create).not.toHaveBeenCalled();
  });
});
