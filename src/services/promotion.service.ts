import {
  PrismaClient,
  Prisma,
  PromotionType,
  PromotionScope,
  CustomerPromotionStatus,
  ActivityType
} from '@prisma/client';
import { Injectable } from '@/core/decorators';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';
import { ActivityService } from './activity.service';

export interface CreatePromotionPayload {
  code: string;
  description?: string;
  type: PromotionType;
  scope?: PromotionScope;
  value: number;
  maxDiscount?: number;
  minBookingAmount?: number;
  startDate: Date;
  endDate: Date;
  totalQty?: number;
  perCustomerLimit?: number;
  employeeId: string;
}

export interface UpdatePromotionPayload {
  id: string;
  code?: string;
  description?: string;
  value?: number;
  maxDiscount?: number;
  minBookingAmount?: number;
  startDate?: Date;
  endDate?: Date;
  totalQty?: number;
  remainingQty?: number;
  perCustomerLimit?: number;
  disabledAt?: Date | null;
  employeeId: string;
}

export interface ClaimPromotionPayload {
  customerId: string;
  promotionCode: string;
}

export interface CalculateDiscountPayload {
  promotionId: string;
  baseAmount: number;
}

export interface ApplyPromotionPayload {
  customerPromotionId: string;
  transactionDetailId: string;
  baseAmount: number;
  employeeId: string;
}

export interface ValidatePromotionPayload {
  customerPromotionId: string;
  targetType: 'transaction' | 'room' | 'service';
  bookingRoomId?: string;
  serviceUsageId?: string;
}

