import { PrismaClient, ActivityType, Prisma } from '@prisma/client';
import { Injectable } from 'core/decorators';

export interface CreateActivityPayload {
  type: ActivityType;
  description?: string;
  metadata?: Record<string, any>;
  serviceUsageId?: string;
  bookingRoomId?: string;
  customerId?: string;
  employeeId?: string;
}

export interface ActivityFilters {
  type?: ActivityType;
  customerId?: string;
  employeeId?: string;
  bookingRoomId?: string;
  serviceUsageId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create an activity record for system events
   * Used for tracking check-ins, check-outs, service usage, customer creation, etc.
   */
  async createActivity(payload: CreateActivityPayload, tx?: any) {
    const prisma = tx || this.prisma;

    const activity = await prisma.activity.create({
      data: {
        type: payload.type,
        description: payload.description || this.getDefaultDescription(payload.type),
        ...(payload.metadata && { metadata: payload.metadata as Prisma.JsonValue }),
        ...(payload.serviceUsageId && { serviceUsageId: payload.serviceUsageId }),
        ...(payload.bookingRoomId && { bookingRoomId: payload.bookingRoomId }),
        ...(payload.customerId && { customerId: payload.customerId }),
        ...(payload.employeeId && { employeeId: payload.employeeId })
      }
    });

    return activity;
  }

  /**
   * Create multiple activities in batch
   */
  async createActivities(payloads: CreateActivityPayload[], tx?: any) {
    const prisma = tx || this.prisma;

    const activities = await Promise.all(
      payloads.map((payload) => this.createActivity(payload, prisma))
    );

    return activities;
  }

  /**
   * Helper: Create check-in activity
   */
  async createCheckInActivity(
    bookingRoomId: string,
    employeeId: string,
    roomNumber: string,
    tx?: any
  ) {
    return this.createActivity(
      {
        type: ActivityType.CHECKED_IN,
        description: `Check-in for room ${roomNumber}`,
        bookingRoomId,
        employeeId,
        metadata: {
          roomNumber,
          timestamp: new Date().toISOString()
        }
      },
      tx
    );
  }

  /**
   * Helper: Create check-out activity
   */
  async createCheckOutActivity(
    bookingRoomId: string,
    employeeId: string,
    roomNumber: string,
    tx?: any
  ) {
    return this.createActivity(
      {
        type: ActivityType.CHECKED_OUT,
        description: `Check-out for room ${roomNumber}`,
        bookingRoomId,
        employeeId,
        metadata: {
          roomNumber,
          timestamp: new Date().toISOString()
        }
      },
      tx
    );
  }

  /**
   * Helper: Create service usage activity
   */
  async createServiceUsageActivity(
    serviceUsageId: string,
    employeeId: string,
    serviceName: string,
    quantity: number,
    tx?: any
  ) {
    return this.createActivity(
      {
        type: ActivityType.CREATE_SERVICE_USAGE,
        description: `Created service usage: ${serviceName} (x${quantity})`,
        serviceUsageId,
        employeeId,
        metadata: {
          serviceName,
          quantity
        }
      },
      tx
    );
  }

  /**
   * Helper: Create customer creation activity
   */
  async createCustomerActivity(customerId: string, customerName: string, tx?: any) {
    return this.createActivity(
      {
        type: ActivityType.CREATE_CUSTOMER,
        description: `Customer created: ${customerName}`,
        customerId,
        metadata: {
          customerName
        }
      },
      tx
    );
  }

  /**
   * Helper: Create booking creation activity
   */
  async createBookingActivity(
    bookingId: string,
    customerId: string,
    employeeId: string,
    bookingCode: string,
    tx?: any
  ) {
    return this.createActivity(
      {
        type: ActivityType.CREATE_BOOKING,
        description: `Booking created: ${bookingCode}`,
        customerId,
        employeeId,
        metadata: {
          bookingCode,
          bookingId
        }
      },
      tx
    );
  }

  /**
   * Helper: Create transaction activity
   */
  async createTransactionActivity(
    transactionId: string,
    employeeId: string,
    transactionType: string,
    amount: number,
    tx?: any
  ) {
    return this.createActivity(
      {
        type: ActivityType.CREATE_TRANSACTION,
        description: `Transaction created: ${transactionType} - ${amount}`,
        employeeId,
        metadata: {
          transactionId,
          transactionType,
          amount
        }
      },
      tx
    );
  }

  /**
   * Get default description for activity type
   */
  private getDefaultDescription(type: ActivityType): string {
    switch (type) {
      case ActivityType.CREATE_BOOKING:
        return 'Booking created';
      case ActivityType.UPDATE_BOOKING:
        return 'Booking updated';
      case ActivityType.CREATE_BOOKING_ROOM:
        return 'Booking room created';
      case ActivityType.UPDATE_BOOKING_ROOM:
        return 'Booking room updated';
      case ActivityType.CREATE_SERVICE_USAGE:
        return 'Service usage created';
      case ActivityType.UPDATE_SERVICE_USAGE:
        return 'Service usage updated';
      case ActivityType.CREATE_TRANSACTION:
        return 'Transaction created';
      case ActivityType.UPDATE_TRANSACTION:
        return 'Transaction updated';
      case ActivityType.CREATE_CUSTOMER:
        return 'Customer created';
      case ActivityType.CHECKED_IN:
        return 'Checked in';
      case ActivityType.CHECKED_OUT:
        return 'Checked out';
      case ActivityType.CREATE_PROMOTION:
        return 'Promotion created';
      case ActivityType.UPDATE_PROMOTION:
        return 'Promotion updated';
      case ActivityType.CLAIM_PROMOTION:
        return 'Promotion claimed';
      default:
        return 'Activity recorded';
    }
  }

  /**
   * Get all activities with filters and pagination
   * @param {ActivityFilters} filters - Filter options
   * @param {PaginationOptions} options - Pagination options
   * @returns {Promise<{ data: any[]; total: number; page: number; limit: number }>}
   */
  async getAllActivities(
    filters: ActivityFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const {
      type,
      customerId,
      employeeId,
      bookingRoomId,
      serviceUsageId,
      startDate,
      endDate,
      search
    } = filters;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const where: Prisma.ActivityWhereInput = {};

    // Apply type filter
    if (type) {
      where.type = type;
    }

    // Apply customer filter
    if (customerId) {
      where.customerId = customerId;
    }

    // Apply employee filter
    if (employeeId) {
      where.employeeId = employeeId;
    }

    // Apply booking room filter
    if (bookingRoomId) {
      where.bookingRoomId = bookingRoomId;
    }

    // Apply service usage filter
    if (serviceUsageId) {
      where.serviceUsageId = serviceUsageId;
    }

    // Apply date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Apply search filter (search in description)
    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              phone: true
            }
          },
          employee: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          bookingRoom: {
            select: {
              id: true,
              booking: {
                select: {
                  bookingCode: true
                }
              },
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
      }),
      this.prisma.activity.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit
    };
  }

  /**
   * Get activity by ID
   * @param {string} activityId - Activity ID
   * @returns {Promise<any>} Activity
   */
  async getActivityById(activityId: string): Promise<any> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        customer: true,
        employee: true,
        bookingRoom: {
          include: {
            booking: true,
            room: true
          }
        },
        serviceUsage: {
          include: {
            service: true
          }
        }
      }
    });

    return activity;
  }
}

export default ActivityService;
