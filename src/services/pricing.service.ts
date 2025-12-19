import { RatePolicy, RatePolicyLoop, Prisma, PrismaClient } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { PaginatedResponse } from 'types/response';
import { Injectable } from 'core/decorators';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Get date range based on loop type for creating RatePolicyLog entries
   */
  private getDateRangeForPolicy(fromDate: Date, toDate: Date, loop: RatePolicyLoop): Date[] {
    const dates: Date[] = [];
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(toDate);
    to.setHours(0, 0, 0, 0);

    if (loop === RatePolicyLoop.NONE) {
      // For NONE loop, create entries for each day in the range
      const current = new Date(from);
      while (current <= to) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    } else {
      // For other loop types, just create a single entry for the fromDate
      // The loop matching logic will be used during rate lookup
      dates.push(from);
    }

    return dates;
  }

  /**
   * Create RatePolicyLog entries when a RatePolicy is created or updated
   */
  private async createRatePolicyLogs(policy: RatePolicy): Promise<void> {
    const dates = this.getDateRangeForPolicy(policy.fromDate, policy.toDate, policy.loop);

    for (const date of dates) {
      // Use upsert to handle existing entries
      await this.prisma.ratePolicyLog.upsert({
        where: {
          roomTypeId_date: {
            roomTypeId: policy.roomTypeId,
            date
          }
        },
        create: {
          roomTypeId: policy.roomTypeId,
          date,
          price: policy.price,
          ratePolicyId: policy.id
        },
        update: {
          price: policy.price,
          ratePolicyId: policy.id
        }
      });
    }
  }

  /**
   * Create a new rate policy
   */
  async createRatePolicy(data: {
    code: string;
    name: string;
    roomTypeId: number;
    fromDate: Date;
    toDate: Date;
    loop?: RatePolicyLoop;
    price: number;
    priority?: number;
  }): Promise<RatePolicy> {
    // Check if code already exists
    const existing = await this.prisma.ratePolicy.findUnique({
      where: { code: data.code }
    });
    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Rate policy code already exists');
    }

    // Validate room type exists
    const roomType = await this.prisma.roomType.findUnique({
      where: { id: data.roomTypeId }
    });
    if (!roomType) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room type not found');
    }

    // Create rate policy
    const ratePolicy = await this.prisma.ratePolicy.create({
      data: {
        code: data.code,
        name: data.name,
        roomTypeId: data.roomTypeId,
        fromDate: data.fromDate,
        toDate: data.toDate,
        loop: data.loop ?? RatePolicyLoop.NONE,
        price: data.price,
        priority: data.priority ?? 0
      },
      include: { roomType: true }
    });

    // Create RatePolicyLog entries
    await this.createRatePolicyLogs(ratePolicy);

    return ratePolicy;
  }

  /**
   * Query rate policies with pagination
   */
  async queryRatePolicies(
    filter: Prisma.RatePolicyWhereInput,
    options: {
      limit?: number;
      page?: number;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<RatePolicy>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'createdAt';
    const sortType = options.sortType ?? 'desc';

    const [ratePolicies, total] = await Promise.all([
      this.prisma.ratePolicy.findMany({
        where: filter,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortType },
        include: { roomType: true }
      }),
      this.prisma.ratePolicy.count({ where: filter })
    ]);

    return {
      results: ratePolicies,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    };
  }

  /**
   * Get rate policy by ID
   */
  async getRatePolicyById(id: number): Promise<RatePolicy | null> {
    return this.prisma.ratePolicy.findUnique({
      where: { id },
      include: {
        roomType: true,
        ratePolicyLogs: {
          orderBy: { date: 'asc' },
          take: 100 // Limit to prevent huge responses
        }
      }
    });
  }

  /**
   * Update rate policy
   */
  async updateRatePolicyById(
    id: number,
    updateData: {
      code?: string;
      name?: string;
      roomTypeId?: number;
      fromDate?: Date;
      toDate?: Date;
      loop?: RatePolicyLoop;
      price?: number;
      priority?: number;
    }
  ): Promise<RatePolicy> {
    const ratePolicy = await this.prisma.ratePolicy.findUnique({
      where: { id }
    });
    if (!ratePolicy) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Rate policy not found');
    }

    // Check code uniqueness if changing
    if (updateData.code && updateData.code !== ratePolicy.code) {
      const existing = await this.prisma.ratePolicy.findUnique({
        where: { code: updateData.code }
      });
      if (existing) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Rate policy code already exists');
      }
    }

    // Validate room type if changing
    if (updateData.roomTypeId) {
      const roomType = await this.prisma.roomType.findUnique({
        where: { id: updateData.roomTypeId }
      });
      if (!roomType) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Room type not found');
      }
    }

    // Update rate policy
    const updatedPolicy = await this.prisma.ratePolicy.update({
      where: { id },
      data: updateData,
      include: { roomType: true }
    });

    // Recreate RatePolicyLog entries if dates, price, or loop changed
    if (
      updateData.fromDate ||
      updateData.toDate ||
      updateData.price ||
      updateData.loop ||
      updateData.roomTypeId
    ) {
      await this.createRatePolicyLogs(updatedPolicy);
    }

    return updatedPolicy;
  }

  /**
   * Delete rate policy
   */
  async deleteRatePolicyById(id: number): Promise<RatePolicy> {
    const ratePolicy = await this.prisma.ratePolicy.findUnique({
      where: { id }
    });
    if (!ratePolicy) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Rate policy not found');
    }

    // Note: RatePolicyLogs will remain for historical rate reference
    // They just won't have a linked policy anymore

    return this.prisma.ratePolicy.delete({ where: { id } });
  }

  /**
   * Calculate rate for a room type and date range
   */
  async calculateRate(
    roomTypeId: number,
    checkInDate: Date,
    checkOutDate: Date,
    numberOfGuests = 1
  ): Promise<{
    totalPrice: number;
    pricePerNight: Array<{ date: Date; price: number }>;
    extraPersonFee: number;
  }> {
    const roomType = await this.prisma.roomType.findUnique({
      where: { id: roomTypeId }
    });
    if (!roomType) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Room type not found');
    }

    const dates: Date[] = [];
    const current = new Date(checkInDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(checkOutDate);
    end.setHours(0, 0, 0, 0);

    while (current < end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const pricePerNight: Array<{ date: Date; price: number }> = [];
    let totalPrice = 0;

    for (const date of dates) {
      // Find RatePolicyLog for this date
      const ratePolicyLog = await this.prisma.ratePolicyLog.findUnique({
        where: {
          roomTypeId_date: {
            roomTypeId,
            date
          }
        }
      });

      let price: number;
      if (ratePolicyLog) {
        price = Number(ratePolicyLog.price);
      } else {
        // Fallback to rackRate
        price = Number(roomType.rackRate);
      }

      pricePerNight.push({ date, price });
      totalPrice += price;
    }

    // Calculate extra person fee
    const extraGuests = Math.max(0, numberOfGuests - roomType.baseCapacity);
    const extraPersonFee = extraGuests * Number(roomType.extraPersonFee) * dates.length;
    totalPrice += extraPersonFee;

    return {
      totalPrice,
      pricePerNight,
      extraPersonFee
    };
  }
}

export default PricingService;
