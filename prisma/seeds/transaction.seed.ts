import { PrismaClient, TransactionStatus, PaymentMethod, TransactionType } from '@prisma/client';
import { getSeededBookings } from './booking.seed';
import { getSeededEmployees } from './employee.seed';

/**
 * Seed transactions data for report testing
 * Schema fields: id, bookingId, type, baseAmount, discountAmount, amount, method, status, processedById, occurredAt, description
 * @param prisma - Prisma client instance
 */
export const seedTransactions = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding transactions...');

  const bookings = await getSeededBookings(prisma);
  const employees = await getSeededEmployees(prisma);

  if (bookings.length === 0 || employees.length === 0) {
    console.log('⚠ No bookings or employees found. Please seed them first.');
    return;
  }

  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const transactions = [
    // Recent transactions - 1 month ago
    {
      bookingId: bookings[0]?.id,
      type: TransactionType.DEPOSIT,
      baseAmount: 5000000,
      discountAmount: 0,
      amount: 5000000,
      method: PaymentMethod.CASH,
      status: TransactionStatus.COMPLETED,
      processedById: employees[0]?.id,
      occurredAt: oneMonthAgo,
      description: 'Deposit for booking'
    },
    {
      bookingId: bookings[0]?.id,
      type: TransactionType.ROOM_CHARGE,
      baseAmount: 5500000,
      discountAmount: 500000,
      amount: 5000000,
      method: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      processedById: employees[0]?.id,
      occurredAt: new Date(oneMonthAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
      description: 'Final room payment with discount'
    },
    // Historical transactions - 2 months ago
    {
      bookingId: bookings[1]?.id,
      type: TransactionType.DEPOSIT,
      baseAmount: 3000000,
      discountAmount: 0,
      amount: 3000000,
      method: PaymentMethod.BANK_TRANSFER,
      status: TransactionStatus.COMPLETED,
      processedById: employees[1]?.id,
      occurredAt: twoMonthsAgo,
      description: 'Bank transfer deposit'
    },
    {
      bookingId: bookings[1]?.id,
      type: TransactionType.ROOM_CHARGE,
      baseAmount: 3500000,
      discountAmount: 0,
      amount: 3500000,
      method: PaymentMethod.E_WALLET,
      status: TransactionStatus.COMPLETED,
      processedById: employees[1]?.id,
      occurredAt: new Date(twoMonthsAgo.getTime() + 5 * 24 * 60 * 60 * 1000),
      description: 'E-wallet payment'
    },
    // Historical transactions - 3 months ago
    {
      bookingId: bookings[2]?.id,
      type: TransactionType.DEPOSIT,
      baseAmount: 4000000,
      discountAmount: 0,
      amount: 4000000,
      method: PaymentMethod.CASH,
      status: TransactionStatus.COMPLETED,
      processedById: employees[0]?.id,
      occurredAt: threeMonthsAgo,
      description: 'Cash deposit'
    },
    {
      bookingId: bookings[2]?.id,
      type: TransactionType.ROOM_CHARGE,
      baseAmount: 5000000,
      discountAmount: 500000,
      amount: 4500000,
      method: PaymentMethod.CASH,
      status: TransactionStatus.COMPLETED,
      processedById: employees[0]?.id,
      occurredAt: new Date(threeMonthsAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
      description: 'Final payment with discount'
    },
    // Service charges
    {
      bookingId: bookings[0]?.id,
      type: TransactionType.SERVICE_CHARGE,
      baseAmount: 500000,
      discountAmount: 0,
      amount: 500000,
      method: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.COMPLETED,
      processedById: employees[1]?.id,
      occurredAt: new Date(oneMonthAgo.getTime() + 1 * 24 * 60 * 60 * 1000),
      description: 'Service charges'
    },
    {
      bookingId: bookings[1]?.id,
      type: TransactionType.SERVICE_CHARGE,
      baseAmount: 300000,
      discountAmount: 0,
      amount: 300000,
      method: PaymentMethod.E_WALLET,
      status: TransactionStatus.COMPLETED,
      processedById: employees[1]?.id,
      occurredAt: new Date(twoMonthsAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
      description: 'Additional service charges'
    },
    // Failed transaction
    {
      bookingId: bookings[2]?.id,
      type: TransactionType.DEPOSIT,
      baseAmount: 1000000,
      discountAmount: 0,
      amount: 1000000,
      method: PaymentMethod.CREDIT_CARD,
      status: TransactionStatus.FAILED,
      processedById: employees[0]?.id,
      occurredAt: new Date(threeMonthsAgo.getTime() - 1 * 24 * 60 * 60 * 1000),
      description: 'Failed credit card payment'
    },
    // Refund transaction
    {
      bookingId: bookings[2]?.id,
      type: TransactionType.REFUND,
      baseAmount: 500000,
      discountAmount: 0,
      amount: 500000,
      method: PaymentMethod.BANK_TRANSFER,
      status: TransactionStatus.COMPLETED,
      processedById: employees[0]?.id,
      occurredAt: new Date(threeMonthsAgo.getTime() + 10 * 24 * 60 * 60 * 1000),
      description: 'Refund for service cancellation'
    }
  ];

  // Check if transactions already exist for these bookings
  const existingTxns = await prisma.transaction.findMany({
    where: {
      bookingId: {
        in: bookings.slice(0, 3).map((b) => b.id)
      }
    }
  });

  if (existingTxns.length > 0) {
    console.log(`  Found ${existingTxns.length} existing transactions, skipping...`);
    return;
  }

  for (const txn of transactions) {
    await prisma.transaction.create({
      data: txn
    });
  }

  console.log(`✓ Created ${transactions.length} transactions`);
};

/**
 * Get seeded transactions for use in other seeds
 */
export const getSeededTransactions = async (prisma: PrismaClient) => {
  return prisma.transaction.findMany({
    take: 20,
    orderBy: { occurredAt: 'desc' }
  });
};
