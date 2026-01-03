import {
  TransactionDetailData,
  TransactionAmounts,
  DiscountInfo
} from '@/services/transaction/types';

/**
 * Aggregate transaction amounts from details
 */
export function aggregateTransactionAmounts(
  details: TransactionDetailData[],
  discounts: Map<string, DiscountInfo>
): TransactionAmounts {
  // Sum all detail baseAmounts
  const baseAmount = details.reduce((sum, d) => sum + d.baseAmount, 0);

  // Sum all detail discounts
  const detailDiscounts = details.reduce((sum, d) => sum + d.discountAmount, 0);

  // Add transaction-level discounts (promotions without specific target)
  const transactionDiscounts = Array.from(discounts.values())
    .filter((d) => !d.target.bookingRoomId && !d.target.serviceUsageId)
    .reduce((sum, d) => sum + d.amount, 0);

  const totalDiscount = detailDiscounts + transactionDiscounts;

  return {
    baseAmount,
    discountAmount: totalDiscount,
    amount: baseAmount - totalDiscount
  };
}
