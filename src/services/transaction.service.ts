import {
  PrismaClient,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  BookingStatus,
  Prisma
} from '@prisma/client';
import { Injectable } from 'core/decorators';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { ActivityService } from './activity.service';
import { UsageServiceService } from './usage-service.service';

export interface CreateTransactionPayload {
  // Scenario identifiers
  bookingId?: string; // For booking-related payments
  bookingRoomIds?: string[]; // For split room payments
  serviceUsageId?: string; // For service-only payments (booking or guest)

  // Payment details
  amount: number;
  paymentMethod: PaymentMethod;
  transactionType: TransactionType;
  transactionRef?: string;
  description?: string;
  employeeId: string;
}

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
 */
@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly activityService: ActivityService,
    private readonly usageServiceService: UsageServiceService
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
      return this.processGuestServicePayment(payload);
    }

    // Scenario 3: Booking service payment
    if (hasService && hasBooking) {
      return this.processBookingServicePayment(payload);
    }

    // Scenario 2: Split room payments
    if (hasBooking && hasRooms) {
      return this.processSplitRoomPayment(payload);
    }

    // Scenario 1: Full booking payment
    if (hasBooking && !hasRooms && !hasService) {
      return this.processFullBookingPayment(payload);
    }

    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid payment scenario');
  }

  /**
   * Scenario 1: Full booking payment
   * Creates Transaction (with bookingId) + TransactionDetails for all rooms and services
   */
  private async processFullBookingPayment(payload: CreateTransactionPayload) {
    const {
      bookingId,
      amount,
      paymentMethod,
      transactionType,
      transactionRef,
      description,
      employeeId
    } = payload;

    if (!bookingId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID is required');
    }

    return this.prisma.$transaction(async (tx) => {
      // Fetch booking with all rooms and services
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          bookingRooms: {
            include: {
              room: true,
              serviceUsages: {
                where: { status: { not: 'CANCELLED' } }
              }
            }
          }
        }
      });

      if (!booking) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
      }

      // Calculate total outstanding
      const totalOutstanding = this.calculateBookingTotal(booking);

      if (new Prisma.Decimal(amount).gt(totalOutstanding)) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Payment amount (${amount}) exceeds outstanding balance (${totalOutstanding})`
        );
      }

      // Create transaction (grouping entity)
      const transaction = await tx.transaction.create({
        data: {
          bookingId,
          type: transactionType,
          amount,
          method: paymentMethod,
          status: TransactionStatus.COMPLETED,
          processedById: employeeId,
          transactionRef,
          description:
            description || this.getDefaultDescription(transactionType, booking.bookingCode)
        }
      });

      // Allocate payment across rooms and services
      let remainingAmount = new Prisma.Decimal(amount);

      for (const room of booking.bookingRooms) {
        // Allocate to room
        const roomBalance = new Prisma.Decimal(room.subtotalRoom).sub(room.totalPaid);

        if (roomBalance.gt(0) && remainingAmount.gt(0)) {
          const roomAllocation = Prisma.Decimal.min(roomBalance, remainingAmount);

          // Create transaction detail for room
          await tx.transactionDetail.create({
            data: {
              transactionId: transaction.id,
              bookingRoomId: room.id,
              amount: roomAllocation
            }
          });

          // Update room payment
          await tx.bookingRoom.update({
            where: { id: room.id },
            data: {
              totalPaid: new Prisma.Decimal(room.totalPaid).add(roomAllocation),
              balance: new Prisma.Decimal(room.totalAmount).sub(
                new Prisma.Decimal(room.totalPaid).add(roomAllocation)
              )
            }
          });

          remainingAmount = remainingAmount.sub(roomAllocation);
        }

        // Allocate to services in this room
        for (const service of room.serviceUsages) {
          const serviceBalance = new Prisma.Decimal(service.totalPrice).sub(service.totalPaid);

          if (serviceBalance.gt(0) && remainingAmount.gt(0)) {
            const serviceAllocation = Prisma.Decimal.min(serviceBalance, remainingAmount);

            // Create transaction detail for service
            await tx.transactionDetail.create({
              data: {
                transactionId: transaction.id,
                serviceUsageId: service.id,
                amount: serviceAllocation
              }
            });

            // Update service payment
            await this.usageServiceService.updateServiceUsagePayment(
              service.id,
              serviceAllocation.toNumber(),
              employeeId,
              tx
            );

            remainingAmount = remainingAmount.sub(serviceAllocation);
          }
        }
      }

      // Update booking totals
      await this.updateBookingTotals(bookingId, tx);

      // Apply state transition for DEPOSIT
      if (transactionType === TransactionType.DEPOSIT) {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CONFIRMED }
        });

        await tx.bookingRoom.updateMany({
          where: { bookingId, status: BookingStatus.PENDING },
          data: { status: BookingStatus.CONFIRMED }
        });
      }

      // Create activity
      await this.activityService.createTransactionActivity(
        transaction.id,
        employeeId,
        transactionType,
        amount,
        tx
      );

      return {
        transaction: await tx.transaction.findUnique({
          where: { id: transaction.id },
          include: { details: true }
        }),
        booking: await tx.booking.findUnique({
          where: { id: bookingId },
          include: {
            bookingRooms: { include: { room: true, roomType: true } },
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: { details: true }
            }
          }
        })
      };
    });
  }

  /**
   * Scenario 2: Split room payment
   * Creates Transaction (with bookingId) + TransactionDetails for selected rooms
   */
  private async processSplitRoomPayment(payload: CreateTransactionPayload) {
    const {
      bookingId,
      bookingRoomIds,
      amount,
      paymentMethod,
      transactionType,
      transactionRef,
      description,
      employeeId
    } = payload;

    if (!bookingId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID is required');
    }

    if (!bookingRoomIds || bookingRoomIds.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking room IDs are required');
    }

    return this.prisma.$transaction(async (tx) => {
      // Fetch selected rooms
      const bookingRooms = await tx.bookingRoom.findMany({
        where: { id: { in: bookingRoomIds }, bookingId },
        include: {
          room: true,
          serviceUsages: { where: { status: { not: 'CANCELLED' } } }
        }
      });

      if (bookingRooms.length === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, 'No booking rooms found');
      }

      if (bookingRooms.length !== bookingRoomIds.length) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Some booking rooms not found or do not belong to this booking'
        );
      }

      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
      }

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          bookingId,
          type: transactionType,
          amount,
          method: paymentMethod,
          status: TransactionStatus.COMPLETED,
          processedById: employeeId,
          transactionRef,
          description:
            description ||
            `${transactionType} for ${bookingRooms.length} room(s) - ${booking.bookingCode}`
        }
      });

      // Allocate payment
      let remainingAmount = new Prisma.Decimal(amount);

      for (const room of bookingRooms) {
        const roomBalance = new Prisma.Decimal(room.subtotalRoom).sub(room.totalPaid);

        if (roomBalance.gt(0) && remainingAmount.gt(0)) {
          const roomAllocation = Prisma.Decimal.min(roomBalance, remainingAmount);

          await tx.transactionDetail.create({
            data: {
              transactionId: transaction.id,
              bookingRoomId: room.id,
              amount: roomAllocation
            }
          });

          await tx.bookingRoom.update({
            where: { id: room.id },
            data: {
              totalPaid: new Prisma.Decimal(room.totalPaid).add(roomAllocation),
              balance: new Prisma.Decimal(room.totalAmount).sub(
                new Prisma.Decimal(room.totalPaid).add(roomAllocation)
              )
            }
          });

          remainingAmount = remainingAmount.sub(roomAllocation);
        }

        // Allocate to services
        for (const service of room.serviceUsages) {
          const serviceBalance = new Prisma.Decimal(service.totalPrice).sub(service.totalPaid);

          if (serviceBalance.gt(0) && remainingAmount.gt(0)) {
            const serviceAllocation = Prisma.Decimal.min(serviceBalance, remainingAmount);

            await tx.transactionDetail.create({
              data: {
                transactionId: transaction.id,
                serviceUsageId: service.id,
                amount: serviceAllocation
              }
            });

            await this.usageServiceService.updateServiceUsagePayment(
              service.id,
              serviceAllocation.toNumber(),
              employeeId,
              tx
            );

            remainingAmount = remainingAmount.sub(serviceAllocation);
          }
        }
      }

      // Update booking totals
      await this.updateBookingTotals(bookingId, tx);

      // Create activity
      await this.activityService.createTransactionActivity(
        transaction.id,
        employeeId,
        transactionType,
        amount,
        tx
      );

      return {
        transaction: await tx.transaction.findUnique({
          where: { id: transaction.id },
          include: { details: true }
        }),
        booking: await tx.booking.findUnique({
          where: { id: bookingId },
          include: {
            bookingRooms: { include: { room: true, roomType: true } },
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: { details: true }
            }
          }
        })
      };
    });
  }

  /**
   * Scenario 3: Booking service payment
   * Creates Transaction (with bookingId) + TransactionDetail for service
   */
  private async processBookingServicePayment(payload: CreateTransactionPayload) {
    const {
      bookingId,
      serviceUsageId,
      amount,
      paymentMethod,
      transactionType,
      transactionRef,
      description,
      employeeId
    } = payload;

    if (!bookingId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID is required');
    }

    if (!serviceUsageId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Service usage ID is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const serviceUsage = await tx.serviceUsage.findUnique({
        where: { id: serviceUsageId },
        include: { service: true }
      });

      if (!serviceUsage) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Service usage not found');
      }

      if (serviceUsage.bookingId !== bookingId) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Service usage does not belong to the specified booking'
        );
      }

      const balance = new Prisma.Decimal(serviceUsage.totalPrice).sub(serviceUsage.totalPaid);

      if (new Prisma.Decimal(amount).gt(balance)) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Payment amount (${amount}) exceeds service balance (${balance})`
        );
      }

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          bookingId,
          type: transactionType,
          amount,
          method: paymentMethod,
          status: TransactionStatus.COMPLETED,
          processedById: employeeId,
          transactionRef,
          description: description || `${transactionType} for ${serviceUsage.service.name}`
        }
      });

      // Create transaction detail
      await tx.transactionDetail.create({
        data: {
          transactionId: transaction.id,
          serviceUsageId,
          amount
        }
      });

      // Update service payment
      await this.usageServiceService.updateServiceUsagePayment(
        serviceUsageId,
        amount,
        employeeId,
        tx
      );

      // Update booking totals if service has booking room
      if (serviceUsage.bookingRoomId) {
        const bookingRoom = await tx.bookingRoom.findUnique({
          where: { id: serviceUsage.bookingRoomId }
        });

        if (bookingRoom) {
          await tx.bookingRoom.update({
            where: { id: serviceUsage.bookingRoomId },
            data: {
              totalPaid: new Prisma.Decimal(bookingRoom.totalPaid).add(amount),
              balance: new Prisma.Decimal(bookingRoom.totalAmount).sub(
                new Prisma.Decimal(bookingRoom.totalPaid).add(amount)
              )
            }
          });
        }
      }

      await this.updateBookingTotals(bookingId, tx);

      // Create activity
      await this.activityService.createTransactionActivity(
        transaction.id,
        employeeId,
        transactionType,
        amount,
        tx
      );

      return {
        transaction: await tx.transaction.findUnique({
          where: { id: transaction.id },
          include: { details: true }
        }),
        serviceUsage: await tx.serviceUsage.findUnique({
          where: { id: serviceUsageId },
          include: { service: true, booking: true, bookingRoom: true }
        }),
        booking: await tx.booking.findUnique({
          where: { id: bookingId },
          include: {
            bookingRooms: { include: { room: true, roomType: true } },
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: { details: true }
            }
          }
        })
      };
    });
  }

  /**
   * Scenario 4: Guest service payment
   * Creates TransactionDetail only (no Transaction entity)
   */
  private async processGuestServicePayment(payload: CreateTransactionPayload) {
    const { serviceUsageId, amount, employeeId } = payload;

    if (!serviceUsageId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Service usage ID is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const serviceUsage = await tx.serviceUsage.findUnique({
        where: { id: serviceUsageId },
        include: { service: true }
      });

      if (!serviceUsage) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Service usage not found');
      }

      if (serviceUsage.bookingId) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'This service is tied to a booking. Use booking service payment instead.'
        );
      }

      const balance = new Prisma.Decimal(serviceUsage.totalPrice).sub(serviceUsage.totalPaid);

      if (new Prisma.Decimal(amount).gt(balance)) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Payment amount (${amount}) exceeds service balance (${balance})`
        );
      }

      // Create transaction detail only (no transaction entity for guest services)
      const transactionDetail = await tx.transactionDetail.create({
        data: {
          serviceUsageId,
          amount
        }
      });

      // Update service payment
      await this.usageServiceService.updateServiceUsagePayment(
        serviceUsageId,
        amount,
        employeeId,
        tx
      );

      // Create activity for guest service payment
      await this.activityService.createActivity(
        {
          type: 'UPDATE_SERVICE_USAGE' as any,
          description: `Guest service payment: ${serviceUsage.service.name} - ${amount}`,
          serviceUsageId,
          employeeId,
          metadata: {
            amount: amount.toString(),
            serviceName: serviceUsage.service.name,
            paymentType: 'guest'
          }
        },
        tx
      );

      return {
        transactionDetail,
        serviceUsage: await tx.serviceUsage.findUnique({
          where: { id: serviceUsageId },
          include: { service: true }
        })
      };
    });
  }

  /**
   * Helper: Calculate total outstanding for a booking
   */
  private calculateBookingTotal(booking: any): Prisma.Decimal {
    return booking.bookingRooms.reduce((sum: Prisma.Decimal, room: any) => {
      const roomBalance = new Prisma.Decimal(room.subtotalRoom).sub(room.totalPaid);
      const servicesBalance = room.serviceUsages.reduce(
        (s: Prisma.Decimal, su: any) => s.add(new Prisma.Decimal(su.totalPrice).sub(su.totalPaid)),
        new Prisma.Decimal(0)
      );
      return sum.add(roomBalance).add(servicesBalance);
    }, new Prisma.Decimal(0));
  }

  /**
   * Helper: Update booking totals from all booking rooms
   */
  private async updateBookingTotals(
    bookingId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: any
  ): Promise<void> {
    const allBookingRooms = await tx.bookingRoom.findMany({
      where: { bookingId }
    });

    const aggregatedTotalPaid = allBookingRooms.reduce(
      (sum: Prisma.Decimal, br: { totalPaid: Prisma.Decimal }) => sum.add(br.totalPaid),
      new Prisma.Decimal(0)
    );

    const booking = await tx.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
    }

    const aggregatedBalance = new Prisma.Decimal(booking.totalAmount).sub(aggregatedTotalPaid);

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        totalPaid: aggregatedTotalPaid,
        balance: aggregatedBalance
      }
    });
  }

  /**
   * Helper: Get default description
   */
  private getDefaultDescription(transactionType: TransactionType, bookingCode: string): string {
    switch (transactionType) {
      case TransactionType.DEPOSIT:
        return `Deposit for booking ${bookingCode}`;
      case TransactionType.ROOM_CHARGE:
        return `Room charge for booking ${bookingCode}`;
      case TransactionType.SERVICE_CHARGE:
        return `Service charge for booking ${bookingCode}`;
      case TransactionType.REFUND:
        return `Refund for booking ${bookingCode}`;
      case TransactionType.ADJUSTMENT:
        return `Adjustment for booking ${bookingCode}`;
      default:
        return `Transaction for booking ${bookingCode}`;
    }
  }
}

export default TransactionService;
