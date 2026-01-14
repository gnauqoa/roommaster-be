/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { BookingService } from '@/services/booking.service';
import { createMockPrismaClient } from '../../utils/testContainer';
import { PrismaClient, BookingStatus, RoomStatus } from '@prisma/client';
import ApiError from '@/utils/ApiError';

describe('BookingService', () => {
  let bookingService: BookingService;
  let mockPrisma: jest.Mocked<Partial<PrismaClient>>;
  let mockTransactionService: any;
  let mockActivityService: any;
  let mockEmailService: any;
  let mockRoomService: any;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    mockTransactionService = {};
    mockActivityService = {
      createActivity: jest.fn(),
      createCheckInActivity: jest.fn(),
      createCheckOutActivity: jest.fn()
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockAppSettingService: any = {
      getCheckInTime: jest.fn(),
      getCheckOutTime: jest.fn(),
      getDepositPercentage: jest.fn(async () => 50)
    };
    mockEmailService = {
      sendBookingConfirmation: jest.fn()
    };
    mockRoomService = {
      isRoomAvailableForDates: jest.fn()
    };

    bookingService = new BookingService(
      mockPrisma as PrismaClient,
      mockTransactionService,
      mockActivityService,
      mockAppSettingService as any,
      mockEmailService as any,
      mockRoomService as any
    );
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    // ============================================
    // Date Validation Tests
    // ============================================
    it('should throw error if check-out date is not after check-in date', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }],
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
        rooms: [{ roomId: 'room-1' }],
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

    // ============================================
    // Room Not Found Tests
    // ============================================
    it('should throw error if room not found', async () => {
      const bookingData = {
        rooms: [{ roomId: 'non-existent' }],
        checkInDate: '2024-01-10',
        checkOutDate: '2024-01-12',
        totalGuests: 2,
        customerId: 'customer-123'
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([]);

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(ApiError);
      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        'Rooms not found: non-existent'
      );
    });

    // ============================================
    // Room Status Blocking Tests (FIX #1)
    // Only OUT_OF_SERVICE and MAINTENANCE should block booking
    // ============================================
    it('should throw error if room is OUT_OF_SERVICE', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }],
        checkInDate: '2024-01-10',
        checkOutDate: '2024-01-12',
        totalGuests: 2,
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
      const mockRoom = {
        id: 'room-1',
        roomNumber: '101',
        roomTypeId: 'rt-1',
        status: RoomStatus.OUT_OF_SERVICE, // Room is out of service
        roomType: mockRoomType,
        bookingRooms: []
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([mockRoom]);

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(ApiError);
      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        'Room 101 cannot be booked (current status: OUT_OF_SERVICE)'
      );
    });

    it('should throw error if room is MAINTENANCE', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }],
        checkInDate: '2024-01-10',
        checkOutDate: '2024-01-12',
        totalGuests: 2,
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
      const mockRoom = {
        id: 'room-1',
        roomNumber: '101',
        roomTypeId: 'rt-1',
        status: RoomStatus.MAINTENANCE, // Room is under maintenance
        roomType: mockRoomType,
        bookingRooms: []
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([mockRoom]);

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(ApiError);
      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        'Room 101 cannot be booked (current status: MAINTENANCE)'
      );
    });

    // ============================================
    // FIX #1: OCCUPIED/RESERVED rooms CAN be booked for future dates
    // This was the critical bug - rooms currently occupied should still
    // be bookable for future dates when they'll be available
    // NOTE: The mock bookingRooms represents what DB returns AFTER filtering
    // with the overlap query. Empty array = no overlapping bookings found.
    // ============================================
    it('should allow booking OCCUPIED room for future dates (FIX #1)', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }],
        checkInDate: '2024-02-01', // Future date - no overlap with current guest
        checkOutDate: '2024-02-03',
        totalGuests: 2,
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
      const mockRoom = {
        id: 'room-1',
        roomNumber: '101',
        roomTypeId: 'rt-1',
        status: RoomStatus.OCCUPIED, // Room is currently occupied
        roomType: mockRoomType,
        // Empty array because the DB query filters for overlapping bookings
        // and the current guest's booking (01-08 to 01-15) doesn't overlap with
        // the requested dates (02-01 to 02-03)
        bookingRooms: []
      };
      const mockBooking = {
        id: 'booking-123',
        bookingCode: 'BK123456',
        status: BookingStatus.PENDING,
        primaryCustomerId: 'customer-123',
        checkInDate: new Date('2024-02-01'),
        checkOutDate: new Date('2024-02-03'),
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
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([mockRoom]);
      // @ts-expect-error - Mock setup
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback: any) => {
        const mockTx = {
          booking: {
            // @ts-expect-error - Mock setup
            create: jest.fn().mockResolvedValue(mockBooking)
          }
        };
        return callback(mockTx);
      });

      // Should NOT throw - OCCUPIED rooms can be booked for future dates
      // when there's no booking overlap
      const result = await bookingService.createBooking(bookingData);

      expect(result).toHaveProperty('bookingId');
      expect(result).toHaveProperty('bookingCode');
    });

    it('should allow booking RESERVED room for non-overlapping dates (FIX #1)', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }],
        checkInDate: '2024-02-10',
        checkOutDate: '2024-02-12',
        totalGuests: 2,
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
      const mockRoom = {
        id: 'room-1',
        roomNumber: '101',
        roomTypeId: 'rt-1',
        status: RoomStatus.RESERVED, // Room has a future reservation
        roomType: mockRoomType,
        // Empty array because existing reservation (02-01 to 02-05) doesn't
        // overlap with requested dates (02-10 to 02-12)
        bookingRooms: []
      };
      const mockBooking = {
        id: 'booking-456',
        bookingCode: 'BK789012',
        status: BookingStatus.PENDING,
        primaryCustomerId: 'customer-123',
        checkInDate: new Date('2024-02-10'),
        checkOutDate: new Date('2024-02-12'),
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
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([mockRoom]);
      // @ts-expect-error - Mock setup
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback: any) => {
        const mockTx = {
          booking: {
            // @ts-expect-error - Mock setup
            create: jest.fn().mockResolvedValue(mockBooking)
          }
        };
        return callback(mockTx);
      });

      // Should NOT throw - RESERVED rooms can be booked for non-overlapping dates
      const result = await bookingService.createBooking(bookingData);

      expect(result).toHaveProperty('bookingId');
    });

    it('should allow booking CLEANING room (FIX #1)', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }],
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-17',
        totalGuests: 2,
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
      const mockRoom = {
        id: 'room-1',
        roomNumber: '101',
        roomTypeId: 'rt-1',
        status: RoomStatus.CLEANING, // Room is being cleaned
        roomType: mockRoomType,
        bookingRooms: [] // No overlapping bookings
      };
      const mockBooking = {
        id: 'booking-789',
        bookingCode: 'BK345678',
        status: BookingStatus.PENDING,
        primaryCustomerId: 'customer-123',
        checkInDate: new Date('2024-01-15'),
        checkOutDate: new Date('2024-01-17'),
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
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([mockRoom]);
      // @ts-expect-error - Mock setup
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback: any) => {
        const mockTx = {
          booking: {
            // @ts-expect-error - Mock setup
            create: jest.fn().mockResolvedValue(mockBooking)
          }
        };
        return callback(mockTx);
      });

      // Should NOT throw - CLEANING rooms can be booked
      const result = await bookingService.createBooking(bookingData);

      expect(result).toHaveProperty('bookingId');
    });

    // ============================================
    // Overlapping Booking Tests
    // ============================================
    it('should throw error if room has overlapping bookings', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }],
        checkInDate: '2024-01-10',
        checkOutDate: '2024-01-12',
        totalGuests: 2,
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
      const mockRoom = {
        id: 'room-1',
        roomNumber: '101',
        roomTypeId: 'rt-1',
        status: RoomStatus.AVAILABLE,
        roomType: mockRoomType,
        bookingRooms: [
          {
            id: 'br-1',
            checkInDate: new Date('2024-01-09'),
            checkOutDate: new Date('2024-01-11'),
            status: BookingStatus.CONFIRMED
          }
        ] // Has overlapping booking
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([mockRoom]);

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(ApiError);
      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        'Room 101 is already booked from 2024-01-09 to 2024-01-11'
      );
    });

    it('should throw error for partial overlap at start', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }],
        checkInDate: '2024-01-14', // Overlaps with existing booking ending on 01-16
        checkOutDate: '2024-01-18',
        totalGuests: 2,
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
      const mockRoom = {
        id: 'room-1',
        roomNumber: '101',
        roomTypeId: 'rt-1',
        status: RoomStatus.RESERVED,
        roomType: mockRoomType,
        bookingRooms: [
          {
            id: 'br-1',
            checkInDate: new Date('2024-01-12'),
            checkOutDate: new Date('2024-01-16'), // Overlaps with new booking
            status: BookingStatus.CONFIRMED
          }
        ]
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([mockRoom]);

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(ApiError);
      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        'Room 101 is already booked from 2024-01-12 to 2024-01-16'
      );
    });

    it('should throw error for partial overlap at end', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }],
        checkInDate: '2024-01-10',
        checkOutDate: '2024-01-15', // Overlaps with existing booking starting on 01-14
        totalGuests: 2,
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
      const mockRoom = {
        id: 'room-1',
        roomNumber: '101',
        roomTypeId: 'rt-1',
        status: RoomStatus.AVAILABLE,
        roomType: mockRoomType,
        bookingRooms: [
          {
            id: 'br-1',
            checkInDate: new Date('2024-01-14'),
            checkOutDate: new Date('2024-01-18'),
            status: BookingStatus.CONFIRMED
          }
        ]
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([mockRoom]);

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(ApiError);
      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(
        'Room 101 is already booked from 2024-01-14 to 2024-01-18'
      );
    });

    it('should throw error when new booking completely contains existing booking', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }],
        checkInDate: '2024-01-10',
        checkOutDate: '2024-01-20', // Completely contains existing booking
        totalGuests: 2,
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
      const mockRoom = {
        id: 'room-1',
        roomNumber: '101',
        roomTypeId: 'rt-1',
        status: RoomStatus.AVAILABLE,
        roomType: mockRoomType,
        bookingRooms: [
          {
            id: 'br-1',
            checkInDate: new Date('2024-01-12'),
            checkOutDate: new Date('2024-01-15'), // Inside new booking range
            status: BookingStatus.CONFIRMED
          }
        ]
      };

      // @ts-expect-error - Mock setup
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([mockRoom]);

      await expect(bookingService.createBooking(bookingData)).rejects.toThrow(ApiError);
    });

    it('should allow booking when checkout equals existing checkin (same-day turnover)', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }],
        checkInDate: '2024-01-10',
        checkOutDate: '2024-01-15', // Checkout equals next booking's checkin
        totalGuests: 2,
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
      const mockRoom = {
        id: 'room-1',
        roomNumber: '101',
        roomTypeId: 'rt-1',
        status: RoomStatus.AVAILABLE,
        roomType: mockRoomType,
        // Empty array: same-day turnover is allowed, so DB query
        // filters out the adjacent booking (01-15 to 01-18) since
        // checkIn >= checkOut is not a real overlap
        bookingRooms: []
      };
      const mockBooking = {
        id: 'booking-123',
        bookingCode: 'BK123456',
        status: BookingStatus.PENDING,
        primaryCustomerId: 'customer-123',
        checkInDate: new Date('2024-01-10'),
        checkOutDate: new Date('2024-01-15'),
        totalGuests: 2,
        totalAmount: 500,
        depositRequired: 250,
        balance: 500,
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
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([mockRoom]);
      // @ts-expect-error - Mock setup
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback: any) => {
        const mockTx = {
          booking: {
            // @ts-expect-error - Mock setup
            create: jest.fn().mockResolvedValue(mockBooking)
          }
        };
        return callback(mockTx);
      });

      // Should NOT throw - same-day turnover is allowed
      const result = await bookingService.createBooking(bookingData);
      expect(result).toHaveProperty('bookingId');
    });

    it('should ignore CANCELLED bookings when checking overlap', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }],
        checkInDate: '2024-01-10',
        checkOutDate: '2024-01-15',
        totalGuests: 2,
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
      const mockRoom = {
        id: 'room-1',
        roomNumber: '101',
        roomTypeId: 'rt-1',
        status: RoomStatus.AVAILABLE,
        roomType: mockRoomType,
        // Empty array: DB query only returns PENDING/CONFIRMED/CHECKED_IN
        // so CANCELLED bookings are filtered out at the database level
        bookingRooms: []
      };
      const mockBooking = {
        id: 'booking-123',
        bookingCode: 'BK123456',
        status: BookingStatus.PENDING,
        primaryCustomerId: 'customer-123',
        checkInDate: new Date('2024-01-10'),
        checkOutDate: new Date('2024-01-15'),
        totalGuests: 2,
        totalAmount: 500,
        depositRequired: 250,
        balance: 500,
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
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([mockRoom]);
      // @ts-expect-error - Mock setup
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback: any) => {
        const mockTx = {
          booking: {
            // @ts-expect-error - Mock setup
            create: jest.fn().mockResolvedValue(mockBooking)
          }
        };
        return callback(mockTx);
      });

      // Should NOT throw - cancelled bookings are ignored by DB query
      const result = await bookingService.createBooking(bookingData);
      expect(result).toHaveProperty('bookingId');
    });

    it('should ignore CHECKED_OUT bookings when checking overlap', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }],
        checkInDate: '2024-01-10',
        checkOutDate: '2024-01-15',
        totalGuests: 2,
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
      const mockRoom = {
        id: 'room-1',
        roomNumber: '101',
        roomTypeId: 'rt-1',
        status: RoomStatus.AVAILABLE,
        roomType: mockRoomType,
        // Empty array: DB query only returns PENDING/CONFIRMED/CHECKED_IN
        // so CHECKED_OUT bookings are filtered out at the database level
        bookingRooms: []
      };
      const mockBooking = {
        id: 'booking-123',
        bookingCode: 'BK123456',
        status: BookingStatus.PENDING,
        primaryCustomerId: 'customer-123',
        checkInDate: new Date('2024-01-10'),
        checkOutDate: new Date('2024-01-15'),
        totalGuests: 2,
        totalAmount: 500,
        depositRequired: 250,
        balance: 500,
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
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue([mockRoom]);
      // @ts-expect-error - Mock setup
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback: any) => {
        const mockTx = {
          booking: {
            // @ts-expect-error - Mock setup
            create: jest.fn().mockResolvedValue(mockBooking)
          }
        };
        return callback(mockTx);
      });

      // Should NOT throw - checked out bookings are ignored by DB query
      const result = await bookingService.createBooking(bookingData);
      expect(result).toHaveProperty('bookingId');
    });

    // ============================================
    // FIX #2: Booking creation should NOT change room status
    // ============================================
    it('should NOT change room status to RESERVED on booking creation (FIX #2)', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }, { roomId: 'room-2' }],
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
          roomType: mockRoomType,
          bookingRooms: [] // No overlapping bookings
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
          roomType: mockRoomType,
          bookingRooms: [] // No overlapping bookings
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
        depositRequired: 200,
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
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue(mockAvailableRooms);

      // Track if room.update or room.updateMany was called
      const mockRoomUpdate = jest.fn();
      const mockRoomUpdateMany = jest.fn();

      // @ts-expect-error - Mock setup
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback: any) => {
        const mockTx = {
          booking: {
            // @ts-expect-error - Mock setup
            create: jest.fn().mockResolvedValue(mockBooking)
          },
          room: {
            update: mockRoomUpdate,
            updateMany: mockRoomUpdateMany
          }
        };
        return callback(mockTx);
      });

      const result = await bookingService.createBooking(bookingData);

      expect(result).toHaveProperty('bookingId');
      expect(result).toHaveProperty('bookingCode');
      expect(result).toHaveProperty('totalAmount');
      expect(result.totalAmount).toBe(400);

      // FIX #2: Verify that room status was NOT updated during booking creation
      // The old bug would set room status to RESERVED immediately
      expect(mockRoomUpdate).not.toHaveBeenCalled();
      expect(mockRoomUpdateMany).not.toHaveBeenCalled();
    });

    // ============================================
    // Successful Booking Tests
    // ============================================
    it('should create booking successfully with multiple rooms', async () => {
      const bookingData = {
        rooms: [{ roomId: 'room-1' }, { roomId: 'room-2' }],
        checkInDate: '2024-01-10',
        checkOutDate: '2024-01-12',
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
          roomType: mockRoomType,
          bookingRooms: []
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
          roomType: mockRoomType,
          bookingRooms: []
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
        totalAmount: 400,
        depositRequired: 200,
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
      mockPrisma.room!.findMany = jest.fn().mockResolvedValue(mockAvailableRooms);
      // @ts-expect-error - Mock setup
      mockPrisma.$transaction = jest.fn().mockImplementation(async (callback: any) => {
        const mockTx = {
          booking: {
            // @ts-expect-error - Mock setup
            create: jest.fn().mockResolvedValue(mockBooking)
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
          roomNumber: '101',
          status: RoomStatus.RESERVED // Room must be AVAILABLE or RESERVED
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
