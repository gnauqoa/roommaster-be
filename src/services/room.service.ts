import { RoomType, Room, RoomStatus, Prisma, PrismaClient } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { PaginatedResponse } from 'types/response';
import { Injectable } from 'core/decorators';

@Injectable()
export class RoomService {
  constructor(private readonly prisma: PrismaClient) {}

  async createRoomType(data: {
    code: string;
    name: string;
    baseCapacity: number;
    maxCapacity: number;
    amenities?: string;
    rackRate: number;
    extraPersonFee?: number;
    description?: string;
  }): Promise<RoomType> {
    if (await this.prisma.roomType.findUnique({ where: { code: data.code } })) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room type code already exists');
    }
    return this.prisma.roomType.create({ data });
  }

  async queryRoomTypes(
    filter: Prisma.RoomTypeWhereInput,
    options: {
      limit?: number;
      page?: number;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<RoomType>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'createdAt';
    const sortType = options.sortType ?? 'desc';

    const [roomTypes, total] = await Promise.all([
      this.prisma.roomType.findMany({
        where: filter,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortType }
      }),
      this.prisma.roomType.count({ where: filter })
    ]);

    return {
      results: roomTypes,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    };
  }

  async getRoomTypeById(id: number): Promise<RoomType | null> {
    return this.prisma.roomType.findUnique({
      where: { id },
      include: { rooms: true }
    });
  }

  async updateRoomTypeById(id: number, updateData: Prisma.RoomTypeUpdateInput): Promise<RoomType> {
    const roomType = await this.getRoomTypeById(id);
    if (!roomType) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room type not found');
    }

    if (updateData.code) {
      const existing = await this.prisma.roomType.findFirst({
        where: { code: updateData.code as string, NOT: { id } }
      });
      if (existing) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Room type code already exists');
      }
    }

    return this.prisma.roomType.update({
      where: { id },
      data: updateData
    });
  }

  async deleteRoomTypeById(id: number): Promise<RoomType> {
    const roomType = await this.getRoomTypeById(id);
    if (!roomType) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room type not found');
    }

    const roomCount = await this.prisma.room.count({ where: { roomTypeId: id } });
    if (roomCount > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete room type with existing rooms');
    }

    return this.prisma.roomType.delete({ where: { id } });
  }

  async createRoom(data: {
    code: string;
    name: string;
    floor?: number;
    roomTypeId: number;
    status?: RoomStatus;
    notes?: string;
  }): Promise<Room> {
    if (await this.prisma.room.findUnique({ where: { code: data.code } })) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room code already exists');
    }

    const roomType = await this.prisma.roomType.findUnique({ where: { id: data.roomTypeId } });
    if (!roomType) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room type not found');
    }

    return this.prisma.room.create({
      data,
      include: { roomType: true }
    });
  }

  async queryRooms(
    filter: Prisma.RoomWhereInput,
    options: {
      limit?: number;
      page?: number;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<Room>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'code';
    const sortType = options.sortType ?? 'asc';

    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        where: filter,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortType },
        include: { roomType: true }
      }),
      this.prisma.room.count({ where: filter })
    ]);

    return {
      results: rooms,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    };
  }

  async getRoomById(id: number): Promise<Room | null> {
    return this.prisma.room.findUnique({
      where: { id },
      include: { roomType: true }
    });
  }

  async updateRoomById(id: number, updateData: Prisma.RoomUpdateInput): Promise<Room> {
    const room = await this.getRoomById(id);
    if (!room) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
    }

    if (updateData.code) {
      const existing = await this.prisma.room.findFirst({
        where: { code: updateData.code as string, NOT: { id } }
      });
      if (existing) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Room code already exists');
      }
    }

    return this.prisma.room.update({
      where: { id },
      data: updateData,
      include: { roomType: true }
    });
  }

  async updateRoomStatus(id: number, status: RoomStatus, notes?: string): Promise<Room> {
    const room = await this.getRoomById(id);
    if (!room) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
    }

    return this.prisma.room.update({
      where: { id },
      data: { status, notes: notes ?? room.notes },
      include: { roomType: true }
    });
  }

  async deleteRoomById(id: number): Promise<Room> {
    const room = await this.getRoomById(id);
    if (!room) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
    }

    const stayDetailCount = await this.prisma.stayDetail.count({
      where: { roomId: id }
    });
    if (stayDetailCount > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete room with stay records');
    }

    return this.prisma.room.delete({ where: { id } });
  }

  async getAvailableRooms(
    checkInDate: Date,
    checkOutDate: Date,
    roomTypeId?: number,
    numberOfGuests?: number
  ): Promise<Room[]> {
    const occupiedRoomIds = await this.prisma.stayDetail.findMany({
      where: {
        status: 'OCCUPIED',
        OR: [
          {
            roomAssignedTime: { lte: checkOutDate },
            expectedCheckOut: { gte: checkInDate }
          }
        ]
      },
      select: { roomId: true }
    });

    const excludeRoomIds = occupiedRoomIds.map((r) => r.roomId);

    const whereClause: Prisma.RoomWhereInput = {
      status: RoomStatus.AVAILABLE,
      id: { notIn: excludeRoomIds }
    };

    if (roomTypeId) {
      whereClause.roomTypeId = roomTypeId;
    }

    if (numberOfGuests) {
      whereClause.roomType = {
        maxCapacity: { gte: numberOfGuests }
      };
    }

    return this.prisma.room.findMany({
      where: whereClause,
      include: { roomType: true },
      orderBy: { code: 'asc' }
    });
  }

  async checkAvailability(
    checkInDate: Date,
    checkOutDate: Date,
    roomTypeId?: number
  ): Promise<
    {
      roomTypeId: number;
      roomTypeName: string;
      totalRooms: number;
      availableRooms: number;
      rackRate: number;
    }[]
  > {
    const roomTypeFilter: Prisma.RoomTypeWhereInput = {};
    if (roomTypeId) {
      roomTypeFilter.id = roomTypeId;
    }

    const roomTypes = await this.prisma.roomType.findMany({
      where: roomTypeFilter,
      include: {
        rooms: {
          where: { status: { not: RoomStatus.OUT_OF_ORDER } }
        }
      }
    });

    const occupiedStayDetails = await this.prisma.stayDetail.findMany({
      where: {
        status: 'OCCUPIED',
        roomAssignedTime: { lte: checkOutDate },
        expectedCheckOut: { gte: checkInDate }
      },
      select: { roomId: true }
    });

    const occupiedRoomIds = new Set(occupiedStayDetails.map((s) => s.roomId));

    return roomTypes.map((rt) => {
      const availableCount = rt.rooms.filter(
        (room) => room.status === RoomStatus.AVAILABLE && !occupiedRoomIds.has(room.id)
      ).length;

      return {
        roomTypeId: rt.id,
        roomTypeName: rt.name,
        totalRooms: rt.rooms.length,
        availableRooms: availableCount,
        rackRate: Number(rt.rackRate)
      };
    });
  }
}

export default RoomService;