export interface GetPromotionsQuery {
  page?: number;
  limit?: number;
  code?: string;
  description?: string;
  maxDiscount?: number;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class PromotionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly activityService: ActivityService
  ) {}

  /**
   * Create a new promotion
   */
  async createPromotion(payload: CreatePromotionPayload) {
    const {
      code,
      description,
      type,
      scope = PromotionScope.ALL,
      value,
      maxDiscount,
      minBookingAmount = 0,
      startDate,
      endDate,
      totalQty,
      perCustomerLimit = 1,
      employeeId
    } = payload;

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Start date must be before end date');
    }

    // Validate promotion code uniqueness
    const existing = await this.prisma.promotion.findUnique({
      where: { code }
    });

    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Promotion code "${code}" already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      const promotion = await tx.promotion.create({
        data: {
          code,
          description,
          type,
          scope,
          value,
          maxDiscount,
          minBookingAmount,
          startDate,
          endDate,
          totalQty,
          remainingQty: totalQty,
          perCustomerLimit,
          disabledAt: null
        }
      });

      // Create activity
      await this.activityService.createActivity(
        {
          type: ActivityType.CREATE_PROMOTION,
          description: `Promotion created: ${code} (${
            type === PromotionType.PERCENTAGE ? value + '%' : value
          })`,
          employeeId,
          metadata: {
            promotionId: promotion.id,
            code,
            type,
            scope,
            value: value.toString()
          }
        },
        tx
      );

      return promotion;
    });
  }

  /**
   * Update promotion
   */
  async updatePromotion(payload: UpdatePromotionPayload) {
    const { id, employeeId, ...updateData } = payload;

    const existing = await this.prisma.promotion.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
    }

    // Validate code uniqueness if changing
    if (updateData.code && updateData.code !== existing.code) {
      const codeExists = await this.prisma.promotion.findUnique({
        where: { code: updateData.code }
      });

      if (codeExists) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Promotion code "${updateData.code}" already exists`
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const promotion = await tx.promotion.update({
        where: { id },
        data: updateData
      });

      // Create activity
      await this.activityService.createActivity(
        {
          type: ActivityType.UPDATE_PROMOTION,
          description: `Promotion updated: ${promotion.code}`,
          employeeId,
          metadata: {
            promotionId: id,
            changes: updateData
          }
        },
        tx
      );

      return promotion;
    });
  }

  /**
   * Customer claims a promotion
   */
  async claimPromotion(payload: ClaimPromotionPayload) {
    const { customerId, promotionCode } = payload;

    return this.prisma.$transaction(async (tx) => {
      // Find promotion
      const promotion = await tx.promotion.findUnique({
        where: { code: promotionCode }
      });

      if (!promotion) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
      }

      // Validate promotion is active and within date range
      const now = new Date();
      if (promotion.disabledAt && promotion.disabledAt <= now) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Promotion has been disabled');
      }

      if (now < promotion.startDate || now > promotion.endDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Promotion is not valid at this time');
      }

      // Check remaining quantity
      if (promotion.remainingQty !== null && promotion.remainingQty <= 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Promotion is no longer available');
      }

      // Check per-customer limit
      const customerPromotionCount = await tx.customerPromotion.count({
        where: {
          customerId,
          promotionId: promotion.id
        }
      });

      if (customerPromotionCount >= promotion.perCustomerLimit) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `You have already claimed this promotion ${promotion.perCustomerLimit} time(s)`
        );
      }

      // Create customer promotion
      const customerPromotion = await tx.customerPromotion.create({
        data: {
          customerId,
          promotionId: promotion.id,
          status: CustomerPromotionStatus.AVAILABLE
        }
      });

      // Decrement remaining quantity
      if (promotion.remainingQty !== null) {
        await tx.promotion.update({
          where: { id: promotion.id },
          data: {
            remainingQty: promotion.remainingQty - 1
          }
        });
      }

      // Create activity
      await this.activityService.createActivity(
        {
          type: ActivityType.CLAIM_PROMOTION,
          description: `Customer claimed promotion: ${promotion.code}`,
          customerId,
          metadata: {
            promotionId: promotion.id,
            promotionCode: promotion.code,
            customerPromotionId: customerPromotion.id
          }
        },
        tx
      );

      return customerPromotion;
    });
  }

  /**
   * Calculate discount amount for a promotion
   */
  async calculateDiscount(payload: CalculateDiscountPayload): Promise<number> {
    const { promotionId, baseAmount } = payload;

    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId }
    });

    if (!promotion) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
    }

    // Check minimum booking amount
    if (new Prisma.Decimal(baseAmount).lt(promotion.minBookingAmount)) {
      return 0;
    }

    let discount = 0;

    if (promotion.type === PromotionType.PERCENTAGE) {
      // Percentage discount
      discount = (baseAmount * promotion.value.toNumber()) / 100;

      // Apply max discount if set
      if (promotion.maxDiscount && discount > promotion.maxDiscount.toNumber()) {
        discount = promotion.maxDiscount.toNumber();
      }
    } else {
      // Fixed amount discount
      discount = promotion.value.toNumber();

      // Discount cannot exceed base amount
      if (discount > baseAmount) {
        discount = baseAmount;
      }
    }

    return discount;
  }

  /**
   * Apply promotion to a transaction detail
   * Creates UsedPromotion record and marks CustomerPromotion as used
   */
  async applyPromotion(
    payload: ApplyPromotionPayload,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx?: any
  ) {
    const { customerPromotionId, transactionDetailId, baseAmount, employeeId } = payload;

    const prisma = tx || this.prisma;

    // Fetch customer promotion
    const customerPromotion = await prisma.customerPromotion.findUnique({
      where: { id: customerPromotionId },
      include: { promotion: true, customer: true }
    });

    if (!customerPromotion) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer promotion not found');
    }

    if (customerPromotion.status !== CustomerPromotionStatus.AVAILABLE) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Promotion is not available');
    }

    // Calculate discount
    const discountAmount = await this.calculateDiscount({
      promotionId: customerPromotion.promotionId,
      baseAmount
    });

    if (discountAmount === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Base amount (${baseAmount}) does not meet minimum requirement (${customerPromotion.promotion.minBookingAmount})`
      );
    }

    // Create used promotion record
    const usedPromotion = await prisma.usedPromotion.create({
      data: {
        promotionId: customerPromotion.promotionId,
        discountAmount,
        transactionDetailId
      }
    });

    // Mark customer promotion as used
    await prisma.customerPromotion.update({
      where: { id: customerPromotionId },
      data: {
        status: CustomerPromotionStatus.USED,
        usedAt: new Date(),
        transactionDetailId
      }
    });

    // Create activity
    await this.activityService.createActivity(
      {
        type: ActivityType.UPDATE_PROMOTION,
        description: `Promotion applied: ${customerPromotion.promotion.code} - Discount: ${discountAmount}`,
        customerId: customerPromotion.customerId,
        employeeId,
        metadata: {
          promotionId: customerPromotion.promotionId,
          promotionCode: customerPromotion.promotion.code,
          discountAmount: discountAmount.toString(),
          baseAmount: baseAmount.toString(),
          transactionDetailId
        }
      },
      tx
    );

    return {
      usedPromotion,
      discountAmount
    };
  }

  /**
   * Get available promotions for a customer
   */
  async getAvailablePromotions(customerId: string, query?: GetPromotionsQuery) {
    const {
      page = 1,
      limit = 10,
      code,
      description,
      maxDiscount,
      startDate,
      endDate
    } = query || {};
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: any = {
      customerId,
      status: CustomerPromotionStatus.AVAILABLE,
      promotion: {
        disabledAt: null,
        startDate: { lte: endDate || now },
        endDate: { gte: startDate || now }
      }
    };

    // Add filters
    if (code) {
      where.promotion.code = { contains: code, mode: 'insensitive' };
    }
    if (description) {
      where.promotion.description = { contains: description, mode: 'insensitive' };
    }
    if (maxDiscount !== undefined) {
      where.promotion.maxDiscount = { lte: maxDiscount };
    }

    const [data, total] = await Promise.all([
      this.prisma.customerPromotion.findMany({
        where,
        include: { promotion: true },
        orderBy: { claimedAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.customerPromotion.count({ where })
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get active promotions (for public listing)
   */
  async getActivePromotions(query?: GetPromotionsQuery) {
    const {
      page = 1,
      limit = 10,
      code,
      description,
      maxDiscount,
      startDate,
      endDate
    } = query || {};
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: any = {
      disabledAt: null,
      startDate: { lte: endDate || now },
      endDate: { gte: startDate || now },
      OR: [{ remainingQty: null }, { remainingQty: { gt: 0 } }]
    };

    // Add filters
    if (code) {
      where.code = { contains: code, mode: 'insensitive' };
    }
    if (description) {
      where.description = { contains: description, mode: 'insensitive' };
    }
    if (maxDiscount !== undefined) {
      where.maxDiscount = { lte: maxDiscount };
    }

    const [data, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.promotion.count({ where })
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Expire customer promotions that have passed their end date
   */
  async expirePromotions() {
    const now = new Date();

    const result = await this.prisma.customerPromotion.updateMany({
      where: {
        status: CustomerPromotionStatus.AVAILABLE,
        promotion: {
          endDate: { lt: now }
        }
      },
      data: {
        status: CustomerPromotionStatus.EXPIRED
      }
    });

    return result;
  }

  /**
   * Validate promotion applicability based on scope and target entity
   * This must be called before applying a promotion
   */
  async validatePromotionApplicability(payload: ValidatePromotionPayload): Promise<{
    valid: boolean;
    reason?: string;
    promotion?: any;
  }> {
    const { customerPromotionId, targetType, bookingRoomId, serviceUsageId } = payload;

    // Fetch customer promotion with promotion details
    const customerPromotion = await this.prisma.customerPromotion.findUnique({
      where: { id: customerPromotionId },
      include: { promotion: true }
    });

    if (!customerPromotion) {
      return {
        valid: false,
        reason: 'Customer promotion not found'
      };
    }

    if (customerPromotion.status !== CustomerPromotionStatus.AVAILABLE) {
      return {
        valid: false,
        reason: `Promotion is ${customerPromotion.status.toLowerCase()}`
      };
    }

    const promotion = customerPromotion.promotion;

    // Check if promotion is active and within date range
    const now = new Date();
    if (promotion.disabledAt && promotion.disabledAt <= now) {
      return {
        valid: false,
        reason: 'Promotion has been disabled'
      };
    }

    if (now < promotion.startDate || now > promotion.endDate) {
      return {
        valid: false,
        reason: 'Promotion is not valid at this time'
      };
    }

    // Validate scope against target type
    const { scope } = promotion;

    if (scope === PromotionScope.ROOM) {
      // ROOM scope: can only be applied to booking rooms
      if (targetType !== 'room' || !bookingRoomId) {
        return {
          valid: false,
          reason: 'This promotion can only be applied to room charges'
        };
      }
    } else if (scope === PromotionScope.SERVICE) {
      // SERVICE scope: can only be applied to services
      if (targetType !== 'service' || !serviceUsageId) {
        return {
          valid: false,
          reason: 'This promotion can only be applied to service charges'
        };
      }
    } else if (scope === PromotionScope.ALL) {
      // ALL scope: can be applied to transaction, room, or service
      // No additional validation needed
    }

    return {
      valid: true,
      promotion
    };
  }
}

export default PromotionService;
