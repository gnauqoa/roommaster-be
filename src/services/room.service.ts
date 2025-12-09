import { RoomType, Room, RoomStatus, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from 'prisma';
import ApiError from 'utils/ApiError';
import { PaginatedResponse } from 'types/response';

const createRoomType = async (data: {
  code: string;
  name: string;
  baseCapacity: number;
  maxCapacity: number;
  amenities?: string;
  rackRate: number;
  extraPersonFee?: number;
  description?: string;
}): Promise<RoomType> => {
  if (await prisma.roomType.findUnique({ where: { code: data.code } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Room type code already exists');
  }
  return prisma.roomType.create({ data });
};

const queryRoomTypes = async (
  filter: Prisma.RoomTypeWhereInput,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  }
): Promise<PaginatedResponse<RoomType>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? 'createdAt';
  const sortType = options.sortType ?? 'desc';

  const [roomTypes, total] = await Promise.all([
    prisma.roomType.findMany({
      where: filter,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortType }
    }),
    prisma.roomType.count({ where: filter })
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
};

const getRoomTypeById = async (id: number): Promise<RoomType | null> => {
  return prisma.roomType.findUnique({
    where: { id },
    include: { rooms: true }
  });
};

const updateRoomTypeById = async (
  id: number,
  updateData: Prisma.RoomTypeUpdateInput
): Promise<RoomType> => {
  const roomType = await getRoomTypeById(id);
  if (!roomType) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room type not found');
  }

  if (updateData.code) {
    const existing = await prisma.roomType.findFirst({
      where: { code: updateData.code as string, NOT: { id } }
    });
    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room type code already exists');
    }
  }

  return prisma.roomType.update({
    where: { id },
    data: updateData
  });
};

const deleteRoomTypeById = async (id: number): Promise<RoomType> => {
  const roomType = await getRoomTypeById(id);
  if (!roomType) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room type not found');
  }

  const roomCount = await prisma.room.count({ where: { roomTypeId: id } });
  if (roomCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete room type with existing rooms');
  }

  return prisma.roomType.delete({ where: { id } });
};

const createRoom = async (data: {
  code: string;
  name: string;
  floor?: number;
  roomTypeId: number;
  status?: RoomStatus;
  notes?: string;
}): Promise<Room> => {
  if (await prisma.room.findUnique({ where: { code: data.code } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Room code already exists');
  }

  const roomType = await prisma.roomType.findUnique({ where: { id: data.roomTypeId } });
  if (!roomType) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Room type not found');
  }

  return prisma.room.create({
    data,
    include: { roomType: true }
  });
};

const queryRooms = async (
  filter: Prisma.RoomWhereInput,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  }
): Promise<PaginatedResponse<Room>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? 'code';
  const sortType = options.sortType ?? 'asc';

  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where: filter,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortType },
      include: { roomType: true }
    }),
    prisma.room.count({ where: filter })
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
};

const getRoomById = async (id: number): Promise<Room | null> => {
  return prisma.room.findUnique({
    where: { id },
    include: { roomType: true }
  });
};

const updateRoomById = async (id: number, updateData: Prisma.RoomUpdateInput): Promise<Room> => {
  const room = await getRoomById(id);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }

  if (updateData.code) {
    const existing = await prisma.room.findFirst({
      where: { code: updateData.code as string, NOT: { id } }
    });
    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room code already exists');
    }
  }

  return prisma.room.update({
    where: { id },
    data: updateData,
    include: { roomType: true }
  });
};

const updateRoomStatus = async (id: number, status: RoomStatus): Promise<Room> => {
  const room = await getRoomById(id);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  return prisma.room.update({
    where: { id },
    data: { status },
    include: { roomType: true }
  });
};

const deleteRoomById = async (id: number): Promise<Room> => {
  const room = await getRoomById(id);
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }

  const stayDetailCount = await prisma.stayDetail.count({ where: { roomId: id } });
  if (stayDetailCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete room with stay history');
  }

  return prisma.room.delete({ where: { id } });
};

const getAvailableRooms = async (
  checkInDate: Date,
  checkOutDate: Date,
  roomTypeId?: number,
  numberOfGuests?: number
): Promise<Room[]> => {
  const occupiedRoomIds = await prisma.stayDetail.findMany({
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

  return prisma.room.findMany({
    where: whereClause,
    include: { roomType: true },
    orderBy: { code: 'asc' }
  });
};

interface RoomAvailabilitySummary {
  roomTypeId: number;
  roomTypeName: string;
  totalRooms: number;
  availableRooms: number;
  rackRate: number;
}

const checkAvailability = async (
  checkInDate: Date,
  checkOutDate: Date,
  roomTypeId?: number
): Promise<RoomAvailabilitySummary[]> => {
  const roomTypeFilter: Prisma.RoomTypeWhereInput = {};
  if (roomTypeId) {
    roomTypeFilter.id = roomTypeId;
  }

  const roomTypes = await prisma.roomType.findMany({
    where: roomTypeFilter,
    include: {
      rooms: {
        where: { status: { not: RoomStatus.OUT_OF_ORDER } }
      }
    }
  });

  const occupiedStayDetails = await prisma.stayDetail.findMany({
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
};

export default {
  createRoomType,
  queryRoomTypes,
  getRoomTypeById,
  updateRoomTypeById,
  deleteRoomTypeById,
  createRoom,
  queryRooms,
  getRoomById,
  updateRoomById,
  updateRoomStatus,
  deleteRoomById,
  getAvailableRooms,
  checkAvailability
};
