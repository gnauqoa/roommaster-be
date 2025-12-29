/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { ActivityService } from '@/services/activity.service';
import { ActivityType } from '@prisma/client';

const createMockPrisma = () => ({
  activity: {
    create: jest.fn() as any,
    findMany: jest.fn() as any,
    findUnique: jest.fn() as any,
    count: jest.fn() as any
  }
});

describe('ActivityService', () => {
  let activityService: ActivityService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    activityService = new ActivityService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe('createActivity', () => {
    it('should create activity with all provided fields', async () => {
      const payload = {
        type: ActivityType.CREATE_BOOKING,
        description: 'Test booking created',
        metadata: { bookingCode: 'BK001' },
        serviceUsageId: 'service-1',
        bookingRoomId: 'room-1',
        customerId: 'customer-1',
        employeeId: 'employee-1'
      };

      const mockActivity = { id: 'activity-1', ...payload };
      (mockPrisma.activity.create as any).mockResolvedValue(mockActivity);

      const result = await activityService.createActivity(payload);

      expect(result).toEqual(mockActivity);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: payload.type,
          description: payload.description,
          metadata: payload.metadata,
          serviceUsageId: payload.serviceUsageId,
          bookingRoomId: payload.bookingRoomId,
          customerId: payload.customerId,
          employeeId: payload.employeeId
        })
      });
    });

    it('should use default description when description is not provided', async () => {
      const payload = {
        type: ActivityType.CHECKED_IN,
        employeeId: 'employee-1'
      };

      const mockActivity = {
        id: 'activity-1',
        type: payload.type,
        description: 'Checked in',
        employeeId: payload.employeeId
      };
      // @ts-expect-error - Mock setup
      mockPrisma.activity.create = jest.fn().mockResolvedValue(mockActivity);

      await activityService.createActivity(payload);

      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Checked in'
        })
      });
    });

    it('should create activity without optional fields', async () => {
      const payload = {
        type: ActivityType.CREATE_CUSTOMER,
        description: 'Customer created'
      };

      const mockActivity = { id: 'activity-1', ...payload };
      (mockPrisma.activity.create as any).mockResolvedValue(mockActivity);

      const result = await activityService.createActivity(payload);

      expect(result).toEqual(mockActivity);
    });

    it('should use transaction context when tx is provided', async () => {
      const payload = {
        type: ActivityType.CREATE_BOOKING,
        description: 'Booking in transaction'
      };

      const mockTx = {
        activity: {
          create: (jest.fn() as any).mockResolvedValue({ id: 'activity-1', ...payload })
        }
      };

      await activityService.createActivity(payload, mockTx);

      expect(mockTx.activity.create).toHaveBeenCalled();
      expect(mockPrisma.activity.create).not.toHaveBeenCalled();
    });
  });

  describe('createActivities', () => {
    it('should create multiple activities in batch', async () => {
      const payloads = [
        { type: ActivityType.CREATE_BOOKING, description: 'Booking 1' },
        { type: ActivityType.CREATE_CUSTOMER, description: 'Customer 1' },
        { type: ActivityType.CHECKED_IN, description: 'Check-in 1' }
      ];

      const mockActivities = payloads.map((p, i) => ({ id: `activity-${i + 1}`, ...p }));
      (mockPrisma.activity.create as any)
        .mockResolvedValueOnce(mockActivities[0])
        .mockResolvedValueOnce(mockActivities[1])
        .mockResolvedValueOnce(mockActivities[2]);

      const results = await activityService.createActivities(payloads);

      expect(results).toHaveLength(3);
      expect(mockPrisma.activity.create).toHaveBeenCalledTimes(3);
    });

    it('should handle empty array', async () => {
      const results = await activityService.createActivities([]);

      expect(results).toHaveLength(0);
      expect(mockPrisma.activity.create).not.toHaveBeenCalled();
    });
  });

  describe('createCheckInActivity', () => {
    it('should create check-in activity with correct data', async () => {
      const bookingRoomId = 'room-1';
      const employeeId = 'employee-1';
      const roomNumber = '101';

      const mockActivity = {
        id: 'activity-1',
        type: ActivityType.CHECKED_IN,
        description: `Check-in for room ${roomNumber}`,
        bookingRoomId,
        employeeId
      };

      (mockPrisma.activity.create as any).mockResolvedValue(mockActivity);

      const result = await activityService.createCheckInActivity(
        bookingRoomId,
        employeeId,
        roomNumber
      );

      expect(result).toEqual(mockActivity);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: ActivityType.CHECKED_IN,
          description: `Check-in for room ${roomNumber}`,
          bookingRoomId,
          employeeId,
          metadata: expect.objectContaining({
            roomNumber,
            timestamp: expect.any(String)
          })
        })
      });
    });
  });

  describe('createCheckOutActivity', () => {
    it('should create check-out activity with correct data', async () => {
      const bookingRoomId = 'room-1';
      const employeeId = 'employee-1';
      const roomNumber = '202';

      const mockActivity = {
        id: 'activity-1',
        type: ActivityType.CHECKED_OUT,
        description: `Check-out for room ${roomNumber}`,
        bookingRoomId,
        employeeId
      };

      (mockPrisma.activity.create as any).mockResolvedValue(mockActivity);

      const result = await activityService.createCheckOutActivity(
        bookingRoomId,
        employeeId,
        roomNumber
      );

      expect(result).toEqual(mockActivity);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: ActivityType.CHECKED_OUT,
          description: `Check-out for room ${roomNumber}`,
          metadata: expect.objectContaining({
            roomNumber
          })
        })
      });
    });
  });

  describe('createServiceUsageActivity', () => {
    it('should create service usage activity with correct data', async () => {
      const serviceUsageId = 'service-1';
      const employeeId = 'employee-1';
      const serviceName = 'Laundry';
      const quantity = 2;

      const mockActivity = {
        id: 'activity-1',
        type: ActivityType.CREATE_SERVICE_USAGE,
        description: `Created service usage: ${serviceName} (x${quantity})`,
        serviceUsageId,
        employeeId
      };

      (mockPrisma.activity.create as any).mockResolvedValue(mockActivity);

      const result = await activityService.createServiceUsageActivity(
        serviceUsageId,
        employeeId,
        serviceName,
        quantity
      );

      expect(result).toEqual(mockActivity);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: ActivityType.CREATE_SERVICE_USAGE,
          serviceUsageId,
          employeeId,
          metadata: expect.objectContaining({
            serviceName,
            quantity
          })
        })
      });
    });
  });

  describe('createCustomerActivity', () => {
    it('should create customer activity with correct data', async () => {
      const customerId = 'customer-1';
      const customerName = 'John Doe';

      const mockActivity = {
        id: 'activity-1',
        type: ActivityType.CREATE_CUSTOMER,
        description: `Customer created: ${customerName}`,
        customerId
      };

      (mockPrisma.activity.create as any).mockResolvedValue(mockActivity);

      const result = await activityService.createCustomerActivity(customerId, customerName);

      expect(result).toEqual(mockActivity);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: ActivityType.CREATE_CUSTOMER,
          customerId,
          metadata: expect.objectContaining({
            customerName
          })
        })
      });
    });
  });

  describe('createBookingActivity', () => {
    it('should create booking activity with correct data', async () => {
      const bookingId = 'booking-1';
      const customerId = 'customer-1';
      const employeeId = 'employee-1';
      const bookingCode = 'BK001';

      const mockActivity = {
        id: 'activity-1',
        type: ActivityType.CREATE_BOOKING,
        description: `Booking created: ${bookingCode}`,
        customerId,
        employeeId
      };

      (mockPrisma.activity.create as any).mockResolvedValue(mockActivity);

      const result = await activityService.createBookingActivity(
        bookingId,
        customerId,
        employeeId,
        bookingCode
      );

      expect(result).toEqual(mockActivity);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: ActivityType.CREATE_BOOKING,
          customerId,
          employeeId,
          metadata: expect.objectContaining({
            bookingCode,
            bookingId
          })
        })
      });
    });
  });

  describe('createTransactionActivity', () => {
    it('should create transaction activity with correct data', async () => {
      const transactionId = 'transaction-1';
      const employeeId = 'employee-1';
      const transactionType = 'PAYMENT';
      const amount = 1000;

      const mockActivity = {
        id: 'activity-1',
        type: ActivityType.CREATE_TRANSACTION,
        description: `Transaction created: ${transactionType} - ${amount}`,
        employeeId
      };

      (mockPrisma.activity.create as any).mockResolvedValue(mockActivity);

      const result = await activityService.createTransactionActivity(
        transactionId,
        employeeId,
        transactionType,
        amount
      );

      expect(result).toEqual(mockActivity);
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: ActivityType.CREATE_TRANSACTION,
          employeeId,
          metadata: expect.objectContaining({
            transactionId,
            transactionType,
            amount
          })
        })
      });
    });
  });

  describe('getAllActivities', () => {
    it('should get all activities with pagination', async () => {
      const mockActivities = [
        { id: 'activity-1', type: ActivityType.CREATE_BOOKING },
        { id: 'activity-2', type: ActivityType.CHECKED_IN }
      ];

      (mockPrisma.activity.findMany as any).mockResolvedValue(mockActivities);
      (mockPrisma.activity.count as any).mockResolvedValue(2);

      const result = await activityService.getAllActivities();

      expect(result).toEqual({
        data: mockActivities,
        total: 2,
        page: 1,
        limit: 20
      });
    });

    it('should apply type filter', async () => {
      (mockPrisma.activity.findMany as any).mockResolvedValue([]);
      (mockPrisma.activity.count as any).mockResolvedValue(0);

      await activityService.getAllActivities({ type: ActivityType.CHECKED_IN });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: ActivityType.CHECKED_IN
          })
        })
      );
    });

    it('should apply customer filter', async () => {
      (mockPrisma.activity.findMany as any).mockResolvedValue([]);
      (mockPrisma.activity.count as any).mockResolvedValue(0);

      await activityService.getAllActivities({ customerId: 'customer-1' });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customerId: 'customer-1'
          })
        })
      );
    });

    it('should apply employee filter', async () => {
      (mockPrisma.activity.findMany as any).mockResolvedValue([]);
      (mockPrisma.activity.count as any).mockResolvedValue(0);

      await activityService.getAllActivities({ employeeId: 'employee-1' });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            employeeId: 'employee-1'
          })
        })
      );
    });

    it('should apply date range filter', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      (mockPrisma.activity.findMany as any).mockResolvedValue([]);
      (mockPrisma.activity.count as any).mockResolvedValue(0);

      await activityService.getAllActivities({ startDate, endDate });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          })
        })
      );
    });

    it('should apply search filter', async () => {
      (mockPrisma.activity.findMany as any).mockResolvedValue([]);
      (mockPrisma.activity.count as any).mockResolvedValue(0);

      await activityService.getAllActivities({ search: 'booking' });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            description: {
              contains: 'booking',
              mode: 'insensitive'
            }
          })
        })
      );
    });

    it('should apply custom pagination', async () => {
      (mockPrisma.activity.findMany as any).mockResolvedValue([]);
      (mockPrisma.activity.count as any).mockResolvedValue(100);

      const result = await activityService.getAllActivities({}, { page: 3, limit: 10 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page 3 - 1) * limit 10
          take: 10
        })
      );
    });

    it('should apply custom sort order', async () => {
      (mockPrisma.activity.findMany as any).mockResolvedValue([]);
      (mockPrisma.activity.count as any).mockResolvedValue(0);

      await activityService.getAllActivities({}, { sortBy: 'type', sortOrder: 'asc' });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { type: 'asc' }
        })
      );
    });
  });

  describe('getActivityById', () => {
    it('should get activity by ID with all relations', async () => {
      const mockActivity = {
        id: 'activity-1',
        type: ActivityType.CREATE_BOOKING,
        customer: { id: 'customer-1' },
        employee: { id: 'employee-1' }
      };

      (mockPrisma.activity.findUnique as any).mockResolvedValue(mockActivity);

      const result = await activityService.getActivityById('activity-1');

      expect(result).toEqual(mockActivity);
      expect(mockPrisma.activity.findUnique).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
        include: expect.objectContaining({
          customer: true,
          employee: true,
          bookingRoom: expect.any(Object),
          serviceUsage: expect.any(Object)
        })
      });
    });

    it('should return null if activity not found', async () => {
      (mockPrisma.activity.findUnique as any).mockResolvedValue(null);

      const result = await activityService.getActivityById('non-existent');

      expect(result).toBeNull();
    });
  });
});
