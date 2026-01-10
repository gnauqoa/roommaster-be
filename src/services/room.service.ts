import { PrismaClient, Room, RoomStatus, Prisma, BookingStatus } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';
import dayjs from 'dayjs';

export interface CreateRoomData {
  roomNumber: string;
  floor: number;
  code?: string;
  roomTypeId: string;
  status?: RoomStatus;
}

export interface UpdateRoomData {
  roomNumber?: string;
  floor?: number;
  code?: string;
  roomTypeId?: string;
  status?: RoomStatus;
}

export interface RoomFilters {
  search?: string;
  status?: RoomStatus;
  floor?: number;
  roomTypeId?: string;
  minCapacity?: number;
  maxCapacity?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface AvailableRoomFilters extends RoomFilters {
  checkInDate: string;
  checkOutDate: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new room
   * @param {CreateRoomData} roomData - Room data
   * @returns {Promise<Room>} Created room
   */
  async createRoom(roomData: CreateRoomData): Promise<Room> {
    // Check if room number already exists
    const existingRoom = await this.prisma.room.findUnique({
      where: { roomNumber: roomData.roomNumber }
    });

    if (existingRoom) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room number already exists');
    }

    // Verify room type exists
    const roomType = await this.prisma.roomType.findUnique({
      where: { id: roomData.roomTypeId }
    });

    if (!roomType) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room type not found');
    }

    const room = await this.prisma.room.create({
      data: {
        roomNumber: roomData.roomNumber,
        floor: roomData.floor,
        code: roomData.code || '',
        roomTypeId: roomData.roomTypeId,
        status: roomData.status || RoomStatus.AVAILABLE
      },
      include: {
        roomType: true
      }
    });

