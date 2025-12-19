import {
  Reservation,
  ReservationDetail,
  ReservationStatus,
  RatePolicyLoop,
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
   * Check if a date matches a rate policy based on loop type
   */
  private isDateMatchingPolicy(
    date: Date,
    policy: { fromDate: Date; toDate: Date; loop: RatePolicyLoop }
  ): boolean {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const fromDate = new Date(policy.fromDate);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(policy.toDate);
    toDate.setHours(0, 0, 0, 0);

    switch (policy.loop) {
      case RatePolicyLoop.NONE:
        // Exact date range match
        return normalizedDate >= fromDate && normalizedDate <= toDate;

      case RatePolicyLoop.WEEKLY: {
        // Match same day of week within date range
        const dayOfWeek = normalizedDate.getDay();
        const fromDayOfWeek = fromDate.getDay();
        const toDayOfWeek = toDate.getDay();
        // If fromDate and toDate are the same day of week, match that specific day
        if (fromDayOfWeek === toDayOfWeek) {
          return dayOfWeek === fromDayOfWeek;
        }
        // Otherwise check if the day is within the range of days
        if (fromDayOfWeek <= toDayOfWeek) {
          return dayOfWeek >= fromDayOfWeek && dayOfWeek <= toDayOfWeek;
        } else {
          // Wraps around (e.g., Friday to Monday)
          return dayOfWeek >= fromDayOfWeek || dayOfWeek <= toDayOfWeek;
        }
      }

      case RatePolicyLoop.MONTHLY: {
        // Match same day of month
        const dayOfMonth = normalizedDate.getDate();
        const fromDay = fromDate.getDate();
        const toDay = toDate.getDate();
        if (fromDay <= toDay) {
          return dayOfMonth >= fromDay && dayOfMonth <= toDay;
        } else {
          return dayOfMonth >= fromDay || dayOfMonth <= toDay;
        }
      }

      case RatePolicyLoop.YEARLY: {
        // Match same day/month combination
        const month = normalizedDate.getMonth();
        const day = normalizedDate.getDate();
        const fromMonth = fromDate.getMonth();
        const fromDay = fromDate.getDate();
        const toMonth = toDate.getMonth();
        const toDay = toDate.getDate();

        const dateValue = month * 100 + day;
        const fromValue = fromMonth * 100 + fromDay;
        const toValue = toMonth * 100 + toDay;

        if (fromValue <= toValue) {
          return dateValue >= fromValue && dateValue <= toValue;
        } else {
          return dateValue >= fromValue || dateValue <= toValue;
        }
      }

      default:
        return false;
    }
  }

  /**
   * Find applicable rate policy for a specific date and room type
   * Returns the policy with highest priority that matches the date
   */
  private async findApplicableRatePolicy(
    roomTypeId: number,
    date: Date
  ): Promise<{ price: Prisma.Decimal | null; ratePolicyId: number | null }> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Get all policies for this room type ordered by priority
    const policies = await this.prisma.ratePolicy.findMany({
      where: { roomTypeId },
      orderBy: { priority: 'desc' }
    });

    // Find the first matching policy
    for (const policy of policies) {
      if (this.isDateMatchingPolicy(normalizedDate, policy)) {
        return {
          price: policy.price,
          ratePolicyId: policy.id
        };
      }
    }

    // No policy found
    return {
      price: null,
      ratePolicyId: null
    };
  }

  /**
   * Get the price for a specific date and room type
   * Uses RatePolicyLog if available, otherwise finds applicable policy or falls back to rackRate
   */
  private async getPriceForDate(
    roomTypeId: number,
    date: Date,
    rackRate: Prisma.Decimal
  ): Promise<Prisma.Decimal> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Try to find existing RatePolicyLog for this date
    const existingLog = await this.prisma.ratePolicyLog.findUnique({
      where: {
        roomTypeId_date: {
          roomTypeId,
          date: normalizedDate
        }
      }
    });

    if (existingLog) {
      return existingLog.price;
    }

    // Find applicable rate policy
    const { price } = await this.findApplicableRatePolicy(roomTypeId, normalizedDate);

    // Return policy price or rackRate as fallback
    return price ?? rackRate;
  }

  /**
   * Calculate expected total price for a reservation
   * Uses current rate policies - this is for display purposes only
   */
  private async calculateExpectedTotalPrice(
    expectedArrival: Date,
    expectedDeparture: Date,
    reservationDetails: Array<{ roomTypeId: number; quantity: number }>
  ): Promise<Prisma.Decimal> {
    let totalPrice = new Prisma.Decimal(0);
    const dates = this.getDateRange(expectedArrival, expectedDeparture);

    for (const detail of reservationDetails) {
      const roomType = await this.prisma.roomType.findUnique({
        where: { id: detail.roomTypeId }
      });

      if (!roomType) continue;

      for (const date of dates) {
        const price = await this.getPriceForDate(detail.roomTypeId, date, roomType.rackRate);
        totalPrice = totalPrice.add(price.mul(detail.quantity));
      }
    }

    return totalPrice;
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

    // Calculate expected total price (info only)
    const expectedTotalPrice = await this.calculateExpectedTotalPrice(
      data.expectedArrival,
      data.expectedDeparture,
      data.reservationDetails.map((d) => ({
        roomTypeId: d.roomTypeId,
        quantity: d.quantity ?? 1
      }))
    );

    // Create reservation with details
    const reservation = await this.prisma.reservation.create({
      data: {
        code,
        customerId: data.customerId,
        expectedArrival: data.expectedArrival,
        expectedDeparture: data.expectedDeparture,
        numberOfGuests: data.numberOfGuests ?? 1,
        depositRequired: data.depositRequired,
        expectedTotalPrice,
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

    return reservation;
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

    // Update expected total price (recalculate)
    const allDetails = await this.prisma.reservationDetail.findMany({
      where: { reservationId }
    });
    const expectedTotalPrice = await this.calculateExpectedTotalPrice(
      reservation.expectedArrival,
      reservation.expectedDeparture,
      allDetails.map((d) => ({ roomTypeId: d.roomTypeId, quantity: d.quantity }))
    );
    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { expectedTotalPrice }
    });

    return reservationDetail;
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
