/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { processGuestServicePayment } from '../../../../src/services/transaction/handlers/guest-service-payment';
import { createMockPrismaClient } from '../../../utils/testContainer';
import { PrismaClient, Prisma, ActivityType, PaymentMethod, TransactionType } from '@prisma/client';
import ApiError from '../../../../src/utils/ApiError';

describe('processGuestServicePayment', () => {
  let mockPrisma: any;
  let mockActivityService: any;
  let mockUsageServiceService: any;
  let mockTx: any;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    
    mockTx = {
      serviceUsage: {
        findUnique: jest.fn()
      },
      transactionDetail: {
        create: jest.fn(),
        findUnique: jest.fn()
      }
    };

    mockPrisma.$transaction = jest.fn((callback: any) => callback(mockTx)) as any;

    mockActivityService = {
      createActivity: jest.fn()
    };

    mockUsageServiceService = {
      updateServiceUsagePayment: jest.fn()
    };

    jest.clearAllMocks();
  });

  it('should throw error if serviceUsageId is missing', async () => {
    const payload = {
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.SERVICE_CHARGE,
      employeeId: 'employee-123'
    };

    await expect(
      processGuestServicePayment(
        payload as any,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService
      )
    ).rejects.toThrow('Service usage ID is required');
  });

  it('should throw error if service usage not found', async () => {
    const payload = {
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.SERVICE_CHARGE,
      employeeId: 'employee-123'
    };

    mockTx.serviceUsage.findUnique.mockResolvedValue(null);

    await expect(
      processGuestServicePayment(
        payload,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService
      )
    ).rejects.toThrow('Service usage not found');
  });

  it('should throw error if service belongs to a booking', async () => {
    const payload = {
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.SERVICE_CHARGE,
      employeeId: 'employee-123'
    };

    const serviceUsage = {
      id: 'service-123',
      totalPrice: new Prisma.Decimal(100),
      totalPaid: new Prisma.Decimal(0),
      bookingRoomId: 'booking-room-123', // Belongs to a booking
      service: { name: 'Test Service' }
    };

    mockTx.serviceUsage.findUnique.mockResolvedValue(serviceUsage);

    await expect(
      processGuestServicePayment(
        payload,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService
      )
    ).rejects.toThrow('This service belongs to a booking. Use booking service payment instead.');
  });

  it('should throw error if service is already fully paid', async () => {
    const payload = {
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.SERVICE_CHARGE,
      employeeId: 'employee-123'
    };

    const serviceUsage = {
      id: 'service-123',
      totalPrice: new Prisma.Decimal(100),
      totalPaid: new Prisma.Decimal(100), // Fully paid
      bookingRoomId: null,
      service: { name: 'Test Service' }
    };

    mockTx.serviceUsage.findUnique.mockResolvedValue(serviceUsage);

    await expect(
      processGuestServicePayment(
        payload,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService
      )
    ).rejects.toThrow('Service is already fully paid');
  });

  it('should successfully process guest service payment', async () => {
    const payload = {
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.SERVICE_CHARGE,
      employeeId: 'employee-123'
    };

    const serviceUsage = {
      id: 'service-123',
      totalPrice: new Prisma.Decimal(100),
      totalPaid: new Prisma.Decimal(0),
      bookingRoomId: null,
      service: { name: 'Test Service' }
    };

    const createdDetail = {
      id: 'detail-123',
      serviceUsageId: 'service-123',
      baseAmount: new Prisma.Decimal(100),
      discountAmount: new Prisma.Decimal(0),
      amount: new Prisma.Decimal(100)
    };

    mockTx.serviceUsage.findUnique.mockResolvedValue(serviceUsage);
    mockTx.transactionDetail.create.mockResolvedValue(createdDetail);
    mockTx.transactionDetail.findUnique.mockResolvedValue({
      ...createdDetail,
      serviceUsage: {
        ...serviceUsage,
        service: serviceUsage.service
      }
    });

    const result = await processGuestServicePayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService
    );

    expect(result.transactionDetail).toBeDefined();
    expect(mockTx.transactionDetail.create).toHaveBeenCalledWith({
      data: {
        serviceUsageId: 'service-123',
        baseAmount: 100,
        discountAmount: 0,
        amount: 100
      }
    });
    expect(mockUsageServiceService.updateServiceUsagePayment).toHaveBeenCalledWith(
      'service-123',
      100,
      'employee-123',
      mockTx
    );
    expect(mockActivityService.createActivity).toHaveBeenCalledWith(
      {
        type: ActivityType.CREATE_TRANSACTION,
        description: expect.stringContaining('Guest service payment'),
        employeeId: 'employee-123',
        serviceUsageId: 'service-123',
        metadata: expect.objectContaining({
          transactionDetailId: 'detail-123',
          amount: 100,
          paymentMethod: PaymentMethod.CASH,
          transactionType: TransactionType.SERVICE_CHARGE
        })
      },
      mockTx
    );
  });

  it('should handle partial payment correctly', async () => {
    const payload = {
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.SERVICE_CHARGE,
      employeeId: 'employee-123'
    };

    const serviceUsage = {
      id: 'service-123',
      totalPrice: new Prisma.Decimal(100),
      totalPaid: new Prisma.Decimal(30), // Partial payment
      bookingRoomId: null,
      service: { name: 'Test Service' }
    };

    const createdDetail = {
      id: 'detail-123',
      serviceUsageId: 'service-123',
      baseAmount: new Prisma.Decimal(70),
      discountAmount: new Prisma.Decimal(0),
      amount: new Prisma.Decimal(70)
    };

    mockTx.serviceUsage.findUnique.mockResolvedValue(serviceUsage);
    mockTx.transactionDetail.create.mockResolvedValue(createdDetail);
    mockTx.transactionDetail.findUnique.mockResolvedValue({
      ...createdDetail,
      serviceUsage
    });

    await processGuestServicePayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService
    );

    expect(mockTx.transactionDetail.create).toHaveBeenCalledWith({
      data: {
        serviceUsageId: 'service-123',
        baseAmount: 70, // Only the balance
        discountAmount: 0,
        amount: 70
      }
    });
  });

  it('should create activity with service name in description', async () => {
    const payload = {
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CREDIT_CARD,
      transactionType: TransactionType.SERVICE_CHARGE,
      employeeId: 'employee-123'
    };

    const serviceUsage = {
      id: 'service-123',
      totalPrice: new Prisma.Decimal(75.50),
      totalPaid: new Prisma.Decimal(0),
      bookingRoomId: null,
      service: { name: 'Spa Treatment' }
    };

    mockTx.serviceUsage.findUnique.mockResolvedValue(serviceUsage);
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-123' });
    mockTx.transactionDetail.findUnique.mockResolvedValue({
      id: 'detail-123',
      serviceUsage
    });

    await processGuestServicePayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService
    );

    expect(mockActivityService.createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining('Spa Treatment')
      }),
      mockTx
    );
  });

  it('should handle zero paid amount correctly', async () => {
    const payload = {
      serviceUsageId: 'service-123',
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.SERVICE_CHARGE,
      employeeId: 'employee-123'
    };

    const serviceUsage = {
      id: 'service-123',
      totalPrice: new Prisma.Decimal(50),
      totalPaid: new Prisma.Decimal(0), // No previous payment
      bookingRoomId: null,
      service: { name: 'Test Service' }
    };

    mockTx.serviceUsage.findUnique.mockResolvedValue(serviceUsage);
    mockTx.transactionDetail.create.mockResolvedValue({ id: 'detail-123' });
    mockTx.transactionDetail.findUnique.mockResolvedValue({
      id: 'detail-123',
      serviceUsage
    });

    await processGuestServicePayment(
      payload,
      mockPrisma,
      mockActivityService,
      mockUsageServiceService
    );

    expect(mockTx.transactionDetail.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        baseAmount: 50,
        amount: 50
      })
    });
  });
});
