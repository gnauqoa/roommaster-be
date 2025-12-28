import { PrismaClient, Room, RoomStatus, Prisma } from '@prisma/client';
import { Injectable } from 'core/decorators';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';

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
}

export default RoomService;
