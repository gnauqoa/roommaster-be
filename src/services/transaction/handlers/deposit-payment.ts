import dayjs from 'dayjs';
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
import EmailService from '@/services/email.service';
import { CreateTransactionPayload, TransactionDetailData } from '@/services/transaction/types';
import {
  updateBookingTotals,
  getDefaultDescription
} from '@/services/transaction/helpers/booking-updater';
import AppSettingService from '../../app-setting.service';

/**
 * Handle Deposit Payment
 * Support both full booking deposit and specific room deposit
 */
export async function processDepositPayment(
  payload: CreateTransactionPayload,
  prisma: PrismaClient,
  activityService: ActivityService,
  emailService: EmailService,
  appSettingService: AppSettingService
) {
  const { bookingId, bookingRoomIds, paymentMethod, transactionType, description, employeeId } =
    payload;

  if (!bookingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking ID is required');
  }

  if (transactionType !== TransactionType.DEPOSIT) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid transaction type for deposit handler');
  }

  const EmailConfirmationInfo = {
    bookingId: '',
    ShouldSendEmail: false
  };

  const result = await prisma.$transaction(async (tx) => {
    // STEP 1: Fetch booking
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingRooms: {
          include: {
            room: true
          }
        }
      }
    });

    if (!booking) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
    }

    // Determine target rooms
    let targetRooms = booking.bookingRooms;
    if (bookingRoomIds && bookingRoomIds.length > 0) {
      targetRooms = booking.bookingRooms.filter((br) => bookingRoomIds.includes(br.id));
      if (targetRooms.length !== bookingRoomIds.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Some booking rooms not found');
      }
    }

    // STEP 2: Build transaction details
    const transactionDetails: TransactionDetailData[] = [];

    // Fetch deposit percentage from cached service
    const depositPercentage = await appSettingService.getDepositPercentage();

    // Helper to calculate subtotalRoom
    const getSubtotalRoom = (room: any) => {
      const nights = dayjs(room.checkOutDate).diff(dayjs(room.checkInDate), 'day');
      return new Prisma.Decimal(room.pricePerNight).mul(nights);
    };

    let totalAmount = 0;

    // Current Login: Calculate deposit based on room price (100% deposit for now as per previous logic)
    // TODO: Implement partial deposit logic based on booking.depositRequired if needed
    for (const room of targetRooms) {
      const subtotal = getSubtotalRoom(room);
      const amount = subtotal.mul(depositPercentage).div(100).toNumber();

      transactionDetails.push({
        bookingRoomId: room.id,
        baseAmount: amount,
        discountAmount: 0,
        amount: amount
      });

      totalAmount += amount;
    }

    // STEP 7: Create transaction
    const transaction = await tx.transaction.create({
      data: {
        bookingId,
        type: transactionType,
        baseAmount: totalAmount,
        discountAmount: 0,
        amount: totalAmount,
        method: paymentMethod,
        status: TransactionStatus.COMPLETED,
        processedById: employeeId,
        description: description || getDefaultDescription(transactionType, booking.bookingCode)
      }
    });

    // STEP 8: Create transaction details
    for (const detail of transactionDetails) {
      await tx.transactionDetail.create({
        data: {
          transactionId: transaction.id,
          bookingRoomId: detail.bookingRoomId,
          serviceUsageId: detail.serviceUsageId,
          baseAmount: detail.baseAmount,
          discountAmount: 0,
          amount: detail.amount
        }
      });
    }

    // Update booking totals
    await updateBookingTotals(bookingId, tx);

    // Apply state transition for DEPOSIT
    // If it's a deposit, we assume it confirms the rooms/booking
    // Logic: If all rooms in booking are covered, confirm booking?
    // Or just confirm the paid rooms?
    // Previous logic confirmed the whole booking if ANY deposit was made (in full-booking-payment).

    // Let's implement robust status update:
    // 1. Update status of PAID rooms to CONFIRMED
    const paidRoomIds = transactionDetails
      .map((d) => d.bookingRoomId)
      .filter((id) => id !== undefined) as string[];

    if (paidRoomIds.length > 0) {
      await tx.bookingRoom.updateMany({
        where: {
          id: { in: paidRoomIds },
          status: BookingStatus.PENDING
        },
        data: { status: BookingStatus.CONFIRMED }
      });
    }

    // 2. Check if all rooms are now confirmed (or checked-in/out), if so, confirm booking
    // Actually, for simplicity and backward compatibility with previous "Deposit" logic:
    // If this is a deposit, we explicitly set Booking to CONFIRMED.
    // However, if we only pay for SOME rooms, should the WHOLE booking be confirmed?
    // Maybe yes, "Deposit" implies the booking is secured.

    await tx.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED }
    });

    console.log('Booking status changed to CONFIRMED for bookingId:', bookingId);
    EmailConfirmationInfo.ShouldSendEmail = true;
    EmailConfirmationInfo.bookingId = bookingId;

    // Create activity
    await activityService.createTransactionActivity(
      transaction.id,
      employeeId,
      transactionType,
      totalAmount,
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

  // Send email AFTER transaction commits
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
