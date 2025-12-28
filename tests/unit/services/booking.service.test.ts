/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { BookingService } from '../../../src/services/booking.service';
import { createMockPrismaClient } from '../../utils/testContainer';
import { PrismaClient, BookingStatus, RoomStatus } from '@prisma/client';
import ApiError from '../../../src/utils/ApiError';

describe('BookingService', () => {
  let bookingService: BookingService;
  let mockPrisma: jest.Mocked<Partial<PrismaClient>>;
  let mockTransactionService: any;
  let mockActivityService: any;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    mockTransactionService = {};
    mockActivityService = {
      createCheckInActivity: jest.fn(),
      createCheckOutActivity: jest.fn()
    };

    bookingService = new BookingService(
      mockPrisma as PrismaClient,
      mockTransactionService,
      mockActivityService
    );
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should throw error if check-out date is not after check-in date', async () => {
      const bookingData = {
        rooms: [{ roomTypeId: 'rt-1', count: 1 }],
        checkInDate: '2024-01-10',
        checkOutDate: '2024-01-10', // Same day
        totalGuests: 2,
        customerId: 'customer-123'
      };

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(ApiError);
      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        'Check-out date must be after check-in date'
      );
    });

    it('should throw error if check-out is before check-in', async () => {
      const bookingData = {
        rooms: [{ roomTypeId: 'rt-1', count: 1 }],
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-10', // Before check-in
        totalGuests: 2,
        customerId: 'customer-123'
      };

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(ApiError);
      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        'Check-out date must be after check-in date'
      );
    });

    it('should throw error if room type not found', async () => {
      const bookingData = {
        rooms: [{ roomTypeId: 'non-existent', count: 1 }],
        checkInDate: '2024-01-10',
        checkOutDate: '2024-01-12',
        totalGuests: 2,
        customerId: 'customer-123'
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findMany = jest.fn().mockResolvedValue([]);

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(ApiError);
      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        'One or more room types not found'
      );
    });

    it('should throw error if not enough available rooms', async () => {
      const bookingData = {
        rooms: [{ roomTypeId: 'rt-1', count: 3 }],
        checkInDate: '2024-01-10',
        checkOutDate: '2024-01-12',
        totalGuests: 6,
        customerId: 'customer-123'
      };
      const mockRoomType = {
        id: 'rt-1',
        name: 'Deluxe',
        capacity: 2,
        totalBed: 1,
        pricePerNight: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const mockAvailableRooms = [
        {
          id: 'room-1',
          roomNumber: '101',
          roomTypeId: 'rt-1',
          status: RoomStatus.AVAILABLE,
          roomType: mockRoomType
        }
      ]; // Only 1 room available, but 3 requested

      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findMany = jest.fn().mockResolvedValue([mockRoomType]);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue(mockAvailableRooms);

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(ApiError);
      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        'Not enough available rooms for room type: Deluxe'
      );
    });

    it('should create booking successfully with available rooms', async () => {
      const bookingData = {
        rooms: [{ roomTypeId: 'rt-1', count: 2 }],
        checkInDate: '2024-01-10',
        checkOutDate: '2024-01-12', // 2 nights
        totalGuests: 4,
        customerId: 'customer-123'
      };
      const mockRoomType = {
        id: 'rt-1',
        name: 'Deluxe',
        capacity: 2,
        totalBed: 1,
        pricePerNight: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const mockAvailableRooms = [
        {
          id: 'room-1',
          roomNumber: '101',
          roomTypeId: 'rt-1',
          status: RoomStatus.AVAILABLE,
          floor: 1,
          code: 'R101',
          createdAt: new Date(),
          updatedAt: new Date(),
          roomType: mockRoomType
        },
        {
          id: 'room-2',
          roomNumber: '102',
          roomTypeId: 'rt-1',
          status: RoomStatus.AVAILABLE,
          floor: 1,
          code: 'R102',
          createdAt: new Date(),
          updatedAt: new Date(),
          roomType: mockRoomType
        }
      ];
      const mockBooking = {
        id: 'booking-123',
        bookingCode: 'BK123456',
        status: BookingStatus.PENDING,
        primaryCustomerId: 'customer-123',
        checkInDate: new Date('2024-01-10'),
        checkOutDate: new Date('2024-01-12'),
        totalGuests: 4,
        totalAmount: 400, // 2 rooms * 100/night * 2 nights
        depositRequired: 200, // 2 rooms * 100
        balance: 400,
        createdAt: new Date(),
        updatedAt: new Date(),
        bookingRooms: [],
        primaryCustomer: {
          id: 'customer-123',
          fullName: 'Test Customer',
          phone: '0123456789',
          email: 'test@example.com'
        }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.roomType!.findMany = jest.fn().mockResolvedValue([mockRoomType]);
      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue(mockAvailableRooms);
      // @ts-expect-error - Mock setup
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback: any) => {
        const mockTx = {
          booking: {
            // @ts-expect-error - Mock setup
            create: jest.fn().mockResolvedValue(mockBooking)
          },
          room: {
            // @ts-expect-error - Mock setup
            updateMany: jest.fn().mockResolvedValue({ count: 2 })
          }
        };
        return callback(mockTx);
      });

      const result = await bookingService.createBooking(bookingData);

      expect(result).toHaveProperty('bookingId');
      expect(result).toHaveProperty('bookingCode');
      expect(result).toHaveProperty('totalAmount');
      expect(result.totalAmount).toBe(400);
    });
  });

  describe('getBookingById', () => {
    it('should return booking by ID', async () => {
      const mockBooking = {
        id: 'booking-123',
        bookingCode: 'BK123456',
        status: BookingStatus.CONFIRMED,
        primaryCustomerId: 'customer-123',
        checkInDate: new Date('2024-01-10'),
        checkOutDate: new Date('2024-01-12'),
        totalGuests: 2,
        totalAmount: 200,
        depositRequired: 100,
        balance: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
        bookingRooms: [],
        primaryCustomer: {
          id: 'customer-123',
          fullName: 'Test Customer',
          phone: '0123456789',
          email: 'test@example.com'
        }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.booking!.findUnique = jest.fn().mockResolvedValue(mockBooking);

      const result = await bookingService.getBookingById('booking-123');

      expect(result).toEqual(mockBooking);
      expect(mockPrisma.booking!.findUnique).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        include: expect.any(Object)
      });
    });

    it('should throw error if booking not found', async () => {
      // @ts-expect-error - Mock setup
      mockPrisma.booking!.findUnique = jest.fn().mockResolvedValue(null);

      await expect(bookingService.getBookingById('non-existent')).rejects.toThrow(ApiError);
      await expect(bookingService.getBookingById('non-existent')).rejects.toThrow(
        'Booking not found'
      );
    });
  });

  describe('checkIn', () => {
    it('should throw error if booking room not found', async () => {
      const checkInData = {
        checkInInfo: [
          {
            bookingRoomId: 'non-existent',
            customerIds: ['customer-1']
          }
        ],
        employeeId: 'employee-123'
      };

      // @ts-expect-error - Mock setup
      mockPrisma.bookingRoom = {
        ...mockPrisma.bookingRoom,
        // @ts-expect-error - Mock setup
        findMany: jest.fn().mockResolvedValue([])
      } as any;

      await expect(bookingService.checkIn(checkInData)).rejects.toThrow(ApiError);
      await expect(bookingService.checkIn(checkInData)).rejects.toThrow(
        'One or more booking rooms not found'
      );
    });

    it('should throw error if booking room is not CONFIRMED', async () => {
      const checkInData = {
        checkInInfo: [
          {
            bookingRoomId: 'br-1',
            customerIds: ['customer-1']
          }
        ],
        employeeId: 'employee-123'
      };
      const mockBookingRoom = {
        id: 'br-1',
        bookingId: 'booking-123',
        roomId: 'room-1',
        status: BookingStatus.PENDING, // Not CONFIRMED
        room: {
          id: 'room-1',
          roomNumber: '101'
        },
        booking: {
          id: 'booking-123'
        }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.bookingRoom = {
        ...mockPrisma.bookingRoom,
        // @ts-expect-error - Mock setup
        findMany: jest.fn().mockResolvedValue([mockBookingRoom])
      } as any;

      await expect(bookingService.checkIn(checkInData)).rejects.toThrow(ApiError);
      await expect(bookingService.checkIn(checkInData)).rejects.toThrow(
        'Cannot check in. All booking rooms must be CONFIRMED'
      );
    });

    it('should throw error if customer not found', async () => {
      const checkInData = {
        checkInInfo: [
          {
            bookingRoomId: 'br-1',
            customerIds: ['non-existent-customer']
          }
        ],
        employeeId: 'employee-123'
      };
      const mockBookingRoom = {
        id: 'br-1',
        bookingId: 'booking-123',
        roomId: 'room-1',
        status: BookingStatus.CONFIRMED,
        room: {
          id: 'room-1',
          roomNumber: '101'
        },
        booking: {
          id: 'booking-123'
        }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.bookingRoom = {
        ...mockPrisma.bookingRoom,
        // @ts-expect-error - Mock setup
        findMany: jest.fn().mockResolvedValue([mockBookingRoom])
      } as any;
      // @ts-expect-error - Mock setup
      mockPrisma.customer!.findMany = jest.fn().mockResolvedValue([]);

      await expect(bookingService.checkIn(checkInData)).rejects.toThrow(ApiError);
      await expect(bookingService.checkIn(checkInData)).rejects.toThrow(
        'One or more customers not found'
      );
    });
  });

  describe('checkOut', () => {
    it('should throw error if booking room not found', async () => {
      const checkOutData = {
        bookingRoomIds: ['non-existent'],
        employeeId: 'employee-123'
      };

      // @ts-expect-error - Mock setup
      mockPrisma.bookingRoom = {
        ...mockPrisma.bookingRoom,
        // @ts-expect-error - Mock setup
        findMany: jest.fn().mockResolvedValue([])
      } as any;

      await expect(bookingService.checkOut(checkOutData)).rejects.toThrow(ApiError);
      await expect(bookingService.checkOut(checkOutData)).rejects.toThrow(
        'One or more booking rooms not found'
      );
    });

    it('should throw error if booking room is not CHECKED_IN', async () => {
      const checkOutData = {
        bookingRoomIds: ['br-1'],
        employeeId: 'employee-123'
      };
      const mockBookingRoom = {
        id: 'br-1',
        bookingId: 'booking-123',
        roomId: 'room-1',
        status: BookingStatus.CONFIRMED, // Not CHECKED_IN
        room: {
          id: 'room-1',
          roomNumber: '101'
        },
        booking: {
          id: 'booking-123'
        }
      };

      // @ts-expect-error - Mock setup
      mockPrisma.bookingRoom = {
        ...mockPrisma.bookingRoom,
        // @ts-expect-error - Mock setup
        findMany: jest.fn().mockResolvedValue([mockBookingRoom])
      } as any;

      await expect(bookingService.checkOut(checkOutData)).rejects.toThrow(ApiError);
      await expect(bookingService.checkOut(checkOutData)).rejects.toThrow(
        'Cannot check out. All booking rooms must be CHECKED_IN'
      );
    });
  });
});
