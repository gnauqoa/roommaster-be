/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { UsageServiceService } from '../../../src/services/usage-service.service';
import { ServiceUsageStatus } from '@prisma/client';
import ApiError from '../../../src/utils/ApiError';
import { Prisma } from '@prisma/client';

const createMockPrisma = () => ({
  serviceUsage: {
    create: jest.fn() as any,
    findUnique: jest.fn() as any,
    update: jest.fn() as any
  },
  booking: {
    findUnique: jest.fn() as any
  },
  bookingRoom: {
    findUnique: jest.fn() as any
  },
  service: {
    findUnique: jest.fn() as any
  },
  $transaction: jest.fn() as any
});

const createMockActivityService = () => ({
  createActivity: jest.fn()
});

describe('UsageServiceService', () => {
  let usageServiceService: UsageServiceService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockActivityService: ReturnType<typeof createMockActivityService>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockActivityService = createMockActivityService();
    usageServiceService = new UsageServiceService(mockPrisma as any, mockActivityService as any);
    jest.clearAllMocks();
  });

  describe('createServiceUsage', () => {
    const mockService = {
      id: 'service-1',
      name: 'Laundry',
      price: new Prisma.Decimal(100)
    };

    it('should create guest service usage without booking', async () => {
      const payload = {
        serviceId: 'service-1',
        quantity: 2,
        employeeId: 'employee-1'
      };

      (mockPrisma.service.findUnique as any).mockResolvedValue(mockService);

      const mockCreatedUsage = {
        id: 'usage-1',
        serviceId: payload.serviceId,
        quantity: payload.quantity,
        unitPrice: mockService.price,
        totalPrice: new Prisma.Decimal(200),
        status: ServiceUsageStatus.PENDING
      };

      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback: any) => {
        const mockTx = {
          serviceUsage: {
            create: (jest.fn() as any).mockResolvedValue(mockCreatedUsage)
          }
        };
        return callback(mockTx);
      }) as any;

      const result = await usageServiceService.createServiceUsage(payload);

      expect(mockPrisma.service.findUnique).toHaveBeenCalledWith({
        where: { id: payload.serviceId }
      });
      expect(result).toEqual(mockCreatedUsage);
    });

    it('should create booking-level service usage', async () => {
      const payload = {
        bookingId: 'booking-1',
        serviceId: 'service-1',
        quantity: 1,
        employeeId: 'employee-1'
      };

      const mockBooking = { id: 'booking-1' };
      (mockPrisma.booking.findUnique as any).mockResolvedValue(mockBooking);
      (mockPrisma.service.findUnique as any).mockResolvedValue(mockService);

      const mockCreatedUsage = {
        id: 'usage-1',
        bookingId: payload.bookingId,
        serviceId: payload.serviceId,
        quantity: payload.quantity,
        totalPrice: new Prisma.Decimal(100)
      };

      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback: any) => {
        const mockTx = {
          serviceUsage: {
            create: (jest.fn() as any).mockResolvedValue(mockCreatedUsage)
          }
        };
        return callback(mockTx);
      }) as any;

      const result = await usageServiceService.createServiceUsage(payload);

      expect(mockPrisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: payload.bookingId }
      });
      expect(result).toEqual(mockCreatedUsage);
    });

    it('should create room-specific service usage', async () => {
      const payload = {
        bookingId: 'booking-1',
        bookingRoomId: 'room-1',
        serviceId: 'service-1',
        quantity: 3,
        employeeId: 'employee-1'
      };

      const mockBooking = { id: 'booking-1' };
      const mockBookingRoom = { id: 'room-1', bookingId: 'booking-1' };

      (mockPrisma.booking.findUnique as any).mockResolvedValue(mockBooking);
      (mockPrisma.bookingRoom.findUnique as any).mockResolvedValue(mockBookingRoom);
      (mockPrisma.service.findUnique as any).mockResolvedValue(mockService);

      const mockCreatedUsage = {
        id: 'usage-1',
        bookingId: payload.bookingId,
        bookingRoomId: payload.bookingRoomId,
        serviceId: payload.serviceId,
        quantity: payload.quantity,
        totalPrice: new Prisma.Decimal(300)
      };

      (mockPrisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          serviceUsage: {
            create: (jest.fn() as any).mockResolvedValue(mockCreatedUsage)
          }
        };
        return callback(mockTx);
      });

      const result = await usageServiceService.createServiceUsage(payload);

      expect(mockPrisma.bookingRoom.findUnique).toHaveBeenCalledWith({
        where: { id: payload.bookingRoomId }
      });
      expect(result).toEqual(mockCreatedUsage);
    });

    it('should throw error if booking not found', async () => {
      const payload = {
        bookingId: 'non-existent',
        serviceId: 'service-1',
        quantity: 1,
        employeeId: 'employee-1'
      };

      (mockPrisma.booking.findUnique as any).mockResolvedValue(null);

      await expect(usageServiceService.createServiceUsage(payload)).rejects.toThrow(ApiError);
      await expect(usageServiceService.createServiceUsage(payload)).rejects.toThrow(
        'Booking not found'
      );
    });

    it('should throw error if booking room not found', async () => {
      const payload = {
        bookingId: 'booking-1',
        bookingRoomId: 'non-existent',
        serviceId: 'service-1',
        quantity: 1,
        employeeId: 'employee-1'
      };

      const mockBooking = { id: 'booking-1' };
      (mockPrisma.booking.findUnique as any).mockResolvedValue(mockBooking);
      (mockPrisma.bookingRoom.findUnique as any).mockResolvedValue(null);

      await expect(usageServiceService.createServiceUsage(payload)).rejects.toThrow(ApiError);
      await expect(usageServiceService.createServiceUsage(payload)).rejects.toThrow(
        'Booking room not found'
      );
    });

    it('should throw error if booking room does not belong to booking', async () => {
      const payload = {
        bookingId: 'booking-1',
        bookingRoomId: 'room-1',
        serviceId: 'service-1',
        quantity: 1,
        employeeId: 'employee-1'
      };

      const mockBooking = { id: 'booking-1' };
      const mockBookingRoom = { id: 'room-1', bookingId: 'different-booking' };

      (mockPrisma.booking.findUnique as any).mockResolvedValue(mockBooking);
      (mockPrisma.bookingRoom.findUnique as any).mockResolvedValue(mockBookingRoom);

      await expect(usageServiceService.createServiceUsage(payload)).rejects.toThrow(ApiError);
      await expect(usageServiceService.createServiceUsage(payload)).rejects.toThrow(
        'Booking room does not belong to the specified booking'
      );
    });

    it('should throw error if service not found', async () => {
      const payload = {
        serviceId: 'non-existent',
        quantity: 1,
        employeeId: 'employee-1'
      };

      (mockPrisma.service.findUnique as any).mockResolvedValue(null);

      await expect(usageServiceService.createServiceUsage(payload)).rejects.toThrow(ApiError);
      await expect(usageServiceService.createServiceUsage(payload)).rejects.toThrow(
        'Service not found'
      );
    });
  });

  describe('updateServiceUsage', () => {
    const mockExistingUsage = {
      id: 'usage-1',
      serviceId: 'service-1',
      quantity: 2,
      unitPrice: new Prisma.Decimal(100),
      totalPrice: new Prisma.Decimal(200),
      totalPaid: new Prisma.Decimal(0),
      status: ServiceUsageStatus.PENDING,
      employeeId: 'employee-1',
      service: {
        id: 'service-1',
        name: 'Laundry'
      }
    };

    it('should update quantity for pending service', async () => {
      const payload = {
        id: 'usage-1',
        quantity: 3
      };

      mockPrisma.serviceUsage.findUnique = (jest.fn() as any).mockResolvedValue(mockExistingUsage);

      const mockUpdated = {
        ...mockExistingUsage,
        quantity: 3,
        totalPrice: new Prisma.Decimal(300)
      };

      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback: any) => {
        const mockTx = {
          serviceUsage: {
            update: (jest.fn() as any).mockResolvedValue(mockUpdated)
          }
        };
        return callback(mockTx);
      }) as any;

      const result = await usageServiceService.updateServiceUsage(payload);

      expect(result.quantity).toBe(3);
    });

    it('should update status from PENDING to TRANSFERRED', async () => {
      const payload = {
        id: 'usage-1',
        status: ServiceUsageStatus.TRANSFERRED
      };

      (mockPrisma.serviceUsage.findUnique as any).mockResolvedValue(mockExistingUsage);

      const mockUpdated = {
        ...mockExistingUsage,
        status: ServiceUsageStatus.TRANSFERRED
      };

      (mockPrisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          serviceUsage: {
            update: (jest.fn() as any).mockResolvedValue(mockUpdated)
          }
        };
        return callback(mockTx);
      });

      const result = await usageServiceService.updateServiceUsage(payload);

      expect(result.status).toBe(ServiceUsageStatus.TRANSFERRED);
    });

    it('should throw error if service usage not found', async () => {
      const payload = {
        id: 'non-existent',
        quantity: 3
      };

      (mockPrisma.serviceUsage.findUnique as any).mockResolvedValue(null);

      await expect(usageServiceService.updateServiceUsage(payload)).rejects.toThrow(ApiError);
      await expect(usageServiceService.updateServiceUsage(payload)).rejects.toThrow(
        'Service usage not found'
      );
    });

    it('should throw error if updating quantity for transferred service', async () => {
      const payload = {
        id: 'usage-1',
        quantity: 5
      };

      const transferredUsage = {
        ...mockExistingUsage,
        status: ServiceUsageStatus.TRANSFERRED
      };

      (mockPrisma.serviceUsage.findUnique as any).mockResolvedValue(transferredUsage);

      await expect(usageServiceService.updateServiceUsage(payload)).rejects.toThrow(ApiError);
      await expect(usageServiceService.updateServiceUsage(payload)).rejects.toThrow(
        'Cannot update quantity for service that has been transferred to user'
      );
    });

    it('should throw error if updating quantity for completed service', async () => {
      const payload = {
        id: 'usage-1',
        quantity: 5
      };

      const completedUsage = {
        ...mockExistingUsage,
        status: ServiceUsageStatus.COMPLETED
      };

      mockPrisma.serviceUsage.findUnique = (jest.fn() as any).mockResolvedValue(completedUsage);

      await expect(usageServiceService.updateServiceUsage(payload)).rejects.toThrow(ApiError);
      await expect(usageServiceService.updateServiceUsage(payload)).rejects.toThrow(
        'Cannot update quantity for service that has been completed'
      );
    });

    it('should handle cancellation by setting total price to 0', async () => {
      const payload = {
        id: 'usage-1',
        status: ServiceUsageStatus.CANCELLED
      };

      (mockPrisma.serviceUsage.findUnique as any).mockResolvedValue(mockExistingUsage);

      const mockUpdated = {
        ...mockExistingUsage,
        status: ServiceUsageStatus.CANCELLED,
        totalPrice: new Prisma.Decimal(0)
      };

      (mockPrisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          serviceUsage: {
            update: (jest.fn() as any).mockResolvedValue(mockUpdated)
          }
        };
        return callback(mockTx);
      });

      const result = await usageServiceService.updateServiceUsage(payload);

      expect(result.status).toBe(ServiceUsageStatus.CANCELLED);
      expect(result.totalPrice).toEqual(new Prisma.Decimal(0));
    });

    it('should throw error for invalid status transition from COMPLETED', async () => {
      const payload = {
        id: 'usage-1',
        status: ServiceUsageStatus.PENDING
      };

      const completedUsage = {
        ...mockExistingUsage,
        status: ServiceUsageStatus.COMPLETED
      };

      mockPrisma.serviceUsage.findUnique = (jest.fn() as any).mockResolvedValue(completedUsage);

      await expect(usageServiceService.updateServiceUsage(payload)).rejects.toThrow(ApiError);
      await expect(usageServiceService.updateServiceUsage(payload)).rejects.toThrow(
        'Cannot change status of completed service'
      );
    });
  });

  describe('updateServiceUsagePayment', () => {
    const mockServiceUsage = {
      id: 'usage-1',
      totalPrice: new Prisma.Decimal(500),
      totalPaid: new Prisma.Decimal(200),
      status: ServiceUsageStatus.TRANSFERRED,
      bookingRoomId: 'room-1',
      service: {
        id: 'service-1',
        name: 'Laundry'
      }
    };

    it('should update payment and keep status when partially paid', async () => {
      const paidAmount = 100;
      const employeeId = 'employee-1';

      const mockTx = {
        serviceUsage: {
          findUnique: (jest.fn() as any).mockResolvedValue(mockServiceUsage),
          update: (jest.fn() as any).mockResolvedValue({
            ...mockServiceUsage,
            totalPaid: new Prisma.Decimal(300)
          }) as any
        }
      };

      await usageServiceService.updateServiceUsagePayment(
        'usage-1',
        paidAmount,
        employeeId,
        mockTx
      );

      expect(mockTx.serviceUsage.update).toHaveBeenCalledWith({
        where: { id: 'usage-1' },
        data: {
          totalPaid: new Prisma.Decimal(300),
          status: ServiceUsageStatus.TRANSFERRED
        }
      });
    });

    it('should update status to COMPLETED when fully paid', async () => {
      const paidAmount = 300; // Will make total paid = 500
      const employeeId = 'employee-1';

      const mockTx = {
        serviceUsage: {
          findUnique: (jest.fn() as any).mockResolvedValue(mockServiceUsage),
          update: (jest.fn() as any).mockResolvedValue({
            ...mockServiceUsage,
            totalPaid: new Prisma.Decimal(500),
            status: ServiceUsageStatus.COMPLETED
          }) as any
        }
      };

      await usageServiceService.updateServiceUsagePayment(
        'usage-1',
        paidAmount,
        employeeId,
        mockTx
      );

      expect(mockTx.serviceUsage.update).toHaveBeenCalledWith({
        where: { id: 'usage-1' },
        data: {
          totalPaid: new Prisma.Decimal(500),
          status: ServiceUsageStatus.COMPLETED
        }
      });
    });

    it('should throw error if service usage not found', async () => {
      const mockTx = {
        serviceUsage: {
          findUnique: (jest.fn() as any).mockResolvedValue(null)
        }
      };

      await expect(
        usageServiceService.updateServiceUsagePayment('non-existent', 100, 'employee-1', mockTx)
      ).rejects.toThrow(ApiError);
    });

    it('should throw error if trying to pay for cancelled service', async () => {
      const cancelledUsage = {
        ...mockServiceUsage,
        status: ServiceUsageStatus.CANCELLED
      };

      const mockTx = {
        serviceUsage: {
          findUnique: (jest.fn() as any).mockResolvedValue(cancelledUsage)
        }
      };

      await expect(
        usageServiceService.updateServiceUsagePayment('usage-1', 100, 'employee-1', mockTx)
      ).rejects.toThrow(ApiError);
      await expect(
        usageServiceService.updateServiceUsagePayment('usage-1', 100, 'employee-1', mockTx)
      ).rejects.toThrow('Cannot pay for cancelled service');
    });
  });

  describe('getBalance', () => {
    it('should calculate correct balance', () => {
      const serviceUsage = {
        totalPrice: new Prisma.Decimal(1000),
        totalPaid: new Prisma.Decimal(400)
      };

      const balance = usageServiceService.getBalance(serviceUsage);

      expect(balance).toEqual(new Prisma.Decimal(600));
    });

    it('should return zero balance when fully paid', () => {
      const serviceUsage = {
        totalPrice: new Prisma.Decimal(500),
        totalPaid: new Prisma.Decimal(500)
      };

      const balance = usageServiceService.getBalance(serviceUsage);

      expect(balance).toEqual(new Prisma.Decimal(0));
    });

    it('should handle overpayment', () => {
      const serviceUsage = {
        totalPrice: new Prisma.Decimal(300),
        totalPaid: new Prisma.Decimal(350)
      };

      const balance = usageServiceService.getBalance(serviceUsage);

      expect(balance).toEqual(new Prisma.Decimal(-50));
    });
  });

  describe('updateServiceUsage - status change activity logs', () => {
    const mockExistingUsage = {
      id: 'usage-1',
      serviceId: 'service-1',
      quantity: 2,
      unitPrice: new Prisma.Decimal(100),
      totalPrice: new Prisma.Decimal(200),
      totalPaid: new Prisma.Decimal(0),
      status: ServiceUsageStatus.PENDING,
      employeeId: 'employee-1',
      bookingRoomId: null,
      service: {
        id: 'service-1',
        name: 'Laundry'
      }
    };

    it('should create activity log for status change to TRANSFERRED', async () => {
      const payload = {
        id: 'usage-1',
        status: ServiceUsageStatus.TRANSFERRED
      };

      (mockPrisma.serviceUsage.findUnique as any).mockResolvedValue(mockExistingUsage);

      const mockUpdated = {
        ...mockExistingUsage,
        status: ServiceUsageStatus.TRANSFERRED
      };

      (mockPrisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          serviceUsage: {
            update: (jest.fn() as any).mockResolvedValue(mockUpdated)
          }
        };
        return callback(mockTx);
      });

      await usageServiceService.updateServiceUsage(payload);

      expect(mockActivityService.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Service transferred to user: Laundry'
        }),
        expect.anything()
      );
    });

    it('should create activity log for status change to COMPLETED', async () => {
      const payload = {
        id: 'usage-1',
        status: ServiceUsageStatus.COMPLETED
      };

      const transferredUsage = {
        ...mockExistingUsage,
        status: ServiceUsageStatus.TRANSFERRED
      };

      (mockPrisma.serviceUsage.findUnique as any).mockResolvedValue(transferredUsage);

      const mockUpdated = {
        ...transferredUsage,
        status: ServiceUsageStatus.COMPLETED
      };

      (mockPrisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          serviceUsage: {
            update: (jest.fn() as any).mockResolvedValue(mockUpdated)
          }
        };
        return callback(mockTx);
      });

      await usageServiceService.updateServiceUsage(payload);

      expect(mockActivityService.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Service completed: Laundry'
        }),
        expect.anything()
      );
    });

    it('should create activity log for status change to CANCELLED', async () => {
      const payload = {
        id: 'usage-1',
        status: ServiceUsageStatus.CANCELLED
      };

      (mockPrisma.serviceUsage.findUnique as any).mockResolvedValue(mockExistingUsage);

      const mockUpdated = {
        ...mockExistingUsage,
        status: ServiceUsageStatus.CANCELLED,
        totalPrice: new Prisma.Decimal(0)
      };

      (mockPrisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          serviceUsage: {
            update: (jest.fn() as any).mockResolvedValue(mockUpdated)
          }
        };
        return callback(mockTx);
      });

      await usageServiceService.updateServiceUsage(payload);

      expect(mockActivityService.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Service cancelled: Laundry'
        }),
        expect.anything()
      );
    });

    it('should include bookingRoomId in activity when present', async () => {
      const payload = {
        id: 'usage-1',
        status: ServiceUsageStatus.TRANSFERRED
      };

      const usageWithBookingRoom = {
        ...mockExistingUsage,
        bookingRoomId: 'room-123'
      };

      (mockPrisma.serviceUsage.findUnique as any).mockResolvedValue(usageWithBookingRoom);

      const mockUpdated = {
        ...usageWithBookingRoom,
        status: ServiceUsageStatus.TRANSFERRED
      };

      (mockPrisma.$transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          serviceUsage: {
            update: (jest.fn() as any).mockResolvedValue(mockUpdated)
          }
        };
        return callback(mockTx);
      });

      await usageServiceService.updateServiceUsage(payload);

      expect(mockActivityService.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingRoomId: 'room-123'
        }),
        expect.anything()
      );
    });
  });

  describe('updateServiceUsagePayment - activity logs and status transitions', () => {
    const mockServiceUsage = {
      id: 'usage-1',
      totalPrice: new Prisma.Decimal(500),
      totalPaid: new Prisma.Decimal(200),
      status: ServiceUsageStatus.TRANSFERRED,
      bookingRoomId: 'room-123',
      service: {
        id: 'service-1',
        name: 'Room Service'
      }
    };

    it('should create activity with bookingRoomId when present', async () => {
      const paidAmount = 100;
      const employeeId = 'employee-1';

      const mockTx = {
        serviceUsage: {
          findUnique: (jest.fn() as any).mockResolvedValue(mockServiceUsage),
          update: (jest.fn() as any).mockResolvedValue({
            ...mockServiceUsage,
            totalPaid: new Prisma.Decimal(300)
          }) as any
        }
      };

      await usageServiceService.updateServiceUsagePayment(
        'usage-1',
        paidAmount,
        employeeId,
        mockTx
      );

      expect(mockActivityService.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingRoomId: 'room-123'
        }),
        mockTx
      );
    });

    it('should create status change activity when status changes to COMPLETED', async () => {
      const paidAmount = 300; // Will complete payment
      const employeeId = 'employee-1';

      const mockTx = {
        serviceUsage: {
          findUnique: (jest.fn() as any).mockResolvedValue(mockServiceUsage),
          update: (jest.fn() as any).mockResolvedValue({
            ...mockServiceUsage,
            totalPaid: new Prisma.Decimal(500),
            status: ServiceUsageStatus.COMPLETED
          }) as any
        }
      };

      await usageServiceService.updateServiceUsagePayment(
        'usage-1',
        paidAmount,
        employeeId,
        mockTx
      );

      // Should create 2 activities: one for payment, one for status change
      expect(mockActivityService.createActivity).toHaveBeenCalledTimes(2);
      expect(mockActivityService.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('fully paid')
        }),
        mockTx
      );
    });
  });
});
