import { Prisma, TransactionType } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';

/**
 * Update booking totals from all booking rooms
 */
export async function updateBookingTotals(
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
 * Get default description for transaction
 */
export function getDefaultDescription(
  transactionType: TransactionType,
  bookingCode: string
): string {
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
