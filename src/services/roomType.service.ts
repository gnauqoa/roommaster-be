import { PrismaClient, RoomType, Prisma } from '@prisma/client';
import { Injectable } from 'core/decorators';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';

export interface CreateRoomTypeData {
  name: string;
  capacity: number;
  totalBed: number;
  pricePerNight: number;
  tagIds?: string[]; // Room tag IDs to associate
}

export interface UpdateRoomTypeData {
  name?: string;
  capacity?: number;
  totalBed?: number;
  pricePerNight?: number;
  tagIds?: string[]; // Room tag IDs to associate
}

export interface RoomTypeFilters {
  search?: string;
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
export class RoomTypeService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new room type
   * @param {CreateRoomTypeData} roomTypeData - Room type data
   * @returns {Promise<RoomType>} Created room type
   */
  async createRoomType(roomTypeData: CreateRoomTypeData): Promise<RoomType> {
    // Check if room type with same name already exists
    const existingRoomType = await this.prisma.roomType.findFirst({
      where: { name: roomTypeData.name }
    });

    if (existingRoomType) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room type with this name already exists');
    }

    const roomType = await this.prisma.roomType.create({
      data: {
        name: roomTypeData.name,
        capacity: roomTypeData.capacity,
        totalBed: roomTypeData.totalBed,
        pricePerNight: roomTypeData.pricePerNight,
        roomTypeTags: roomTypeData.tagIds
          ? {
              create: roomTypeData.tagIds.map((tagId) => ({
                name: `${roomTypeData.name}-${tagId}`,
                roomTagId: tagId
              }))
            }
          : undefined
      },
      include: {
        roomTypeTags: {
          include: {
            roomTag: true
          }
        }
      }
    });

    return roomType;
  }

  /**
   * Get all room types with filters and pagination
   * @param {RoomTypeFilters} filters - Filter options
   * @param {PaginationOptions} options - Pagination options
   * @returns {Promise<{ data: RoomType[]; total: number; page: number; limit: number }>}
   */
  async getAllRoomTypes(
    filters: RoomTypeFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: RoomType[]; total: number; page: number; limit: number }> {
    const { search, minCapacity, maxCapacity, minPrice, maxPrice } = filters;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const where: Prisma.RoomTypeWhereInput = {};

    // Apply search filter
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Apply capacity filters
    if (minCapacity !== undefined || maxCapacity !== undefined) {
      where.capacity = {};
      if (minCapacity !== undefined) {
        where.capacity.gte = minCapacity;
      }
      if (maxCapacity !== undefined) {
        where.capacity.lte = maxCapacity;
      }
    }

    // Apply price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerNight = {};
      if (minPrice !== undefined) {
        where.pricePerNight.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.pricePerNight.lte = maxPrice;
      }
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.roomType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          roomTypeTags: {
            include: {
              roomTag: true
            }
          },
          _count: {
            select: {
              rooms: true,
              bookingRooms: true
            }
          }
        }
      }),
      this.prisma.roomType.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit
    };
  }

  /**
   * Get room type by ID
   * @param {string} roomTypeId - Room type ID
   * @returns {Promise<RoomType>} Room type
   */
  async getRoomTypeById(roomTypeId: string): Promise<RoomType> {
    const roomType = await this.prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: {
        roomTypeTags: {
          include: {
            roomTag: true
          }
        },
        _count: {
          select: {
            rooms: true,
            bookingRooms: true
          }
        }
      }
    });

    if (!roomType) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room type not found');
    }

    return roomType;
  }

  /**
   * Update room type by ID
   * @param {string} roomTypeId - Room type ID
   * @param {UpdateRoomTypeData} updateData - Update data
   * @returns {Promise<RoomType>} Updated room type
   */
  async updateRoomType(roomTypeId: string, updateData: UpdateRoomTypeData): Promise<RoomType> {
    await this.getRoomTypeById(roomTypeId);

    // Check if updating name to an existing name
    if (updateData.name) {
      const existingRoomType = await this.prisma.roomType.findFirst({
        where: {
          name: updateData.name,
          id: { not: roomTypeId }
        }
      });

      if (existingRoomType) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Room type with this name already exists');
      }
    }

    // Handle tag updates if provided
    const { tagIds, ...basicUpdateData } = updateData;

    const updatedRoomType = await this.prisma.roomType.update({
      where: { id: roomTypeId },
      data: {
        ...basicUpdateData,
        ...(tagIds !== undefined && {
          roomTypeTags: {
            deleteMany: {},
            create: tagIds.map((tagId) => ({
              name: `${updateData.name || 'roomtype'}-${tagId}`,
              roomTagId: tagId
            }))
          }
        })
      },
      include: {
        roomTypeTags: {
          include: {
            roomTag: true
          }
        }
      }
    });

    return updatedRoomType;
  }

  /**
   * Delete room type by ID
   * @param {string} roomTypeId - Room type ID
   * @returns {Promise<void>}
   */
  async deleteRoomType(roomTypeId: string): Promise<void> {
    await this.getRoomTypeById(roomTypeId);

    // Check if room type has associated rooms
    const roomCount = await this.prisma.room.count({
      where: { roomTypeId }
    });

    if (roomCount > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Cannot delete room type with associated rooms. Please delete or reassign the rooms first.'
      );
    }

    await this.prisma.roomType.delete({
      where: { id: roomTypeId }
    });
  }
}

export default RoomTypeService;
