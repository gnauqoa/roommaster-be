import {
  Reservation,
  ReservationDetail,
  ReservationStatus,
  DateType,
  Prisma,
  PrismaClient
} from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { PaginatedResponse } from 'types/response';
import { Injectable } from 'core/decorators';

interface ReservationDetailInput {
  roomTypeId: number;
  quantity?: number;
  numberOfGuests?: number;
  notes?: string;
}

@Injectable()
export class ReservationService {
  constructor(private readonly prisma: PrismaClient) {}

  private async generateReservationCode(): Promise<string> {
    const today = new Date();
    const prefix = `RES${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;

    const lastReservation = await this.prisma.reservation.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' }
    });

    let sequence = 1;
    if (lastReservation) {
      const lastSequence = parseInt(lastReservation.code.slice(-4), 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Get date range between two dates (excluding end date for hotel nights)
   */
  private getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (current < end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  /**
   * Find applicable rate policy for a specific date and room type
   * Returns the policy with highest priority that matches the date
   */
  private async findApplicableRatePolicy(
    roomTypeId: number,
    date: Date
  ): Promise<{ rateFactor: Prisma.Decimal; dateType: DateType; ratePolicyId: number | null }> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const policy = await this.prisma.ratePolicy.findFirst({
      where: {
        roomTypeId,
        fromDate: { lte: normalizedDate },
        toDate: { gte: normalizedDate }
      },
      orderBy: { priority: 'desc' }
    });

    if (policy) {
      return {
        rateFactor: policy.rateFactor,
        dateType: policy.dateType,
        ratePolicyId: policy.id
      };
    }

    // Default: no policy found, use factor 1.0 and determine dateType from day of week
    const dayOfWeek = normalizedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
      rateFactor: new Prisma.Decimal(1.0),
      dateType: isWeekend ? DateType.WEEKEND : DateType.WEEKDAY,
      ratePolicyId: null
    };
  }

  /**
   * Ensure RatePolicyLog entry exists for a given room type and date
   * Creates a snapshot if not exists
   */
  private async ensureRatePolicyLog(
    roomTypeId: number,
    date: Date,
    baseRate: Prisma.Decimal,
    rateFactor: Prisma.Decimal,
    dateType: DateType,
    ratePolicyId: number | null
  ): Promise<number> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const existingLog = await this.prisma.ratePolicyLog.findUnique({
      where: {
        roomTypeId_date: {
          roomTypeId,
          date: normalizedDate
        }
      }
    });

    if (existingLog) {
      return existingLog.id;
    }

    const newLog = await this.prisma.ratePolicyLog.create({
      data: {
        roomTypeId,
        date: normalizedDate,
        dateType,
        rateFactor,
        baseRate,
        ratePolicyId
      }
    });

    return newLog.id;
  }

  /**
   * Create daily rate records for a reservation detail
   */
  private async createReservationDetailDays(
    reservationDetailId: number,
    roomTypeId: number,
    expectedArrival: Date,
    expectedDeparture: Date
  ): Promise<void> {
    const roomType = await this.prisma.roomType.findUnique({
      where: { id: roomTypeId }
    });

    if (!roomType) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room type not found');
    }

    const dates = this.getDateRange(expectedArrival, expectedDeparture);

    for (const date of dates) {
      const { rateFactor, dateType, ratePolicyId } = await this.findApplicableRatePolicy(
        roomTypeId,
        date
      );

      const baseRate = roomType.rackRate;
      const finalRate = baseRate.mul(rateFactor);

      const ratePolicyLogId = await this.ensureRatePolicyLog(
        roomTypeId,
        date,
        baseRate,
        rateFactor,
        dateType,
        ratePolicyId
      );

      await this.prisma.reservationDetailDay.create({
        data: {
          reservationDetailId,
          date,
          baseRate,
          rateFactor,
          finalRate,
          ratePolicyLogId
        }
      });
    }
  }

  async createReservation(data: {
    customerId: number;
    expectedArrival: Date;
    expectedDeparture: Date;
    numberOfGuests?: number;
    depositRequired?: number;
    source?: string;
    notes?: string;
    reservationDetails: ReservationDetailInput[];
  }): Promise<Reservation> {
    const customer = await this.prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Customer not found');
    }

    // Validate room types
    for (const detail of data.reservationDetails) {
      const roomType = await this.prisma.roomType.findUnique({ where: { id: detail.roomTypeId } });
      if (!roomType) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Room type ${detail.roomTypeId} not found`);
      }
    }

    const code = await this.generateReservationCode();

    // Create reservation with details
    const reservation = await this.prisma.reservation.create({
      data: {
        code,
        customerId: data.customerId,
        expectedArrival: data.expectedArrival,
        expectedDeparture: data.expectedDeparture,
        numberOfGuests: data.numberOfGuests ?? 1,
        depositRequired: data.depositRequired,
        source: data.source,
        notes: data.notes,
        status: ReservationStatus.PENDING,
        reservationDetails: {
          create: data.reservationDetails.map((d) => ({
            roomTypeId: d.roomTypeId,
            quantity: d.quantity ?? 1,
            numberOfGuests: d.numberOfGuests ?? 1,
            notes: d.notes
          }))
        }
      },
      include: {
        customer: true,
        reservationDetails: { include: { roomType: true } }
      }
    });

    // Create daily rate records for each reservation detail
    for (const detail of reservation.reservationDetails) {
      await this.createReservationDetailDays(
        detail.id,
        detail.roomTypeId,
        data.expectedArrival,
        data.expectedDeparture
      );
    }

    // Return full reservation with daily rates
    return this.prisma.reservation.findUniqueOrThrow({
      where: { id: reservation.id },
      include: {
        customer: true,
        reservationDetails: {
          include: {
            roomType: true,
            reservationDetailDays: {
              orderBy: { date: 'asc' }
            }
          }
        }
      }
    });
  }

  async queryReservations(
    filter: Prisma.ReservationWhereInput,
    options: {
      limit?: number;
      page?: number;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<Reservation>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'createdAt';
    const sortType = options.sortType ?? 'desc';

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where: filter,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortType },
        include: {
          customer: true,
          reservationDetails: { include: { roomType: true } }
        }
      }),
      this.prisma.reservation.count({ where: filter })
    ]);

    return {
      results: reservations,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    };
  }

  async getReservationById(id: number): Promise<Reservation | null> {
    return this.prisma.reservation.findUnique({
      where: { id },
      include: {
        customer: true,
        reservationDetails: { include: { roomType: true } },
        guestFolios: true,
        stayRecords: true
      }
    });
  }

  async updateReservationById(
    id: number,
    updateData: Prisma.ReservationUpdateInput
  ): Promise<Reservation> {
    const reservation = await this.getReservationById(id);
    if (!reservation) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
    }

    if (reservation.status === ReservationStatus.CHECKED_IN) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update checked-in reservation');
    }

    return this.prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        reservationDetails: { include: { roomType: true } }
      }
    });
  }

  async confirmReservation(id: number): Promise<Reservation> {
    const reservation = await this.getReservationById(id);
    if (!reservation) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Only pending reservations can be confirmed');
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CONFIRMED },
      include: {
        customer: true,
        reservationDetails: { include: { roomType: true } }
      }
    });
  }

  async cancelReservation(id: number, reason?: string): Promise<Reservation> {
    const reservation = await this.getReservationById(id);
    if (!reservation) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
    }

    if (
      reservation.status === ReservationStatus.CHECKED_IN ||
      reservation.status === ReservationStatus.CHECKED_OUT
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot cancel checked-in/out reservation');
    }

    return this.prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.CANCELLED,
        notes: reason
          ? `${reservation.notes || ''}\nCancellation reason: ${reason}`
          : reservation.notes
      },
      include: {
        customer: true,
        reservationDetails: { include: { roomType: true } }
      }
    });
  }

  async addReservationDetail(
    reservationId: number,
    detail: ReservationDetailInput
  ): Promise<ReservationDetail> {
    const reservation = await this.getReservationById(reservationId);
    if (!reservation) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
    }

    const roomType = await this.prisma.roomType.findUnique({ where: { id: detail.roomTypeId } });
    if (!roomType) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room type not found');
    }

    const reservationDetail = await this.prisma.reservationDetail.create({
      data: {
        reservationId,
        roomTypeId: detail.roomTypeId,
        quantity: detail.quantity ?? 1,
        numberOfGuests: detail.numberOfGuests ?? 1,
        notes: detail.notes
      },
      include: { roomType: true }
    });

    // Create daily rate records
    await this.createReservationDetailDays(
      reservationDetail.id,
      detail.roomTypeId,
      reservation.expectedArrival,
      reservation.expectedDeparture
    );

    return this.prisma.reservationDetail.findUniqueOrThrow({
      where: { id: reservationDetail.id },
      include: {
        roomType: true,
        reservationDetailDays: { orderBy: { date: 'asc' } }
      }
    });
  }

  async updateReservationDetail(
    detailId: number,
    updateData: Prisma.ReservationDetailUpdateInput
  ): Promise<ReservationDetail> {
    const detail = await this.prisma.reservationDetail.findUnique({ where: { id: detailId } });
    if (!detail) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Reservation detail not found');
    }

    return this.prisma.reservationDetail.update({
      where: { id: detailId },
      data: updateData,
      include: { roomType: true }
    });
  }

  async deleteReservationDetail(detailId: number): Promise<ReservationDetail> {
    const detail = await this.prisma.reservationDetail.findUnique({ where: { id: detailId } });
    if (!detail) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Reservation detail not found');
    }

    return this.prisma.reservationDetail.delete({ where: { id: detailId } });
  }

  async getTodayArrivals(
    date: Date = new Date(),
    status?: ReservationStatus,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Reservation>> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const filter: Prisma.ReservationWhereInput = {
      expectedArrival: { gte: startOfDay, lte: endOfDay }
    };

    if (status) {
      filter.status = status;
    } else {
      filter.status = { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] };
    }

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where: filter,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { expectedArrival: 'asc' },
        include: {
          customer: true,
          reservationDetails: { include: { roomType: true } }
        }
      }),
      this.prisma.reservation.count({ where: filter })
    ]);

    return {
      results: reservations,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    };
  }

  async getTodayDepartures(
    date: Date = new Date(),
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Reservation>> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const filter: Prisma.ReservationWhereInput = {
      expectedDeparture: { gte: startOfDay, lte: endOfDay },
      status: ReservationStatus.CHECKED_IN
    };

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where: filter,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { expectedDeparture: 'asc' },
        include: {
          customer: true,
          reservationDetails: { include: { roomType: true } }
        }
      }),
      this.prisma.reservation.count({ where: filter })
    ]);

    return {
      results: reservations,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    };
  }
}

export default ReservationService;
