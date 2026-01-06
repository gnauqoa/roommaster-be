/**
 * Interactive Booking Flow Test (Jest Version)
 *
 * This test provides detailed logging at each step of the booking flow.
 * Use with test:watch for interactive development.
 *
 * Run with: yarn test:watch --testNamePattern="Interactive"
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import { container, TOKENS } from '@/core/container';
import { bootstrap } from '@/core/bootstrap';
import { BookingService } from '@/services/booking.service';
import { TransactionService } from '@/services/transaction';
import { UsageServiceService } from '@/services/usage-service.service';

const prisma = new PrismaClient();

// Helper to log step info
function logStep(step: string, message: string, data?: any) {
  console.log(`\n[${step}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logSuccess(step: string, message: string) {
  console.log(`\n✅ [${step}] ${message}`);
}

describe('Interactive Booking Flow Test', () => {
  let bookingService: BookingService;
  let transactionService: TransactionService;
  let usageServiceService: UsageServiceService;

  let employeeId: string;
  let customerId: string;
  let bookingId: string;
  let bookingRoomIds: string[] = [];
  let serviceUsageId: string;
  let roomTypeIds: string[] = [];
  let serviceId: string;

  beforeAll(async () => {
    console.log('\n' + '='.repeat(60));
    console.log('INTERACTIVE BOOKING FLOW TEST');
    console.log('='.repeat(60));

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
    logStep('SETUP', 'Setting up test data...');

    // Get employee (created by seed)
    const employee = await prisma.employee.findFirst({
      where: { username: 'test-admin' }
    });

    if (!employee) {
      throw new Error('Employee not found. Database may not be seeded.');
    }
    employeeId = employee.id;

    // Get customer (created by seed)
    const customer = await prisma.customer.findFirst({
      where: { phone: '0987654321' }
    });

    if (!customer) {
      throw new Error('Customer not found. Database may not be seeded.');
    }
    customerId = customer.id;

    // Get room types
    const roomTypes = await prisma.roomType.findMany({
      take: 2,
      include: {
        rooms: {
          where: { status: 'AVAILABLE' },
          take: 5
        }
      }
    });

    if (roomTypes.length === 0 || roomTypes[0].rooms.length < 2) {
      throw new Error(
        `Not enough available rooms found. Need at least 2 rooms per type.\n` +
          `Found: ${roomTypes.map((rt) => `${rt.name}: ${rt.rooms.length} rooms`).join(', ')}`
      );
    }

    roomTypeIds = roomTypes.map((rt) => rt.id);

    // Get a service
    const service = await prisma.service.findFirst({
      where: { isActive: true }
    });

    if (!service) {
      throw new Error('No active services found. Please seed the database first.');
    }

    serviceId = service.id;
    logSuccess('SETUP', 'Test data ready');
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

  it('should complete full booking flow with detailed logging', async () => {
    // ==================== STEP 1: Create Booking ====================
    logStep('STEP 1', 'Creating booking for 3 rooms (2 nights)...');

    const checkInDate = dayjs().add(1, 'day').startOf('day').toDate();
    const checkOutDate = dayjs().add(3, 'day').startOf('day').toDate();

    const bookingData = {
      customerId,
      rooms: [
        { roomTypeId: roomTypeIds[0], count: 2 },
        { roomTypeId: roomTypeIds[1] || roomTypeIds[0], count: 1 }
      ],
      checkInDate: checkInDate.toISOString(),
      checkOutDate: checkOutDate.toISOString(),
      totalGuests: 5
    };

    const booking = await bookingService.createBooking(bookingData);
    bookingId = booking.bookingId;

    logSuccess('STEP 1', `Booking created: ${booking.bookingCode}`);

    const bookingDetails = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingRooms: true }
    });

    bookingRoomIds = bookingDetails!.bookingRooms.map((br) => br.id);

    logStep('STEP 1', 'Booking Details:', {
      bookingId,
      bookingCode: booking.bookingCode,
      status: bookingDetails!.status,
      totalAmount: Number(bookingDetails!.totalAmount),
      depositRequired: Number(bookingDetails!.depositRequired),
      balance: Number(bookingDetails!.balance),
      totalPaid: Number(bookingDetails!.totalPaid),
      rooms: bookingRoomIds.length,
      checkInDate: checkInDate.toISOString(),
      checkOutDate: checkOutDate.toISOString()
    });

    expect(booking).toHaveProperty('bookingId');
    expect(booking).toHaveProperty('bookingCode');

    // ==================== STEP 2: Make Deposit Payment ====================
    logStep('STEP 2', 'Making deposit payment...');

    const depositPayload = {
      bookingId,
      paymentMethod: 'CASH' as const,
      transactionType: 'DEPOSIT' as const,
      description: 'Deposit payment',
      employeeId
    };

    const depositResult = await transactionService.createTransaction(depositPayload);

    if ('transaction' in depositResult && depositResult.transaction) {
      logSuccess('STEP 2', `Deposit paid: ${depositResult.transaction.amount} VND`);

      const updatedBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { status: true, balance: true, totalPaid: true, depositRequired: true }
      });

      logStep('STEP 2', 'Booking Status After Deposit:', {
        status: updatedBooking!.status,
        depositRequired: Number(updatedBooking!.depositRequired),
        totalPaid: Number(updatedBooking!.totalPaid),
        balance: Number(updatedBooking!.balance)
      });

      expect(depositResult.transaction.status).toBe('COMPLETED');
    }

    // ==================== STEP 3: Check-in Rooms ====================
    logStep('STEP 3', 'Checking in all rooms...');

    const checkInData = {
      checkInInfo: bookingRoomIds.map((brId) => ({
        bookingRoomId: brId,
        customerIds: [customerId]
      })),
      employeeId
    };

    await bookingService.checkIn(checkInData);

    const checkedInBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingRooms: true }
    });

    logSuccess('STEP 3', `Checked in ${bookingRoomIds.length} rooms`);
    logStep('STEP 3', 'Booking Status After Check-in:', {
      status: checkedInBooking!.status,
      roomStatuses: checkedInBooking!.bookingRooms.map((br) => ({
        roomId: br.roomId,
        status: br.status
      }))
    });

    expect(checkedInBooking!.status).toBe('CHECKED_IN');

    // ==================== STEP 4: Create Service Usage ====================
    logStep('STEP 4', 'Creating service usage...');

    const serviceUsageData = {
      bookingId,
      bookingRoomId: bookingRoomIds[0],
      serviceId,
      quantity: 2,
      employeeId
    };

    const serviceUsage = await usageServiceService.createServiceUsage(serviceUsageData);
    serviceUsageId = serviceUsage.id;

    const serviceDetails = await prisma.serviceUsage.findUnique({
      where: { id: serviceUsageId },
      include: { service: true }
    });

    logSuccess('STEP 4', `Service usage created: ${serviceUsage.quantity} units`);
    logStep('STEP 4', 'Service Usage Details:', {
      serviceUsageId,
      serviceName: serviceDetails!.service.name,
      quantity: serviceDetails!.quantity,
      unitPrice: Number(serviceDetails!.service.price),
      totalPrice: Number(serviceDetails!.totalPrice),
      totalPaid: Number(serviceDetails!.totalPaid),
      status: serviceDetails!.status
    });

    expect(serviceUsage.quantity).toBe(2);

    // ==================== STEP 5: Partial Payment ====================
    logStep('STEP 5', 'Making partial payment for first 2 rooms...');

    const partialPaymentPayload = {
      bookingId,
      bookingRoomIds: bookingRoomIds.slice(0, 2),
      paymentMethod: 'CREDIT_CARD' as const,
      transactionType: 'ROOM_CHARGE' as const,
      description: 'Partial payment for 2 rooms',
      employeeId
    };

    const partialPayment = await transactionService.createTransaction(partialPaymentPayload);

    if ('transaction' in partialPayment && partialPayment.transaction) {
      logSuccess('STEP 5', `Partial payment: ${partialPayment.transaction.amount} VND`);

      const updatedBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          bookingRooms: true,
          serviceUsages: true
        }
      });

      logStep('STEP 5', 'Booking Status After Partial Payment:', {
        totalPaid: Number(updatedBooking!.totalPaid),
        balance: Number(updatedBooking!.balance),
        paidRooms: updatedBooking!.bookingRooms.filter((br) => Number(br.balance) === 0).length,
        unpaidRooms: updatedBooking!.bookingRooms.filter((br) => Number(br.balance) > 0).length,
        servicesPaid: updatedBooking!.serviceUsages.filter((su) => su.status === 'COMPLETED')
          .length,
        servicesUnpaid: updatedBooking!.serviceUsages.filter((su) => su.status !== 'COMPLETED')
          .length
      });

      expect(partialPayment.transaction.status).toBe('COMPLETED');
    }

    // ==================== STEP 6: Pay Service ====================
    // Check if service is already paid
    const serviceCheck = await prisma.serviceUsage.findUnique({
      where: { id: serviceUsageId },
      select: { status: true, totalPrice: true, totalPaid: true }
    });

    if (serviceCheck!.status === 'COMPLETED') {
      logStep('STEP 6', '⏭️  Service already paid, skipping...');
      logStep('STEP 6', 'Service Status:', {
        status: serviceCheck!.status,
        totalPrice: Number(serviceCheck!.totalPrice),
        totalPaid: Number(serviceCheck!.totalPaid)
      });
    } else {
      logStep('STEP 6', 'Paying for service...');

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
        logSuccess('STEP 6', `Service paid: ${servicePayment.transaction.amount} VND`);

        const updatedService = await prisma.serviceUsage.findUnique({
          where: { id: serviceUsageId },
          select: { status: true, totalPaid: true, totalPrice: true }
        });

        logStep('STEP 6', 'Service Status After Payment:', {
          status: updatedService!.status,
          totalPrice: Number(updatedService!.totalPrice),
          totalPaid: Number(updatedService!.totalPaid)
        });

        expect(servicePayment.transaction.status).toBe('COMPLETED');
      }
    }

    // ==================== STEP 7: Full Payment ====================
    logStep('STEP 7', 'Making full payment...');

    const fullPaymentPayload = {
      bookingId,
      paymentMethod: 'BANK_TRANSFER' as const,
      transactionType: 'ROOM_CHARGE' as const,
      description: 'Final payment',
      employeeId
    };

    const fullPayment = await transactionService.createTransaction(fullPaymentPayload);

    if ('transaction' in fullPayment && fullPayment.transaction) {
      logSuccess('STEP 7', `Full payment: ${fullPayment.transaction.amount} VND`);

      const finalBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { balance: true, totalPaid: true, totalAmount: true }
      });

      logStep('STEP 7', 'Final Booking Status:', {
        totalAmount: Number(finalBooking!.totalAmount),
        totalPaid: Number(finalBooking!.totalPaid),
        balance: Number(finalBooking!.balance),
        fullyPaid: Number(finalBooking!.balance) === 0
      });

      expect(fullPayment.transaction.status).toBe('COMPLETED');
      expect(Number(finalBooking!.balance)).toBe(0);
    }

    // ==================== STEP 8: Check-out ====================
    logStep('STEP 8', 'Checking out all rooms...');

    const checkOutData = {
      bookingRoomIds,
      employeeId
    };

    await bookingService.checkOut(checkOutData);

    const checkedOutBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingRooms: true }
    });

    logSuccess('STEP 8', `Checked out ${bookingRoomIds.length} rooms`);
    logStep('STEP 8', 'Final Booking Status:', {
      status: checkedOutBooking!.status,
      roomStatuses: checkedOutBooking!.bookingRooms.map((br) => ({
        roomId: br.roomId,
        status: br.status
      }))
    });

    expect(checkedOutBooking!.status).toBe('CHECKED_OUT');

    // ==================== FINAL SUMMARY ====================
    console.log('\n' + '='.repeat(60));
    console.log('FINAL SUMMARY');
    console.log('='.repeat(60));

    const finalBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingRooms: true,
        transactions: true,
        serviceUsages: true
      }
    });

    console.log(`\nBooking Code: ${finalBooking!.bookingCode}`);
    console.log(`Status: ${finalBooking!.status}`);
    console.log(`Total Amount: ${finalBooking!.totalAmount} VND`);
    console.log(`Total Paid: ${finalBooking!.totalPaid} VND`);
    console.log(`Balance: ${finalBooking!.balance} VND`);
    console.log(`Rooms: ${finalBooking!.bookingRooms.length}`);
    console.log(`Services: ${finalBooking!.serviceUsages.length}`);
    console.log(`Transactions: ${finalBooking!.transactions.length}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETED');
    console.log('='.repeat(60) + '\n');
  }, 60000); // 60 second timeout
});
