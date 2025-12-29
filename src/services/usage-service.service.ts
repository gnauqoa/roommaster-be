import { PrismaClient, Prisma, ServiceUsageStatus, ActivityType } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';
import { ActivityService } from './activity.service';

export interface CreateServiceUsagePayload {
  bookingId?: string; // Optional - for guest users or booking-level services
  bookingRoomId?: string; // Optional - for room-specific services
  serviceId: string;
  quantity: number;
  employeeId: string;
}

export interface UpdateServiceUsagePayload {
  id: string;
  quantity?: number;
  status?: ServiceUsageStatus;
}

/**
 * Service Usage Scenarios:
 * 1. Booking-level service: bookingId provided, bookingRoomId not provided
 * 2. Room-specific service: both bookingId and bookingRoomId provided
 * 3. Guest service: neither bookingId nor bookingRoomId provided
 */
@Injectable()
export class UsageServiceService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly activityService: ActivityService
  ) {}

  /**
   * Create a service usage record with self-contained financial tracking
   * Supports three scenarios:
   * 1. Booking-level service (shared across entire booking)
   * 2. Room-specific service (for a specific booking room)
   * 3. Guest service (standalone, not tied to booking)
   */
  async createServiceUsage(payload: CreateServiceUsagePayload) {
    const { bookingId, bookingRoomId, serviceId, quantity, employeeId } = payload;

    // Determine service usage scenario
    const isGuestService = !bookingId && !bookingRoomId;
    const isBookingLevelService = bookingId && !bookingRoomId;
    const isRoomSpecificService = bookingId && bookingRoomId;

    // Verify booking if provided
    if (bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
      }
    }

    // Verify booking room if provided
    if (bookingRoomId) {
      const bookingRoom = await this.prisma.bookingRoom.findUnique({
        where: { id: bookingRoomId }
      });

      if (!bookingRoom) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Booking room not found');
      }

      // Validate room belongs to booking
      if (bookingId && bookingRoom.bookingId !== bookingId) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Booking room does not belong to the specified booking'
        );
      }
    }

    // Fetch service details
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
    }

    const unitPrice = service.price;
    const totalPrice = new Prisma.Decimal(unitPrice).mul(quantity);

    // Create service usage with PENDING status
    const serviceUsage = await this.prisma.$transaction(async (tx) => {
      const created = await tx.serviceUsage.create({
        data: {
          ...(bookingId && { bookingId }),
          ...(bookingRoomId && { bookingRoomId }),
          serviceId,
          quantity,
          unitPrice,
          totalPrice,
          totalPaid: 0,
          status: ServiceUsageStatus.PENDING,
          employeeId
        },
        include: {
          service: true,
          booking: true,
          bookingRoom: true,
          employee: true
        }
      });

      // Create activity log
      let description = '';
      if (isGuestService) {
        description = `Guest service created: ${service.name} (x${quantity})`;
      } else if (isBookingLevelService) {
        description = `Booking-level service created: ${service.name} (x${quantity})`;
      } else if (isRoomSpecificService) {
        description = `Room-specific service created: ${service.name} (x${quantity})`;
      }

      await this.activityService.createActivity(
        {
          type: ActivityType.CREATE_SERVICE_USAGE,
          description,
          serviceUsageId: created.id,
          ...(bookingRoomId && { bookingRoomId }),
          employeeId,
          metadata: {
            serviceName: service.name,
            quantity,
            unitPrice: unitPrice.toString(),
            totalPrice: totalPrice.toString(),
            scenario: isGuestService ? 'guest' : isBookingLevelService ? 'booking' : 'room'
          }
        },
        tx
      );

      return created;
    });

    return serviceUsage;
  }

  /**
   * Update a service usage record
   * Status flow: PENDING -> TRANSFERRED -> COMPLETED
   * Creates activity log for status changes
   */
  async updateServiceUsage(payload: UpdateServiceUsagePayload) {
    const { id, quantity, status } = payload;

    // Fetch existing service usage
    const existingUsage = await this.prisma.serviceUsage.findUnique({
      where: { id },
      include: {
        service: true,
        booking: true,
        transactionDetails: true,
        employee: true
      }
    });

    if (!existingUsage) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Service usage not found');
    }

    // Validate status transitions
    if (status) {
      this.validateStatusTransition(existingUsage.status, status);
    }

    // Cannot update quantity if already transferred or completed
    if (quantity !== undefined && quantity !== existingUsage.quantity) {
      if (existingUsage.status === ServiceUsageStatus.TRANSFERRED) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Cannot update quantity for service that has been transferred to user'
        );
      }
      if (existingUsage.status === ServiceUsageStatus.COMPLETED) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Cannot update quantity for service that has been completed'
        );
      }
    }

    // Check if this is a cancellation
    const isCancelling =
      status === ServiceUsageStatus.CANCELLED &&
      existingUsage.status !== ServiceUsageStatus.CANCELLED;

    const result = await this.prisma.$transaction(async (tx) => {
      let newTotalPrice = existingUsage.totalPrice;

      // Calculate new total price if quantity changed (and not cancelling)
      if (quantity !== undefined && quantity !== existingUsage.quantity && !isCancelling) {
        newTotalPrice = new Prisma.Decimal(existingUsage.unitPrice).mul(quantity);
      }

      // If cancelling, set totalPrice to 0
      if (isCancelling) {
        newTotalPrice = new Prisma.Decimal(0);
      }

      // Update service usage
      const updatedUsage = await tx.serviceUsage.update({
        where: { id },
        data: {
          ...(quantity !== undefined &&
            !isCancelling && {
              quantity,
              totalPrice: newTotalPrice
            }),
          ...(isCancelling && {
            totalPrice: newTotalPrice
          }),
          ...(status !== undefined && { status })
        },
        include: {
          service: true,
          booking: true,
          bookingRoom: true,
          transactionDetails: true
        }
      });

      // Create activity log for status change
      if (status && status !== existingUsage.status) {
        let description = '';
        switch (status) {
          case ServiceUsageStatus.TRANSFERRED:
            description = `Service transferred to user: ${existingUsage.service.name}`;
            break;
          case ServiceUsageStatus.COMPLETED:
            description = `Service completed: ${existingUsage.service.name}`;
            break;
          case ServiceUsageStatus.CANCELLED:
            description = `Service cancelled: ${existingUsage.service.name}`;
            break;
          default:
            description = `Service status updated to ${status}: ${existingUsage.service.name}`;
        }

        await this.activityService.createActivity(
          {
            type: ActivityType.UPDATE_SERVICE_USAGE,
            description,
            serviceUsageId: id,
            ...(existingUsage.bookingRoomId && { bookingRoomId: existingUsage.bookingRoomId }),
            employeeId: existingUsage.employeeId,
            metadata: {
              previousStatus: existingUsage.status,
              newStatus: status,
              serviceName: existingUsage.service.name
            }
          },
          tx
        );
      }

      // Create activity log for quantity change
      if (quantity !== undefined && quantity !== existingUsage.quantity && !isCancelling) {
        await this.activityService.createActivity(
          {
            type: ActivityType.UPDATE_SERVICE_USAGE,
            description: `Service quantity updated: ${existingUsage.service.name} (${existingUsage.quantity} → ${quantity})`,
            serviceUsageId: id,
            ...(existingUsage.bookingRoomId && { bookingRoomId: existingUsage.bookingRoomId }),
            employeeId: existingUsage.employeeId,
            metadata: {
              previousQuantity: existingUsage.quantity,
              newQuantity: quantity,
              serviceName: existingUsage.service.name
            }
          },
          tx
        );
      }

      return updatedUsage;
    });

    return result;
  }

  /**
   * Update service usage payment
   * Called when a payment is made against this service usage
   * Automatically updates status to COMPLETED when fully paid
   * Creates activity log for payment and status change
   */
  async updateServiceUsagePayment(
    serviceUsageId: string,
    paidAmount: number,
    employeeId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx?: any
  ) {
    const prisma = tx || this.prisma;

    const serviceUsage = await prisma.serviceUsage.findUnique({
      where: { id: serviceUsageId },
      include: {
        service: true
      }
    });

    if (!serviceUsage) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Service usage not found');
    }

    // Validate service can be paid
    if (serviceUsage.status === ServiceUsageStatus.CANCELLED) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot pay for cancelled service');
    }

    const newTotalPaid = new Prisma.Decimal(serviceUsage.totalPaid).add(paidAmount);
    const balance = new Prisma.Decimal(serviceUsage.totalPrice).sub(newTotalPaid);

    // Determine new status
    const previousStatus = serviceUsage.status;
    let newStatus = serviceUsage.status;

    // If fully paid, mark as COMPLETED
    if (balance.lte(0)) {
      newStatus = ServiceUsageStatus.COMPLETED;
    }

    const updatedUsage = await prisma.serviceUsage.update({
      where: { id: serviceUsageId },
      data: {
        totalPaid: newTotalPaid,
        status: newStatus
      }
    });

    // Create activity log for payment
    await this.activityService.createActivity(
      {
        type: ActivityType.UPDATE_SERVICE_USAGE,
        description: `Payment received for ${serviceUsage.service.name}: ${paidAmount}`,
        serviceUsageId,
        ...(serviceUsage.bookingRoomId && { bookingRoomId: serviceUsage.bookingRoomId }),
        employeeId,
        metadata: {
          paidAmount: paidAmount.toString(),
          previousTotalPaid: serviceUsage.totalPaid.toString(),
          newTotalPaid: newTotalPaid.toString(),
          balance: balance.toString(),
          serviceName: serviceUsage.service.name
        }
      },
      tx
    );

    // Create activity log for status change to COMPLETED
    if (
      newStatus === ServiceUsageStatus.COMPLETED &&
      previousStatus !== ServiceUsageStatus.COMPLETED
    ) {
      await this.activityService.createActivity(
        {
          type: ActivityType.UPDATE_SERVICE_USAGE,
          description: `Service completed (fully paid): ${serviceUsage.service.name}`,
          serviceUsageId,
          ...(serviceUsage.bookingRoomId && { bookingRoomId: serviceUsage.bookingRoomId }),
          employeeId,
          metadata: {
            previousStatus,
            newStatus: ServiceUsageStatus.COMPLETED,
            serviceName: serviceUsage.service.name,
            totalPaid: newTotalPaid.toString()
          }
        },
        tx
      );
    }

    return updatedUsage;
  }

  /**
   * Validate status transition
   * Valid transitions:
   * - PENDING -> TRANSFERRED (service provided to user)
   * - PENDING -> CANCELLED (before providing service)
   * - TRANSFERRED -> COMPLETED (after payment)
   * - TRANSFERRED -> CANCELLED (after providing but before payment)
   * - Any status -> CANCELLED (can cancel anytime)
   */
  private validateStatusTransition(
    currentStatus: ServiceUsageStatus,
    newStatus: ServiceUsageStatus
  ): void {
    // Can always cancel
    if (newStatus === ServiceUsageStatus.CANCELLED) {
      return;
    }

    // Cannot change from COMPLETED
    if (currentStatus === ServiceUsageStatus.COMPLETED) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change status of completed service');
    }

    // Cannot change from CANCELLED
    if (currentStatus === ServiceUsageStatus.CANCELLED) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change status of cancelled service');
    }

    // Valid transitions
    const validTransitions: Record<ServiceUsageStatus, ServiceUsageStatus[]> = {
      [ServiceUsageStatus.PENDING]: [ServiceUsageStatus.TRANSFERRED, ServiceUsageStatus.CANCELLED],
      [ServiceUsageStatus.TRANSFERRED]: [
        ServiceUsageStatus.COMPLETED,
        ServiceUsageStatus.CANCELLED
      ],
      [ServiceUsageStatus.COMPLETED]: [],
      [ServiceUsageStatus.CANCELLED]: []
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Get service usage balance
   * Helper to calculate balance = totalPrice - totalPaid
   */
  getBalance(serviceUsage: {
    totalPrice: Prisma.Decimal;
    totalPaid: Prisma.Decimal;
  }): Prisma.Decimal {
    return new Prisma.Decimal(serviceUsage.totalPrice).sub(serviceUsage.totalPaid);
  }
}

export default UsageServiceService;