    return room;
  }

  /**
   * Get all rooms with filters and pagination
   * @param {RoomFilters} filters - Filter options
   * @param {PaginationOptions} options - Pagination options
   * @returns {Promise<{ data: Room[]; total: number; page: number; limit: number }>}
   */
  async getAllRooms(
    filters: RoomFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: Room[]; total: number; page: number; limit: number }> {
    const { search, status, floor, roomTypeId } = filters;
    const { page = 1, limit = 10, sortBy = 'roomNumber', sortOrder = 'asc' } = options;

    const where: Prisma.RoomWhereInput = {};

    // Apply search filter (search by room number)
    if (search) {
      where.roomNumber = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Apply status filter
    if (status) {
      where.status = status;
    }

    // Apply floor filter
    if (floor !== undefined) {
      where.floor = floor;
    }

    // Apply room type filter
    if (roomTypeId) {
      where.roomTypeId = roomTypeId;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          roomType: true,
          _count: {
            select: {
              bookingRooms: true
            }
          }
        }
      }),
      this.prisma.room.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit
    };
  }

  /**
   * Get room by ID
   * @param {string} roomId - Room ID
   * @returns {Promise<Room>} Room
   */
  async getRoomById(roomId: string): Promise<Room> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        roomType: true,
        _count: {
          select: {
            bookingRooms: true
          }
        }
      }
    });

    if (!room) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
    }

    return room;
  }

  /**
   * Update room by ID
   * @param {string} roomId - Room ID
   * @param {UpdateRoomData} updateData - Update data
   * @returns {Promise<Room>} Updated room
   */
  async updateRoom(roomId: string, updateData: UpdateRoomData): Promise<Room> {
    await this.getRoomById(roomId);

    // Check if updating room number to an existing number
    if (updateData.roomNumber) {
      const existingRoom = await this.prisma.room.findFirst({
        where: {
          roomNumber: updateData.roomNumber,
          id: { not: roomId }
        }
      });

      if (existingRoom) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Room number already exists');
      }
    }

    // Verify room type exists if updating
    if (updateData.roomTypeId) {
      const roomType = await this.prisma.roomType.findUnique({
        where: { id: updateData.roomTypeId }
      });

      if (!roomType) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Room type not found');
      }
    }

    const updatedRoom = await this.prisma.room.update({
      where: { id: roomId },
      data: updateData,
      include: {
        roomType: true
      }
    });

    return updatedRoom;
  }

  /**
   * Delete room by ID
   * @param {string} roomId - Room ID
   * @returns {Promise<void>}
   */
  async deleteRoom(roomId: string): Promise<void> {
    await this.getRoomById(roomId);

    // Check if room has associated booking rooms
    const bookingRoomCount = await this.prisma.bookingRoom.count({
      where: { roomId }
    });

    if (bookingRoomCount > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Cannot delete room with existing bookings. Please cancel or complete the bookings first.'
      );
    }

    await this.prisma.room.delete({
      where: { id: roomId }
    });
  }

  /**
   * Search available rooms with enhanced filters (for customers)
   * @param {RoomFilters} filters - Filter options
   * @param {PaginationOptions} options - Pagination options
   * @returns {Promise<{ data: Room[]; total: number; page: number; limit: number }>}
   */
  async searchAvailableRooms(
    filters: RoomFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: Room[]; total: number; page: number; limit: number }> {
    const { search, status, floor, roomTypeId, minCapacity, maxCapacity, minPrice, maxPrice } =
      filters;
    const { page = 1, limit = 10, sortBy = 'roomNumber', sortOrder = 'asc' } = options;

    const where: Prisma.RoomWhereInput = {};

    // Apply search filter (search by room number or code)
    if (search) {
      where.OR = [
        {
          roomNumber: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          code: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Apply status filter (default to AVAILABLE for customer searches)
    where.status = status || RoomStatus.AVAILABLE;

    // Apply floor filter
    if (floor !== undefined) {
      where.floor = floor;
    }

    // Apply room type filter
    if (roomTypeId) {
      where.roomTypeId = roomTypeId;
    }

    // Apply capacity filters via room type
    if (minCapacity !== undefined || maxCapacity !== undefined) {
      if (!where.roomType) {
        where.roomType = {};
      }
      const capacityFilter: any = {};
      if (minCapacity !== undefined) {
        capacityFilter.gte = minCapacity;
      }
      if (maxCapacity !== undefined) {
        capacityFilter.lte = maxCapacity;
      }
      where.roomType.capacity = capacityFilter;
    }

    // Apply price filters via room type
    if (minPrice !== undefined || maxPrice !== undefined) {
      if (!where.roomType) {
        where.roomType = {};
      }
      const priceFilter: any = {};
      if (minPrice !== undefined) {
        priceFilter.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        priceFilter.lte = maxPrice;
      }
      where.roomType.pricePerNight = priceFilter;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          roomType: {
            include: {
              roomTypeTags: {
                include: {
                  roomTag: true
                }
              }
            }
          },
          _count: {
            select: {
              bookingRooms: true
            }
          }
        }
      }),
      this.prisma.room.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit
    };
  }

  /**
   * Search rooms available for a specific date range
   * Availability logic:
   * - Room.status NOT IN (OUT_OF_SERVICE, MAINTENANCE) - physical availability
   * - No overlapping BookingRoom with status IN (PENDING, CONFIRMED, CHECKED_IN)
   *
   * @param filters - Filter options including required checkInDate and checkOutDate
   * @param options - Pagination options
   * @returns Available rooms grouped by room type
   */
  async searchAvailableRoomsByDate(
    filters: AvailableRoomFilters,
    options: PaginationOptions = {}
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    checkInDate: string;
    checkOutDate: string;
  }> {
    const {
      checkInDate,
      checkOutDate,
      search,
      floor,
      roomTypeId,
      minCapacity,
      maxCapacity,
      minPrice,
      maxPrice
    } = filters;
    const { page = 1, limit = 10, sortBy = 'roomNumber', sortOrder = 'asc' } = options;

    // Validate dates
    const checkIn = dayjs(checkInDate);
    const checkOut = dayjs(checkOutDate);

    if (!checkIn.isValid() || !checkOut.isValid()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid date format. Use ISO date format.');
    }

    if (checkOut.diff(checkIn, 'day') <= 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Check-out date must be after check-in date');
    }

    // Build base where clause for rooms
    const where: Prisma.RoomWhereInput = {
      // Only exclude rooms with permanent physical issues
      status: {
        notIn: [RoomStatus.OUT_OF_SERVICE, RoomStatus.MAINTENANCE]
      }
    };

    // Apply search filter (room number or code)
    if (search) {
      where.OR = [
        { roomNumber: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Apply floor filter
    if (floor !== undefined) {
      where.floor = floor;
    }

    // Apply room type filter
    if (roomTypeId) {
      where.roomTypeId = roomTypeId;
    }

    // Apply capacity and price filters via room type
    const roomTypeFilter: Prisma.RoomTypeWhereInput = {};
    if (minCapacity !== undefined || maxCapacity !== undefined) {
      roomTypeFilter.capacity = {};
      if (minCapacity !== undefined) roomTypeFilter.capacity.gte = minCapacity;
      if (maxCapacity !== undefined) roomTypeFilter.capacity.lte = maxCapacity;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      roomTypeFilter.pricePerNight = {};
      if (minPrice !== undefined) roomTypeFilter.pricePerNight.gte = minPrice;
      if (maxPrice !== undefined) roomTypeFilter.pricePerNight.lte = maxPrice;
    }
    if (Object.keys(roomTypeFilter).length > 0) {
      where.roomType = roomTypeFilter;
    }

    // Fetch all matching rooms with their overlapping bookings
    const rooms = await this.prisma.room.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        roomType: {
          include: {
            roomTypeTags: {
              include: {
                roomTag: true
              }
            }
          }
        },
        // Find any overlapping bookings for the requested date range
        bookingRooms: {
          where: {
            AND: [
              // Overlap condition: existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
              { checkInDate: { lt: checkOut.toDate() } },
              { checkOutDate: { gt: checkIn.toDate() } },
              // Only consider active booking statuses
              {
                status: {
                  in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
                }
              }
            ]
          },
          select: {
            id: true,
            checkInDate: true,
            checkOutDate: true,
            status: true
          }
        }
      }
    });

    // Filter to only rooms with NO overlapping bookings
    const availableRooms = rooms.filter((room) => room.bookingRooms.length === 0);

    // Apply pagination after filtering
    const total = availableRooms.length;
    const skip = (page - 1) * limit;
    const paginatedRooms = availableRooms.slice(skip, skip + limit);

    // Group by room type
    const groupedByRoomType = paginatedRooms.reduce((acc, room) => {
      const rtId = room.roomTypeId;
      if (!acc[rtId]) {
        acc[rtId] = {
          roomType: room.roomType,
          availableCount: 0,
          rooms: []
        };
      }
      // Remove bookingRooms from response
      const { bookingRooms, ...roomWithoutBookings } = room;
      acc[rtId].rooms.push(roomWithoutBookings);
      acc[rtId].availableCount++;
      return acc;
    }, {} as Record<string, { roomType: any; availableCount: number; rooms: any[] }>);

    const data = Object.values(groupedByRoomType);

    return {
      data,
      total,
      page,
      limit,
      checkInDate,
      checkOutDate
    };
  }

  /**
   * Check if a specific room is available for a date range
   * Returns detailed availability info including any conflicting bookings
   *
   * @param roomId - Room ID to check
   * @param checkInDate - Check-in date
   * @param checkOutDate - Check-out date
   * @param excludeBookingId - Optional booking ID to exclude (useful for updates)
   */
  async isRoomAvailableForDates(
    roomId: string,
    checkInDate: Date,
    checkOutDate: Date,
    excludeBookingId?: string
  ): Promise<{ available: boolean; room: any; conflictingBookings: any[] }> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        roomType: true,
        bookingRooms: {
          where: {
            AND: [
              { checkInDate: { lt: checkOutDate } },
              { checkOutDate: { gt: checkInDate } },
              {
                status: {
                  in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
                }
              },
              // Exclude specific booking if provided (for update scenarios)
              ...(excludeBookingId ? [{ bookingId: { not: excludeBookingId } }] : [])
            ]
          },
          include: {
            booking: {
              select: {
                id: true,
                bookingCode: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!room) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
    }

    // Check room physical status first
    if (room.status === RoomStatus.OUT_OF_SERVICE || room.status === RoomStatus.MAINTENANCE) {
      return {
        available: false,
        room: { id: room.id, roomNumber: room.roomNumber, status: room.status },
        conflictingBookings: [{ reason: `Room is ${room.status}` }]
      };
    }

    // Map conflicting bookings for response
    const conflictingBookings = room.bookingRooms.map((br) => ({
      bookingRoomId: br.id,
      bookingId: br.booking?.id,
      bookingCode: br.booking?.bookingCode,
      checkInDate: br.checkInDate,
      checkOutDate: br.checkOutDate,
      status: br.status
    }));

    return {
      available: conflictingBookings.length === 0,
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        status: room.status
      },
      conflictingBookings
    };
  }

  /**
   * Bulk check availability for multiple rooms
   * Useful for validating a booking request before submission
   *
   * @param roomIds - Array of room IDs to check
   * @param checkInDate - Check-in date
   * @param checkOutDate - Check-out date
   */
  async checkMultipleRoomsAvailability(
    roomIds: string[],
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<{
    allAvailable: boolean;
    results: { roomId: string; roomNumber: string; available: boolean; reason?: string }[];
  }> {
    const rooms = await this.prisma.room.findMany({
      where: { id: { in: roomIds } },
      include: {
        bookingRooms: {
          where: {
            AND: [
              { checkInDate: { lt: checkOutDate } },
              { checkOutDate: { gt: checkInDate } },
              {
                status: {
                  in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN]
                }
              }
            ]
          }
        }
      }
    });

    // Check for missing rooms
    const foundIds = rooms.map((r) => r.id);
    const missingIds = roomIds.filter((id) => !foundIds.includes(id));

    const results = [
      // Results for found rooms
      ...rooms.map((room) => {
        if (room.status === RoomStatus.OUT_OF_SERVICE || room.status === RoomStatus.MAINTENANCE) {
          return {
            roomId: room.id,
            roomNumber: room.roomNumber,
            available: false,
            reason: `Room is ${room.status}`
          };
        }

        if (room.bookingRooms.length > 0) {
          return {
            roomId: room.id,
            roomNumber: room.roomNumber,
            available: false,
            reason: 'Room has overlapping bookings for the selected dates'
          };
        }

        return {
          roomId: room.id,
          roomNumber: room.roomNumber,
          available: true
        };
      }),
      // Results for missing rooms
      ...missingIds.map((id) => ({
        roomId: id,
        roomNumber: 'Unknown',
        available: false,
        reason: 'Room not found'
      }))
    ];

    const allAvailable = results.every((r) => r.available);

    return { allAvailable, results };
  }
}

export default RoomService;
