import { PrismaClient, Prisma } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';
import { PromotionService, ActivityService, UsageServiceService } from '@/services';

import {
  CreateTransactionPayload,
  GetTransactionsFilters,
  GetTransactionsOptions,
  GetTransactionDetailsFilters,
  GetTransactionDetailsOptions
} from './types';
import { processFullBookingPayment } from '@/services/transaction/handlers/full-booking-payment';
import { processSplitRoomPayment } from '@/services/transaction/handlers/split-room-payment';
import { processBookingServicePayment } from '@/services/transaction/handlers/booking-service-payment';
import { processGuestServicePayment } from '@/services/transaction/handlers/guest-service-payment';

/**
 * Transaction Service
 *
 * Transaction Model:
 * - Transaction: Grouping entity for booking-related payments (has bookingId)
 * - TransactionDetail: Individual payment allocations (has bookingRoomId or serviceUsageId)
 *
 * Payment Scenarios:
 * 1. Full booking payment: Creates Transaction + multiple TransactionDetails
 * 2. Split room payment: Creates Transaction + TransactionDetails for selected rooms
 * 3. Booking service payment: Creates Transaction + TransactionDetail for service
 * 4. Guest service payment: Creates TransactionDetail only (no Transaction)
 *
 * Promotion Flow:
 * 1. Build transaction details
 * 2. Validate promotions
 * 3. Calculate discounts
 * 4. Apply discounts to details
 * 5. Aggregate transaction amounts
 * 6. Persist transaction, details, and used promotions
 */
@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly activityService: ActivityService,
    private readonly usageServiceService: UsageServiceService,
    private readonly promotionService: PromotionService
  ) {}

  /**
   * Main transaction creation entry point
   * Routes to appropriate handler based on payment scenario
   */
  async createTransaction(payload: CreateTransactionPayload) {
    const { bookingId, bookingRoomIds, serviceUsageId } = payload;

    const hasBooking = !!bookingId;
    const hasRooms = bookingRoomIds && bookingRoomIds.length > 0;
    const hasService = !!serviceUsageId;

    // Scenario 4: Guest service payment (no booking, no transaction entity)
    if (hasService && !hasBooking) {
      return processGuestServicePayment(
        payload,
        this.prisma,
        this.activityService,
        this.usageServiceService
      );
    }

    // Scenario 3: Booking service payment
    if (hasService && hasBooking) {
      return processBookingServicePayment(
        payload,
        this.prisma,
        this.activityService,
        this.usageServiceService,
        this.promotionService
      );
    }

    // Scenario 2: Split room payments
    if (hasBooking && hasRooms) {
      return processSplitRoomPayment(
        payload,
        this.prisma,
        this.activityService,
        this.usageServiceService,
        this.promotionService
      );
    }

    // Scenario 1: Full booking payment
    if (hasBooking && !hasRooms && !hasService) {
      return processFullBookingPayment(
        payload,
        this.prisma,
        this.activityService,
        this.usageServiceService,
        this.promotionService
      );
    }

    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid payment scenario');
  }

  /**
   * Get transactions with pagination and filters
   */
  async getTransactions(filters: GetTransactionsFilters, options: GetTransactionsOptions) {
    const { bookingId, status, type, method, startDate, endDate, search } = filters;

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    // Build where clause
    const where: Prisma.TransactionWhereInput = {};

    if (bookingId) {
      where.bookingId = bookingId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (method) {
      where.method = method;
    }

    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) {
        where.occurredAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.occurredAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { transactionRef: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          booking: {
            select: {
              id: true,
              bookingCode: true,
              primaryCustomer: {
                select: {
                  id: true,
                  fullName: true,
                  phone: true
                }
              }
            }
          },
          processedBy: {
            select: {
              id: true,
              name: true,
              username: true
            }
          },
          details: {
            include: {
              bookingRoom: {
                select: {
                  id: true,
                  room: {
                    select: {
                      roomNumber: true
                    }
                  }
                }
              },
              serviceUsage: {
                select: {
                  id: true,
                  service: {
                    select: {
                      name: true
                    }
                  },
                  quantity: true
                }
              }
            }
          },
          usedPromotions: {
            include: {
              promotion: {
                select: {
                  code: true,
                  description: true
                }
              }
            }
          }
        }
      }),
      this.prisma.transaction.count({ where })
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get transaction by ID with full details
   */
  async getTransactionById(transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        booking: {
          include: {
            primaryCustomer: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                idNumber: true
              }
            },
            bookingRooms: {
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
            }
          }
        },
        processedBy: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        },
        details: {
          include: {
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
                    name: true
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
            },
            transactionDetail: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!transaction) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
    }

    return transaction;
  }

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

export default TransactionService;
