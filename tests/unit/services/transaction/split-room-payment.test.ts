/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { processSplitRoomPayment } from '../../../../src/services/transaction/handlers/split-room-payment';
import { createMockPrismaClient } from '../../../utils/testContainer';
import {
  Prisma,
  TransactionStatus,
  BookingStatus,
  PaymentMethod,
  TransactionType
} from '@prisma/client';
import * as promotionValidator from '../../../../src/services/transaction/validators/promotion-validator';
import * as discountCalculator from '../../../../src/services/transaction/calculators/discount-calculator';
import * as amountAggregator from '../../../../src/services/transaction/calculators/amount-aggregator';
import * as bookingUpdater from '../../../../src/services/transaction/helpers/booking-updater';

// Mock dependencies
jest.mock('../../../../src/services/transaction/validators/promotion-validator');
jest.mock('../../../../src/services/transaction/calculators/discount-calculator');
jest.mock('../../../../src/services/transaction/calculators/amount-aggregator');
jest.mock('../../../../src/services/transaction/helpers/booking-updater');

describe('processSplitRoomPayment', () => {
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
        findMany: jest.fn(),
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
      bookingRoomIds: ['room-1'],
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    await expect(
      processSplitRoomPayment(
        payload as any,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      )
    ).rejects.toThrow('Booking ID is required');
  });

  it('should throw error if bookingRoomIds is missing', async () => {
    const payload = {
      bookingId: 'booking-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    await expect(
      processSplitRoomPayment(
        payload as any,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      )
    ).rejects.toThrow('Booking room IDs are required');
  });

  it('should throw error if bookingRoomIds is empty array', async () => {
    const payload = {
      bookingId: 'booking-123',
      bookingRoomIds: [],
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    await expect(
      processSplitRoomPayment(
        payload,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      )
    ).rejects.toThrow('Booking room IDs are required');
  });

  it('should throw error if booking not found', async () => {
    const payload = {
      bookingId: 'booking-123',
      bookingRoomIds: ['room-1'],
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    mockTx.booking.findUnique.mockResolvedValue(null);

    await expect(
      processSplitRoomPayment(
        payload,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      )
    ).rejects.toThrow('Booking not found');
  });

  it('should throw error if some booking rooms not found', async () => {
    const payload = {
      bookingId: 'booking-123',
      bookingRoomIds: ['room-1', 'room-2'],
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    const booking = {
      id: 'booking-123',
      bookingCode: 'BK123'
    };

    const bookingRooms = [
      {
        id: 'room-1',
        subtotalRoom: new Prisma.Decimal(100),
        totalPaid: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        room: { id: 'room-1' },
        serviceUsages: []
      }
      // Missing room-2
    ];

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.bookingRoom.findMany.mockResolvedValue(bookingRooms);

    await expect(
      processSplitRoomPayment(
        payload,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      )
    ).rejects.toThrow('Some booking rooms not found');
  });

  it('should successfully process split room payment without promotions', async () => {
    const payload = {
      bookingId: 'booking-123',
      bookingRoomIds: ['room-1', 'room-2'],
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123',
      promotionApplications: []
    };

    const booking = {
      id: 'booking-123',
      bookingCode: 'BK123'
    };

    const bookingRooms = [
      {
        id: 'room-1',
        subtotalRoom: new Prisma.Decimal(100),
        totalPaid: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        room: { id: 'room-1' },
        serviceUsages: []
      },
      {
        id: 'room-2',
        subtotalRoom: new Prisma.Decimal(150),
        totalPaid: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(150),
        room: { id: 'room-2' },
        serviceUsages: []
      }
    ];

    const createdTransaction = {
      id: 'transaction-123',
      bookingId: 'booking-123',
      type: TransactionType.ROOM_CHARGE,
      amount: new Prisma.Decimal(250),
      status: TransactionStatus.COMPLETED
    };

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.bookingRoom.findMany.mockResolvedValue(bookingRooms);
    mockTx.transaction.create.mockResolvedValue(createdTransaction);
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-1' });
    mockTx.transaction.findUnique.mockResolvedValue({
      ...createdTransaction,
      details: [],
      usedPromotions: []
    });

    const result = await processSplitRoomPayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(result.transaction).toBeDefined();
    expect(result.booking).toBeDefined();
    expect(mockTx.transaction.create).toHaveBeenCalled();
    expect(mockTx.transactionDetail.create).toHaveBeenCalledTimes(2);
    expect(mockActivityService.createTransactionActivity).toHaveBeenCalled();
  });

  it('should process rooms with services', async () => {
    const payload = {
      bookingId: 'booking-123',
      bookingRoomIds: ['room-1'],
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    const booking = {
      id: 'booking-123',
      bookingCode: 'BK123'
    };

    const bookingRooms = [
      {
        id: 'room-1',
        subtotalRoom: new Prisma.Decimal(100),
        totalPaid: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(150),
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
    ];

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.bookingRoom.findMany.mockResolvedValue(bookingRooms);
    mockTx.transaction.create.mockResolvedValue({ id: 'transaction-123' });
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-1' });
    mockTx.transaction.findUnique.mockResolvedValue({
      id: 'transaction-123',
      details: [],
      usedPromotions: []
    });

    await processSplitRoomPayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(mockTx.transactionDetail.create).toHaveBeenCalledTimes(2); // Room + Service
    expect(mockUsageServiceService.updateServiceUsagePayment).toHaveBeenCalledWith(
      'service-1',
      50,
      'employee-123',
      mockTx
    );
  });

  it('should update booking status to CONFIRMED for DEPOSIT transaction', async () => {
    const payload = {
      bookingId: 'booking-123',
      bookingRoomIds: ['room-1'],
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.DEPOSIT,
      employeeId: 'employee-123'
    };

    const booking = {
      id: 'booking-123',
      bookingCode: 'BK123'
    };

    const bookingRooms = [
      {
        id: 'room-1',
        subtotalRoom: new Prisma.Decimal(100),
        totalPaid: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        room: { id: 'room-1' },
        serviceUsages: []
      }
    ];

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.bookingRoom.findMany.mockResolvedValue(bookingRooms);
    mockTx.transaction.create.mockResolvedValue({ id: 'transaction-123' });
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-1' });
    mockTx.transaction.findUnique.mockResolvedValue({
      id: 'transaction-123',
      details: [],
      usedPromotions: []
    });

    await processSplitRoomPayment(
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
      where: {
        id: { in: ['room-1'] },
        status: BookingStatus.PENDING
      },
      data: { status: BookingStatus.CONFIRMED }
    });
  });

  it('should process with promotions and update customer promotions', async () => {
    const payload = {
      bookingId: 'booking-123',
      bookingRoomIds: ['room-1'],
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
      bookingCode: 'BK123'
    };

    const bookingRooms = [
      {
        id: 'room-1',
        subtotalRoom: new Prisma.Decimal(100),
        totalPaid: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        room: { id: 'room-1' },
        serviceUsages: []
      }
    ];

    const customerPromotion = {
      id: 'customer-promo-1',
      promotionId: 'promo-1'
    };

    // Mock discount calculation
    const discountMap = new Map();
    discountMap.set('customer-promo-1', { amount: 10, customerPromotionId: 'customer-promo-1' });
    jest.mocked(discountCalculator.calculateDiscounts).mockResolvedValue(discountMap);
    jest.mocked(discountCalculator.applyDiscountsToDetails).mockReturnValue([
      {
        bookingRoomId: 'room-1',
        baseAmount: 100,
        discountAmount: 10,
        amount: 90
      }
    ]);

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.bookingRoom.findMany.mockResolvedValue(bookingRooms);
    mockTx.transaction.create.mockResolvedValue({ id: 'transaction-123' });
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-1' });
    mockTx.transactionDetail.findFirst.mockResolvedValue({ id: 'detail-1' });
    mockTx.customerPromotion.findUnique.mockResolvedValue(customerPromotion);
    mockTx.transaction.findUnique.mockResolvedValue({
      id: 'transaction-123',
      details: [],
      usedPromotions: []
    });

    await processSplitRoomPayment(
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

  it('should skip rooms with zero balance', async () => {
    const payload = {
      bookingId: 'booking-123',
      bookingRoomIds: ['room-1'],
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    const booking = {
      id: 'booking-123',
      bookingCode: 'BK123'
    };

    const bookingRooms = [
      {
        id: 'room-1',
        subtotalRoom: new Prisma.Decimal(100),
        totalPaid: new Prisma.Decimal(100), // Fully paid
        totalAmount: new Prisma.Decimal(100),
        room: { id: 'room-1' },
        serviceUsages: []
      }
    ];

    jest.mocked(discountCalculator.applyDiscountsToDetails).mockReturnValue([]);

    jest.mocked(amountAggregator.aggregateTransactionAmounts).mockReturnValue({
      baseAmount: 0,
      discountAmount: 0,
      amount: 0
    });

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.bookingRoom.findMany.mockResolvedValue(bookingRooms);
    mockTx.transaction.create.mockResolvedValue({ id: 'transaction-123' });
    mockTx.transaction.findUnique.mockResolvedValue({
      id: 'transaction-123',
      details: [],
      usedPromotions: []
    });

    await processSplitRoomPayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(mockTx.transactionDetail.create).not.toHaveBeenCalled();
  });

  it('should handle custom description', async () => {
    const payload = {
      bookingId: 'booking-123',
      bookingRoomIds: ['room-1'],
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123',
      description: 'Custom split payment'
    };

    const booking = {
      id: 'booking-123',
      bookingCode: 'BK123'
    };

    const bookingRooms = [
      {
        id: 'room-1',
        subtotalRoom: new Prisma.Decimal(100),
        totalPaid: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        room: { id: 'room-1' },
        serviceUsages: []
      }
    ];

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.bookingRoom.findMany.mockResolvedValue(bookingRooms);
    mockTx.transaction.create.mockResolvedValue({ id: 'transaction-123' });
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-1' });
    mockTx.transaction.findUnique.mockResolvedValue({
      id: 'transaction-123',
      details: [],
      usedPromotions: []
    });

    await processSplitRoomPayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(mockTx.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: 'Custom split payment'
        })
      })
    );
  });

  it('should update room balance after payment', async () => {
    const payload = {
      bookingId: 'booking-123',
      bookingRoomIds: ['room-1'],
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.ROOM_CHARGE,
      employeeId: 'employee-123'
    };

    const booking = {
      id: 'booking-123',
      bookingCode: 'BK123'
    };

    const bookingRooms = [
      {
        id: 'room-1',
        subtotalRoom: new Prisma.Decimal(100),
        totalPaid: new Prisma.Decimal(0),
        totalAmount: new Prisma.Decimal(100),
        room: { id: 'room-1' },
        serviceUsages: []
      }
    ];

    mockTx.booking.findUnique.mockResolvedValue(booking);
    mockTx.bookingRoom.findMany.mockResolvedValue(bookingRooms);
    mockTx.transaction.create.mockResolvedValue({ id: 'transaction-123' });
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-1' });
    mockTx.transaction.findUnique.mockResolvedValue({
      id: 'transaction-123',
      details: [],
      usedPromotions: []
    });

    await processSplitRoomPayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );

    expect(mockTx.bookingRoom.update).toHaveBeenCalledWith({
      where: { id: 'room-1' },
      data: expect.objectContaining({
        totalPaid: expect.any(Prisma.Decimal),
        balance: expect.any(Prisma.Decimal)
      })
    });
  });
});
