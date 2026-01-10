import { PrismaClient, TransactionStatus, BookingStatus } from '@prisma/client';
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
import { updateBookingTotals } from '@/services/transaction/helpers/booking-updater';

/**
 * Scenario 2: Split room payment
 * Creates Transaction (with bookingId) + TransactionDetails for selected rooms
 */
export async function processSplitRoomPayment(
  payload: CreateTransactionPayload,
  prisma: PrismaClient,
  activityService: ActivityService,
  usageServiceService: UsageServiceService,
  promotionService: PromotionService,
  emailService: EmailService
) {
  const {
    bookingId,
    bookingRoomIds,
    paymentMethod,
    transactionType,
    description,
    employeeId,
    promotionApplications = []
  } = payload;

  if (!bookingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID is required');
  }

  if (!bookingRoomIds || bookingRoomIds.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking room IDs are required');
  }
  const EmailConfirmationInfo = {
    bookingId: '',
    ShouldSendEmail: false
  };
  const transaction = prisma.$transaction(async (tx) => {
    // STEP 1: Fetch booking and validate rooms
    const booking = await tx.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
    }

    const bookingRooms = await tx.bookingRoom.findMany({
      where: {
        id: { in: bookingRoomIds },
        bookingId
      },
      include: {
        room: true,
        serviceUsages: {
          where: { status: { not: 'CANCELLED' } }
        }
      }
    });

    if (bookingRooms.length !== bookingRoomIds.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Some booking rooms not found');
    }

    // STEP 2: Build transaction details for selected rooms ONLY
    // Services should be paid separately via SERVICE_CHARGE transactions
    const transactionDetails: TransactionDetailData[] = [];

    for (const room of bookingRooms) {
      transactionDetails.push({
        bookingRoomId: room.id,
        baseAmount: room.subtotalRoom.toNumber(),
        discountAmount: 0,
        amount: room.subtotalRoom.toNumber()
      });
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
        description:
          description ||
          `${transactionType} for ${bookingRooms.length} room(s) - ${booking.bookingCode}`
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
        where: {
          id: { in: bookingRoomIds },
          status: BookingStatus.PENDING
        },
        data: { status: BookingStatus.CONFIRMED }
      });

      // Send booking confirmation email after successful status update
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
  if (EmailConfirmationInfo.ShouldSendEmail && bookingId != '') {
    emailService.sendBookingConfirmation(EmailConfirmationInfo.bookingId).catch((error) => {
      console.error('Failed to send booking confirmation email:', error);
    });
  }
  return transaction;
}
