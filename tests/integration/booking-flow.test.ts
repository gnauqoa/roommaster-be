/**
 * Full Booking Flow Integration Test
 *
 * This test validates the complete booking workflow from creation to checkout.
 * It tests the actual API endpoints and database interactions.
 *
 * Run with: yarn test tests/integration/booking-flow.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import { container, TOKENS } from '@/core/container';
import { bootstrap } from '@/core/bootstrap';
import { BookingService } from '@/services/booking.service';
import { TransactionService } from '@/services/transaction';
import { UsageServiceService } from '@/services/usage-service.service';
import { encryptPassword } from '@/utils/encryption';

const prisma = new PrismaClient();

describe('Full Booking Flow Integration Test', () => {
  let bookingService: BookingService;
  let transactionService: TransactionService;
  let usageServiceService: UsageServiceService;

  let employeeId: string;
  let customerId: string;
  let bookingId: string;
  let bookingRoomIds: string[] = [];
  let serviceUsageId: string;
  let availableRoomIds: string[] = [];
  let serviceId: string;

  beforeAll(async () => {
    // Bootstrap the DI container
    await bootstrap();

    // Initialize services from container
    bookingService = container.resolve<BookingService>(TOKENS.BookingService);
    transactionService = container.resolve<TransactionService>(TOKENS.TransactionService);
    usageServiceService = container.resolve<UsageServiceService>(TOKENS.UsageServiceService);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await prisma.$disconnect();
  });

  async function setupTestData() {
    // Create or get employee
    const employee = await prisma.employee.findFirst({
      where: { username: 'test-admin' }
    });

    if (employee) {
      employeeId = employee.id;
    } else {
      const newEmployee = await prisma.employee.create({
        data: {
          name: 'Test Admin',
          username: 'test-admin',
          password: await encryptPassword('password123'),
          role: 'ADMIN'
        }
      });
      employeeId = newEmployee.id;
    }

    // Create or get customer
    const customer = await prisma.customer.findFirst({
      where: { phone: '0987654321' }
    });

    if (customer) {
      customerId = customer.id;
    } else {
      const newCustomer = await prisma.customer.create({
        data: {
          fullName: 'Test Customer',
          phone: '0987654321',
          email: 'test@example.com',
          password: await encryptPassword('password123')
        }
      });
      customerId = newCustomer.id;
    }

    // Get room types
    const roomTypes = await prisma.roomType.findMany({
      take: 2,
      include: {
        rooms: {
          where: { status: 'AVAILABLE' },
          take: 3
        }
      }
    });

    if (roomTypes.length === 0 || roomTypes[0].rooms.length === 0) {
      throw new Error('No available rooms found. Please seed the database first.');
    }

    // Store available room IDs for booking
    availableRoomIds = roomTypes.flatMap((rt) => rt.rooms.map((r) => r.id));

    // Get a service
    const service = await prisma.service.findFirst({
      where: { isActive: true }
    });

    if (!service) {
      throw new Error('No active services found. Please seed the database first.');
    }

    serviceId = service.id;
  }

  async function cleanupTestData() {
    // Delete test booking and related data if created
    if (bookingId) {
      await prisma.booking
        .delete({
          where: { id: bookingId }
        })
        .catch(() => {
          // Ignore if already deleted
        });
    }
  }

  it('should complete full booking flow successfully', async () => {
    // ==================== STEP 1: Create Booking ====================
    const checkInDate = dayjs().add(1, 'day').startOf('day').toDate();
    const checkOutDate = dayjs().add(3, 'day').startOf('day').toDate();

    // Use first 3 available rooms for the booking
    const roomsToBook = availableRoomIds.slice(0, 3);
    if (roomsToBook.length < 3) {
      throw new Error('Need at least 3 available rooms for this test');
    }

    const bookingData = {
      customerId,
      rooms: roomsToBook.map((roomId) => ({ roomId })),
      checkInDate: checkInDate.toISOString(),
      checkOutDate: checkOutDate.toISOString(),
      totalGuests: 5
    };

    const booking = await bookingService.createBooking(bookingData);
    bookingId = booking.bookingId;

    expect(booking).toHaveProperty('bookingId');
    expect(booking).toHaveProperty('bookingCode');
    expect(Number(booking.totalAmount)).toBeGreaterThan(0);

    console.log(`✅ Booking created: ${booking.bookingCode}`);

    // Get booking rooms
    const bookingDetails = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingRooms: true }
    });

    expect(bookingDetails).toBeDefined();
    if (!bookingDetails) throw new Error('Booking details not found');
    bookingRoomIds = bookingDetails.bookingRooms.map((br) => br.id);
    expect(bookingRoomIds).toHaveLength(3);

    // ==================== STEP 2: Make Deposit Payment ====================
    const depositPayload = {
      bookingId,
      paymentMethod: 'CASH' as const,
      transactionType: 'DEPOSIT' as const,
      description: 'Deposit payment',
      employeeId
    };

    const depositResult = await transactionService.createTransaction(depositPayload);

    // Type guard: booking payments return { transaction, booking }
    if ('transaction' in depositResult && depositResult.transaction) {
      expect(depositResult.transaction).toHaveProperty('id');
      expect(depositResult.transaction.status).toBe('COMPLETED');
      expect(Number(depositResult.transaction.amount)).toBeGreaterThan(0);

      console.log(`✅ Deposit paid: ${depositResult.transaction.amount} VND`);
    } else {
      throw new Error('Expected transaction in result');
    }

    // Verify booking status changed to CONFIRMED
    const confirmedBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingRooms: true }
    });

    expect(confirmedBooking).toBeDefined();
    expect(confirmedBooking?.status).toBe('CONFIRMED');
    expect(confirmedBooking?.bookingRooms[0].status).toBe('CONFIRMED');

    // ==================== STEP 3: Check-in Rooms ====================
    const checkInData = {
      checkInInfo: bookingRoomIds.map((brId) => ({
        bookingRoomId: brId,
        customerIds: [customerId]
      })),
      employeeId
    };

    const checkInResult = await bookingService.checkIn(checkInData);

    // Verify check-in by fetching booking
    const checkedInBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingRooms: true }
    });

    expect(checkedInBooking).toBeDefined();
    expect(checkedInBooking?.status).toBe('CHECKED_IN');
    expect(checkInResult.bookingRooms.every((br: any) => br.status === 'CHECKED_IN')).toBe(true);

    console.log(`✅ Checked in ${bookingRoomIds.length} rooms`);

    // ==================== STEP 4: Create Service Usage ====================
    const serviceUsageData = {
      bookingId,
      bookingRoomId: bookingRoomIds[0],
      serviceId,
      quantity: 2,
      employeeId
    };

    const serviceUsage = await usageServiceService.createServiceUsage(serviceUsageData);
    serviceUsageId = serviceUsage.id;

    expect(serviceUsage).toHaveProperty('id');
    expect(serviceUsage.quantity).toBe(2);
    expect(Number(serviceUsage.totalPrice)).toBeGreaterThan(0);

    console.log(`✅ Service usage created: ${serviceUsage.quantity} units`);

    // ==================== STEP 5: Partial Payment (Room 3) ====================
    // Note: Rooms 1 & 2 are already fully paid by deposit
    // Room 3 has remaining balance
    const partialPaymentPayload = {
      bookingId,
      bookingRoomIds: [bookingRoomIds[2]], // Pay room 3
      paymentMethod: 'CREDIT_CARD' as const,
      transactionType: 'ROOM_CHARGE' as const,
      description: 'Partial payment for room 3',
      employeeId
    };

    const partialPayment = await transactionService.createTransaction(partialPaymentPayload);

    if ('transaction' in partialPayment && partialPayment.transaction) {
      expect(partialPayment.transaction).toHaveProperty('id');
      expect(partialPayment.transaction.status).toBe('COMPLETED');
      expect(Number(partialPayment.transaction.amount)).toBeGreaterThan(0);

      console.log(`✅ Partial payment: ${partialPayment.transaction.amount} VND`);
    } else {
      throw new Error('Expected transaction in result');
    }

    // Verify room 3 is now fully paid, rooms 1 & 2 were already paid by deposit
    const bookingAfterPartial = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingRooms: true }
    });

    expect(bookingAfterPartial).toBeDefined();
    const room1Balance = Number(bookingAfterPartial?.bookingRooms[0].balance);
    const room2Balance = Number(bookingAfterPartial?.bookingRooms[1].balance);
    const room3Balance = Number(bookingAfterPartial?.bookingRooms[2].balance);

    expect(room1Balance).toBe(0); // Already paid by deposit
    expect(room2Balance).toBe(0); // Already paid by deposit
    expect(room3Balance).toBe(0); // Now fully paid

    // ==================== STEP 6: Pay Service ====================
    const servicePaymentPayload = {
      bookingId,
      serviceUsageId,
      paymentMethod: 'CASH' as const,
      transactionType: 'SERVICE_CHARGE' as const,
      description: 'Service payment',
      employeeId
    };

    const servicePayment = await transactionService.createTransaction(servicePaymentPayload);

    if ('transaction' in servicePayment && servicePayment.transaction) {
      expect(servicePayment.transaction).toHaveProperty('id');
      expect(servicePayment.transaction.status).toBe('COMPLETED');

      console.log(`✅ Service paid: ${servicePayment.transaction.amount} VND`);
    } else {
      throw new Error('Expected transaction in result');
    }

    // Verify service is paid
    const paidService = await prisma.serviceUsage.findUnique({
      where: { id: serviceUsageId }
    });

    expect(paidService).toBeDefined();
    expect(Number(paidService?.totalPaid)).toBe(Number(paidService?.totalPrice));

    // ==================== STEP 7: Full Payment (Services Only) ====================
    // All rooms are now paid (rooms 1 & 2 by deposit, room 3 by partial payment)
    // This payment should only cover any remaining service charges
    const fullPaymentPayload = {
      bookingId,
      paymentMethod: 'BANK_TRANSFER' as const,
      transactionType: 'ROOM_CHARGE' as const,
      description: 'Final payment',
      employeeId
    };

    const fullPayment = await transactionService.createTransaction(fullPaymentPayload);

    if ('transaction' in fullPayment && fullPayment.transaction) {
      expect(fullPayment.transaction).toHaveProperty('id');
      expect(fullPayment.transaction.status).toBe('COMPLETED');

      console.log(`✅ Full payment: ${fullPayment.transaction.amount} VND`);
    } else {
      throw new Error('Expected transaction in result');
    }

    // Verify all balances are zero
    const bookingAfterFull = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingRooms: true, serviceUsages: true }
    });

    expect(bookingAfterFull).toBeDefined();
    expect(Number(bookingAfterFull?.balance)).toBe(0);
    expect(bookingAfterFull?.bookingRooms.every((br) => Number(br.balance) === 0)).toBe(true);
    expect(
      bookingAfterFull?.serviceUsages.every((su) => Number(su.totalPrice) === Number(su.totalPaid))
    ).toBe(true);

    // ==================== STEP 8: Check-out All Rooms ====================
    const checkOutData = {
      bookingRoomIds,
      employeeId
    };

    const checkOutResult = await bookingService.checkOut(checkOutData);

    // Verify check-out by fetching booking
    const checkedOutBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingRooms: true }
    });

    expect(checkedOutBooking).toBeDefined();
    expect(checkedOutBooking?.status).toBe('CHECKED_OUT');
    expect(checkOutResult.bookingRooms.every((br: any) => br.status === 'CHECKED_OUT')).toBe(true);

    console.log(`✅ Checked out ${bookingRoomIds.length} rooms`);

    // ==================== FINAL VERIFICATION ====================
    const finalBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingRooms: true,
        transactions: true,
        serviceUsages: true
      }
    });

    expect(finalBooking).toBeDefined();
    expect(finalBooking?.status).toBe('CHECKED_OUT');
    expect(Number(finalBooking?.balance)).toBe(0);
    expect(Number(finalBooking?.totalPaid)).toBe(Number(finalBooking?.totalAmount));
    expect(finalBooking?.transactions.length).toBeGreaterThanOrEqual(4);

    console.log('\n✅ Full booking flow completed successfully!');
    console.log(`   Booking: ${finalBooking?.bookingCode}`);
    console.log(`   Total Amount: ${finalBooking?.totalAmount} VND`);
    console.log(`   Total Paid: ${finalBooking?.totalPaid} VND`);
    console.log(`   Transactions: ${finalBooking?.transactions.length}`);
  }, 60000); // 60 second timeout for the full flow
});
