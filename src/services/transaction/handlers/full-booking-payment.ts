import {
  PrismaClient,
  Prisma,
  TransactionStatus,
  BookingStatus,
  TransactionType
} from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';
import { ActivityService } from '@/services/activity.service';
import { UsageServiceService } from '@/services/usage-service.service';
import { PromotionService } from '@/services/promotion.service';
import EmailService from '@/services/email.service';
import { CreateTransactionPayload, TransactionDetailData } from '@/services/transaction/types';
import { validatePromotions } from '@/services/transaction/validators/promotion-validator';
import {
  calculateDiscounts,
  applyDiscountsToDetails
} from '@/services/transaction/calculators/discount-calculator';
import { aggregateTransactionAmounts } from '@/services/transaction/calculators/amount-aggregator';
import {
  updateBookingTotals,
  getDefaultDescription
} from '@/services/transaction/helpers/booking-updater';

/**
 * Scenario 1: Full booking payment
 * Creates Transaction (with bookingId) + TransactionDetails for all rooms and services
 */
export async function processFullBookingPayment(
  payload: CreateTransactionPayload,
  prisma: PrismaClient,
  activityService: ActivityService,
  usageServiceService: UsageServiceService,
  promotionService: PromotionService,
  emailService: EmailService
) {
  const {
    bookingId,
    paymentMethod,
    transactionType,
    description,
    employeeId,
    promotionApplications = []
  } = payload;

  if (!bookingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID is required');
  }
  const EmailConfirmationInfo = {
    bookingId: '',
    ShouldSendEmail: false
  };
  const result = await prisma.$transaction(async (tx) => {
    // STEP 1: Fetch booking with all rooms and services
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

    // STEP 2: Build transaction details
    const transactionDetails: TransactionDetailData[] = [];

    // For DEPOSIT transactions, pay depositRequired amount
    if (transactionType === TransactionType.DEPOSIT) {
      const depositRequired = new Prisma.Decimal(booking.depositRequired);

      // Distribute deposit across rooms proportionally
      const totalRoomAmount = booking.bookingRooms.reduce(
        (sum, room) => sum.add(room.subtotalRoom),
        new Prisma.Decimal(0)
      );

      for (const room of booking.bookingRooms) {
        // Calculate proportional deposit for this room
        const roomProportion = new Prisma.Decimal(room.subtotalRoom).div(totalRoomAmount);
        const roomDeposit = depositRequired.mul(roomProportion);

        transactionDetails.push({
          bookingRoomId: room.id,
          baseAmount: roomDeposit.toNumber(),
          discountAmount: 0,
          amount: roomDeposit.toNumber()
        });
      }
    } else {
      // For non-DEPOSIT transactions, pay all rooms and services
      for (const room of booking.bookingRooms) {
        transactionDetails.push({
          bookingRoomId: room.id,
          baseAmount: room.subtotalRoom.toNumber(),
          discountAmount: 0,
          amount: room.subtotalRoom.toNumber()
        });

        for (const service of room.serviceUsages) {
          transactionDetails.push({
            serviceUsageId: service.id,
            baseAmount: service.totalPrice.toNumber(),
            discountAmount: 0,
            amount: service.totalPrice.toNumber()
          });
        }
      }
    }

    // STEP 3: Validate promotions
    await validatePromotions(promotionApplications, promotionService);

    // STEP 4: Calculate discounts
    const discounts = await calculateDiscounts(
      promotionApplications,
      transactionDetails,
      promotionService,
      prisma
    );

    // STEP 5: Apply discounts to details
    const detailsWithDiscounts = applyDiscountsToDetails(transactionDetails, discounts);

    // STEP 6: Aggregate transaction amounts
    const transactionAmounts = aggregateTransactionAmounts(detailsWithDiscounts, discounts);

    // STEP 7: Create transaction
    const transaction = await tx.transaction.create({
      data: {
        bookingId,
        type: transactionType,
        baseAmount: transactionAmounts.baseAmount,
        discountAmount: transactionAmounts.discountAmount,
        amount: transactionAmounts.amount,
        method: paymentMethod,
        status: TransactionStatus.COMPLETED,
        processedById: employeeId,
        description: description || getDefaultDescription(transactionType, booking.bookingCode)
      }
    });

    // STEP 8: Create transaction details and update payments
    for (const detail of detailsWithDiscounts) {
      await tx.transactionDetail.create({
        data: {
          transactionId: transaction.id,
          bookingRoomId: detail.bookingRoomId,
          serviceUsageId: detail.serviceUsageId,
          baseAmount: detail.baseAmount,
          discountAmount: detail.discountAmount,
          amount: detail.amount
        }
      });

      // No need to update BookingRoom payment tracking

      if (detail.serviceUsageId) {
        await usageServiceService.updateServiceUsagePayment(
          detail.serviceUsageId,
          detail.amount,
          employeeId,
          tx
        );
      }
    }

    // STEP 9: Create UsedPromotion records
    for (const app of promotionApplications) {
      const discountInfo = discounts.get(app.customerPromotionId);
      if (discountInfo && discountInfo.amount > 0) {
        const detailIndex = app.bookingRoomId
          ? detailsWithDiscounts.findIndex((d) => d.bookingRoomId === app.bookingRoomId)
          : app.serviceUsageId
          ? detailsWithDiscounts.findIndex((d) => d.serviceUsageId === app.serviceUsageId)
          : 0;

        const detail = detailsWithDiscounts[detailIndex];
        if (detail) {
          const createdDetail = await tx.transactionDetail.findFirst({
            where: {
              transactionId: transaction.id,
              ...(detail.bookingRoomId && { bookingRoomId: detail.bookingRoomId }),
              ...(detail.serviceUsageId && { serviceUsageId: detail.serviceUsageId })
            }
          });

          if (createdDetail) {
            const customerPromotion = await tx.customerPromotion.findUnique({
              where: { id: app.customerPromotionId }
            });

            if (!customerPromotion) {
              continue;
            }

            await tx.usedPromotion.create({
              data: {
                promotionId: customerPromotion.promotionId,
                discountAmount: discountInfo.amount,
                transactionDetailId: createdDetail.id,
                transactionId: transaction.id
              }
            });

            await tx.customerPromotion.update({
              where: { id: app.customerPromotionId },
              data: {
                status: 'USED',
                usedAt: new Date(),
                transactionDetailId: createdDetail.id
              }
            });
          }
        }
      }
    }

    // Update booking totals
    await updateBookingTotals(bookingId, tx);

    // Apply state transition for DEPOSIT
    if (transactionType === 'DEPOSIT') {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED }
      });
      await tx.bookingRoom.updateMany({
        where: { bookingId, status: BookingStatus.PENDING },
        data: { status: BookingStatus.CONFIRMED }
      });
      console.log('Booking status changed to CONFIRMED for bookingId:', bookingId);
      EmailConfirmationInfo.ShouldSendEmail = true;
      EmailConfirmationInfo.bookingId = bookingId;
    }

    // Create activity
    await activityService.createTransactionActivity(
      transaction.id,
      employeeId,
      transactionType,
      transactionAmounts.amount,
      tx
    );

    return {
      transaction: await tx.transaction.findUnique({
        where: { id: transaction.id },
        include: { details: true, usedPromotions: true }
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

  // Send email AFTER transaction commits so the email service sees updated data
  if (EmailConfirmationInfo.ShouldSendEmail) {
    console.log(
      'Sending booking confirmation email for bookingId:',
      EmailConfirmationInfo.bookingId
    );
    emailService.sendBookingConfirmation(EmailConfirmationInfo.bookingId).catch((error) => {
      console.error('Failed to send booking confirmation email:', error);
    });
  }
  return result;
}
