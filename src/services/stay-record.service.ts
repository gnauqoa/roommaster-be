import {
  StayRecord,
  StayDetail,
  GuestInResidence,
  StayRecordStatus,
  StayDetailStatus,
  RoomStatus,
  ReservationStatus,
  Prisma,
  PrismaClient
} from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { PaginatedResponse } from 'types/response';
import { Injectable } from 'core/decorators';

interface GuestInput {
  fullName: string;
  idType?: string;
  idNumber?: string;
  dateOfBirth?: Date;
  nationality?: string;
  address?: string;
  phone?: string;
  isMainGuest?: boolean;
}

interface StayDetailInput {
  roomId: number;
  expectedCheckOut: Date;
  numberOfGuests?: number;
  notes?: string;
  guests?: GuestInput[];
}

interface RoomAssignment {
  roomId: number;
  guests?: GuestInput[];
}

@Injectable()
export class StayRecordService {
  constructor(private readonly prisma: PrismaClient) {}

  async generateStayRecordCode(): Promise<string> {
    const today = new Date();
    const prefix = `STY${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;

    const lastRecord = await this.prisma.stayRecord.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' }
    });

    let sequence = 1;
    if (lastRecord) {
      const lastSequence = parseInt(lastRecord.code.slice(-4), 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  // Walk-in check-in
  async createStayRecord(
    employeeId: number,
    data: {
      customerId: number;
      notes?: string;
      stayDetails: StayDetailInput[];
    }
  ): Promise<StayRecord> {
    const customer = await this.prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Customer not found');
    }

    // Validate rooms are available
    for (const detail of data.stayDetails) {
      const room = await this.prisma.room.findUnique({ where: { id: detail.roomId } });
      if (!room) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Room ${detail.roomId} not found`);
      }
      if (room.status !== RoomStatus.AVAILABLE) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Room ${room.code} is not available`);
      }
    }

    const code = await this.generateStayRecordCode();

    const stayRecord = await this.prisma.stayRecord.create({
      data: {
        code,
        customerId: data.customerId,
        employeeId,
        notes: data.notes,
        status: StayRecordStatus.OPEN,
        stayDetails: {
          create: data.stayDetails.map((d) => ({
            roomId: d.roomId,
            expectedCheckOut: d.expectedCheckOut,
            numberOfGuests: d.numberOfGuests ?? 1,
            notes: d.notes,
            status: StayDetailStatus.OCCUPIED,
            guestsInResidence: d.guests
              ? {
                  create: d.guests.map((g) => ({
                    fullName: g.fullName,
                    idType: g.idType,
                    idNumber: g.idNumber,
                    dateOfBirth: g.dateOfBirth,
                    nationality: g.nationality,
                    address: g.address,
                    phone: g.phone,
                    isMainGuest: g.isMainGuest ?? false
                  }))
                }
              : undefined
          }))
        }
      },
      include: {
        stayDetails: {
          include: {
            room: { include: { roomType: true } },
            guestsInResidence: true
          }
        }
      }
    });

    // Update room statuses to OCCUPIED
    await this.prisma.room.updateMany({
      where: { id: { in: data.stayDetails.map((d) => d.roomId) } },
      data: { status: RoomStatus.OCCUPIED }
    });

    return stayRecord;
  }

  async checkInFromReservation(
    employeeId: number,
    data: {
      reservationId: number;
      roomAssignments: RoomAssignment[];
      notes?: string;
    }
  ): Promise<StayRecord> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: data.reservationId },
      include: { reservationDetails: true, customer: true }
    });

    if (!reservation) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
    }

    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.CONFIRMED
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Reservation cannot be checked in');
    }

    // Validate rooms
    for (const assignment of data.roomAssignments) {
      const room = await this.prisma.room.findUnique({
        where: { id: assignment.roomId },
        include: { roomType: true }
      });
      if (!room) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Room ${assignment.roomId} not found`);
      }
      if (room.status !== RoomStatus.AVAILABLE) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Room ${room.code} is not available`);
      }
    }

    const code = await this.generateStayRecordCode();

    const stayRecord = await this.prisma.stayRecord.create({
      data: {
        code,
        reservationId: data.reservationId,
        employeeId,
        notes: data.notes,
        status: StayRecordStatus.OPEN,
        stayDetails: {
          create: data.roomAssignments.map((a) => ({
            roomId: a.roomId,
            expectedCheckOut: reservation.expectedDeparture,
            numberOfGuests: 1,
            status: StayDetailStatus.OCCUPIED,
            guestsInResidence: a.guests
              ? {
                  create: a.guests.map((g) => ({
                    fullName: g.fullName,
                    idType: g.idType,
                    idNumber: g.idNumber,
                    dateOfBirth: g.dateOfBirth,
                    nationality: g.nationality,
                    address: g.address,
                    phone: g.phone,
                    isMainGuest: g.isMainGuest ?? false
                  }))
                }
              : undefined
          }))
        }
      },
      include: {
        stayDetails: {
          include: {
            room: { include: { roomType: true } },
            guestsInResidence: true
          }
        },
        reservation: true
      }
    });

    // Update room statuses
    await this.prisma.room.updateMany({
      where: { id: { in: data.roomAssignments.map((a) => a.roomId) } },
      data: { status: RoomStatus.OCCUPIED }
    });

    // Update reservation status
    await this.prisma.reservation.update({
      where: { id: data.reservationId },
      data: { status: ReservationStatus.CHECKED_IN }
    });

    return stayRecord;
  }

  async queryStayRecords(
    filter: Prisma.StayRecordWhereInput,
    options: {
      limit?: number;
      page?: number;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<StayRecord>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'createdAt';
    const sortType = options.sortType ?? 'desc';

    const [stayRecords, total] = await Promise.all([
      this.prisma.stayRecord.findMany({
        where: filter,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortType },
        include: {
          stayDetails: {
            include: {
              room: { include: { roomType: true } },
              guestsInResidence: true
            }
          },
          reservation: true,
          employee: { select: { id: true, name: true, code: true } }
        }
      }),
      this.prisma.stayRecord.count({ where: filter })
    ]);

    return {
      results: stayRecords,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    };
  }

  async getStayRecordById(id: number): Promise<StayRecord | null> {
    return this.prisma.stayRecord.findUnique({
      where: { id },
      include: {
        stayDetails: {
          include: {
            room: { include: { roomType: true } },
            guestsInResidence: true,
            folioTransactions: true
          }
        },
        reservation: { include: { customer: true } },
        guestFolios: true,
        employee: { select: { id: true, name: true, code: true } }
      }
    });
  }

  async checkOutRoom(stayDetailId: number): Promise<StayDetail> {
    const stayDetail = await this.prisma.stayDetail.findUnique({
      where: { id: stayDetailId },
      include: { room: true, stayRecord: true }
    });

    if (!stayDetail) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Stay detail not found');
    }

    if (stayDetail.status === StayDetailStatus.CHECKED_OUT) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room already checked out');
    }

    const updatedDetail = await this.prisma.stayDetail.update({
      where: { id: stayDetailId },
      data: {
        status: StayDetailStatus.CHECKED_OUT,
        actualCheckOut: new Date()
      },
      include: { room: true }
    });

    // Update room status to CLEANING
    await this.prisma.room.update({
      where: { id: stayDetail.roomId },
      data: { status: RoomStatus.CLEANING }
    });

    // Create housekeeping log
    await this.prisma.housekeepingLog.create({
      data: {
        roomId: stayDetail.roomId,
        employeeId: stayDetail.stayRecord.employeeId,
        priority: 1,
        status: 'PENDING'
      }
    });

    return updatedDetail;
  }

  async checkOut(stayRecordId: number, stayDetailIds?: number[]): Promise<StayRecord> {
    const stayRecord = await this.getStayRecordById(stayRecordId);
    if (!stayRecord) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Stay record not found');
    }

    if (stayRecord.status === StayRecordStatus.CLOSED) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Stay record already closed');
    }

    const detailsToCheckOut = stayDetailIds
      ? (stayRecord as any).stayDetails.filter((d: any) => stayDetailIds.includes(d.id))
      : (stayRecord as any).stayDetails.filter((d: any) => d.status === StayDetailStatus.OCCUPIED);

    for (const detail of detailsToCheckOut) {
      await this.checkOutRoom(detail.id);
    }

    // Check if all rooms are checked out
    const remainingOccupied = await this.prisma.stayDetail.count({
      where: {
        stayRecordId,
        status: StayDetailStatus.OCCUPIED
      }
    });

    if (remainingOccupied === 0) {
      await this.prisma.stayRecord.update({
        where: { id: stayRecordId },
        data: {
          status: StayRecordStatus.CLOSED,
          checkOutTime: new Date()
        }
      });

      // Update reservation if exists
      if (stayRecord.reservationId) {
        await this.prisma.reservation.update({
          where: { id: stayRecord.reservationId as number },
          data: { status: ReservationStatus.CHECKED_OUT }
        });
      }
    }

    return (await this.getStayRecordById(stayRecordId)) as StayRecord;
  }

  async moveRoom(
    stayDetailId: number,
    newRoomId: number,
    employeeId: number,
    reason?: string
  ): Promise<StayDetail> {
    const stayDetail = await this.prisma.stayDetail.findUnique({
      where: { id: stayDetailId },
      include: { room: true }
    });

    if (!stayDetail) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Stay detail not found');
    }

    if (stayDetail.status === StayDetailStatus.CHECKED_OUT) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot move checked out room');
    }

    const newRoom = await this.prisma.room.findUnique({ where: { id: newRoomId } });
    if (!newRoom) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'New room not found');
    }

    if (newRoom.status !== RoomStatus.AVAILABLE) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'New room is not available');
    }

    const oldRoomId = stayDetail.roomId;

    // Update stay detail with new room
    const updatedDetail = await this.prisma.stayDetail.update({
      where: { id: stayDetailId },
      data: { roomId: newRoomId },
      include: { room: { include: { roomType: true } } }
    });

    // Log room move
    await this.prisma.roomMoveLog.create({
      data: {
        stayDetailId,
        fromRoomId: oldRoomId,
        toRoomId: newRoomId,
        employeeId,
        reason
      }
    });

    // Update room statuses
    await this.prisma.room.update({
      where: { id: oldRoomId },
      data: { status: RoomStatus.CLEANING }
    });

    await this.prisma.room.update({
      where: { id: newRoomId },
      data: { status: RoomStatus.OCCUPIED }
    });

    return updatedDetail;
  }

  async extendStay(stayDetailId: number, newExpectedCheckOut: Date): Promise<StayDetail> {
    const stayDetail = await this.prisma.stayDetail.findUnique({ where: { id: stayDetailId } });

    if (!stayDetail) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Stay detail not found');
    }

    if (stayDetail.status === StayDetailStatus.CHECKED_OUT) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot extend checked out room');
    }

    return this.prisma.stayDetail.update({
      where: { id: stayDetailId },
      data: { expectedCheckOut: newExpectedCheckOut },
      include: { room: { include: { roomType: true } } }
    });
  }

  async addGuestToRoom(stayDetailId: number, guest: GuestInput): Promise<GuestInResidence> {
    const stayDetail = await this.prisma.stayDetail.findUnique({ where: { id: stayDetailId } });

    if (!stayDetail) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Stay detail not found');
    }

    return this.prisma.guestInResidence.create({
      data: {
        stayDetailId,
        fullName: guest.fullName,
        idType: guest.idType,
        idNumber: guest.idNumber,
        dateOfBirth: guest.dateOfBirth,
        nationality: guest.nationality,
        address: guest.address,
        phone: guest.phone,
        isMainGuest: guest.isMainGuest ?? false
      }
    });
  }

  async getCurrentGuests(
    filter: { roomId?: number; floor?: number },
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<StayDetail>> {
    const whereClause: Prisma.StayDetailWhereInput = {
      status: StayDetailStatus.OCCUPIED
    };

    if (filter.roomId) {
      whereClause.roomId = filter.roomId;
    }

    if (filter.floor) {
      whereClause.room = { floor: filter.floor };
    }

    const [stayDetails, total] = await Promise.all([
      this.prisma.stayDetail.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          room: { include: { roomType: true } },
          guestsInResidence: true,
          stayRecord: {
            include: {
              reservation: { include: { customer: true } }
            }
          }
        }
      }),
      this.prisma.stayDetail.count({ where: whereClause })
    ]);

    return {
      results: stayDetails,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    };
  }
}

export default StayRecordService;
