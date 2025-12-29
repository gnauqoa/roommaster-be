import { PrismaClient, Prisma } from '@prisma/client';
import { Injectable } from '@/core/decorators';

export interface GetTransactionDetailsFilters {
  transactionId?: string;
  bookingRoomId?: string;
  serviceUsageId?: string;
  minBaseAmount?: number;
  maxBaseAmount?: number;
  minAmount?: number;
  maxAmount?: number;
  minDiscountAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string;
  endDate?: string;
}

export interface GetTransactionDetailsOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'baseAmount' | 'amount' | 'discountAmount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Transaction Details Service
 *
 * Handles searching and filtering of TransactionDetail records
 */
@Injectable()
export class TransactionDetailsService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Get transaction details with pagination and filters
   * Search across TransactionDetail records
   */
  async getTransactionDetails(
    filters: GetTransactionDetailsFilters,
    options: GetTransactionDetailsOptions
  ) {
    const {
      transactionId,
      bookingRoomId,
      serviceUsageId,
      minBaseAmount,
      maxBaseAmount,
      minAmount,
      maxAmount,
      minDiscountAmount,
      maxDiscountAmount,
      startDate,
      endDate
    } = filters;

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    // Build where clause
    const where: Prisma.TransactionDetailWhereInput = {};

    if (transactionId) {
      where.transactionId = transactionId;
    }

    if (bookingRoomId) {
      where.bookingRoomId = bookingRoomId;
    }

    if (serviceUsageId) {
      where.serviceUsageId = serviceUsageId;
    }

    // Amount filters
    if (minBaseAmount !== undefined || maxBaseAmount !== undefined) {
      where.baseAmount = {};
      if (minBaseAmount !== undefined) {
        where.baseAmount.gte = minBaseAmount;
      }
      if (maxBaseAmount !== undefined) {
        where.baseAmount.lte = maxBaseAmount;
      }
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) {
        where.amount.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.amount.lte = maxAmount;
      }
    }

    if (minDiscountAmount !== undefined || maxDiscountAmount !== undefined) {
      where.discountAmount = {};
      if (minDiscountAmount !== undefined) {
        where.discountAmount.gte = minDiscountAmount;
      }
      if (maxDiscountAmount !== undefined) {
        where.discountAmount.lte = maxDiscountAmount;
      }
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [details, total] = await Promise.all([
      this.prisma.transactionDetail.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          transaction: {
            select: {
              id: true,
              type: true,
              status: true,
              method: true,
              occurredAt: true,
              booking: {
                select: {
                  bookingCode: true,
                  primaryCustomer: {
                    select: {
                      fullName: true,
                      phone: true
                    }
                  }
                }
              }
            }
          },
          bookingRoom: {
            include: {
              room: {
                select: {
                  roomNumber: true,
                  floor: true
                }
              },
              roomType: {
                select: {
                  name: true,
                  pricePerNight: true
                }
              }
            }
          },
          serviceUsage: {
            include: {
              service: {
                select: {
                  name: true,
                  price: true,
                  unit: true
                }
              }
            }
          },
          usedPromotions: {
            include: {
              promotion: {
                select: {
                  code: true,
                  description: true,
                  type: true,
                  value: true
                }
              }
            }
          }
        }
      }),
      this.prisma.transactionDetail.count({ where })
    ]);

    return {
      details,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export default TransactionDetailsService;
