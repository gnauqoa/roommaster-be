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
      default:
        return 'Activity recorded';
    }
  }
}

export default ActivityService;
