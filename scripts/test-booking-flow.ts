/**
 * Full Booking Flow Integration Test Script
 *
 * This script tests the complete booking workflow:
 * 1. Employee login
 * 2. Create booking (multiple rooms)
 * 3. Make deposit payment
 * 4. Check-in rooms
 * 5. Create service usage
 * 6. Partial payment (some rooms)
 * 7. Full payment and checkout
 *
 * Run with: ts-node scripts/test-booking-flow.ts
 */

import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

// Test configuration
const BASE_URL = process.env.API_URL || 'http://localhost:8080/v1';
const EMPLOYEE_USERNAME = 'admin';
const EMPLOYEE_PASSWORD = 'password123';

// Helper function to make API requests
async function apiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  token?: string
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(`API Error: ${responseData.message || response.statusText}`);
  }

  return responseData;
}

// Logging helpers
function log(step: string, message: string, data?: any) {
  console.log(`\n[${step}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logSuccess(step: string, message: string) {
  console.log(`\n✅ [${step}] ${message}`);
}

function logError(step: string, error: any) {
  console.error(`\n❌ [${step}] Error:`, error.message || error);
}

async function runBookingFlowTest() {
  let employeeToken: string;
  let customerId: string;
  let bookingId: string;
  let bookingRoomIds: string[] = [];
  let serviceUsageId: string;

  try {
    // ==================== STEP 1: Employee Login ====================
    log('STEP 1', 'Employee login...');
    const loginResponse = await apiRequest('/employee/auth/login', 'POST', {
      username: EMPLOYEE_USERNAME,
      password: EMPLOYEE_PASSWORD
    });

    employeeToken = loginResponse.data.tokens.access.token;
    const employeeId = loginResponse.data.employee.id;
    logSuccess('STEP 1', `Logged in as ${loginResponse.data.employee.name}`);

    // ==================== STEP 2: Get or Create Customer ====================
    log('STEP 2', 'Getting/creating customer...');

    // Try to find existing customer
    let customer = await prisma.customer.findFirst({
      where: { phone: '0987654321' }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          fullName: 'Nguyễn Văn Test',
          phone: '0987654321',
          email: 'test@example.com',
          idNumber: '123456789',
          address: '123 Test Street',
          password: 'hashedpassword'
        }
      });
    }

    customerId = customer.id;
    logSuccess('STEP 2', `Customer ready: ${customer.fullName} (${customer.phone})`);

    // ==================== STEP 3: Get Available Room Types ====================
    log('STEP 3', 'Getting available room types...');

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

    logSuccess('STEP 3', `Found ${roomTypes.length} room types with available rooms`);

    // ==================== STEP 4: Create Booking ====================
    log('STEP 4', 'Creating booking for 3 rooms (2 nights)...');

    const checkInDate = dayjs().add(1, 'day').startOf('day').toISOString();
    const checkOutDate = dayjs().add(3, 'day').startOf('day').toISOString();

    const bookingResponse = await apiRequest(
      '/employee/bookings',
      'POST',
      {
        customerId,
        rooms: [
          { roomId: roomTypes[0].rooms[0].id },
          { roomId: roomTypes[0].rooms[1].id },
          { roomId: roomTypes[1]?.rooms[0]?.id || roomTypes[0].rooms[2].id }
        ],
        checkInDate,
        checkOutDate,
        totalGuests: 5
      },
      employeeToken
    );

    bookingId = bookingResponse.data.bookingId;
    const bookingCode = bookingResponse.data.bookingCode;
    const totalAmount = bookingResponse.data.totalAmount;
    const depositRequired = bookingResponse.data.depositRequired;

    logSuccess('STEP 4', `Booking created: ${bookingCode}`);
    log('STEP 4', 'Booking details:', {
      bookingId,
      totalAmount,
      depositRequired,
      checkInDate,
      checkOutDate
    });

    // Get booking rooms
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingRooms: { include: { room: true } } }
    });

    bookingRoomIds = booking!.bookingRooms.map((br) => br.id);
    log(
      'STEP 4',
      `Booking has ${bookingRoomIds.length} rooms`,
      booking!.bookingRooms.map((br) => br.room.roomNumber)
    );

    // ==================== STEP 5: Make Deposit Payment ====================
    log('STEP 5', 'Making deposit payment...');

    const depositResponse = await apiRequest(
      '/employee/transactions',
      'POST',
      {
        bookingId,
        paymentMethod: 'CASH',
        transactionType: 'DEPOSIT',
        description: 'Deposit payment for booking'
      },
      employeeToken
    );

    logSuccess('STEP 5', `Deposit paid: ${depositResponse.data.transaction.amount} VND`);
    log('STEP 5', 'Transaction details:', {
      transactionId: depositResponse.data.transaction.id,
      amount: depositResponse.data.transaction.amount,
      status: depositResponse.data.transaction.status
    });

    // Verify booking status changed to CONFIRMED
    const confirmedBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingRooms: true }
    });

    log('STEP 5', `Booking status: ${confirmedBooking!.status}`);
    log('STEP 5', `Booking rooms status: ${confirmedBooking!.bookingRooms[0].status}`);

    // ==================== STEP 6: Check-in Rooms ====================
    log('STEP 6', 'Checking in all rooms...');

    const checkInResponse = await apiRequest(
      '/employee/bookings/check-in',
      'POST',
      {
        checkInInfo: bookingRoomIds.map((brId) => ({
          bookingRoomId: brId,
          customerIds: [customerId]
        }))
      },
      employeeToken
    );

    logSuccess('STEP 6', `Checked in ${bookingRoomIds.length} rooms`);
    log('STEP 6', 'Check-in details:', {
      bookingStatus: checkInResponse.data.booking.status,
      checkedInRooms: checkInResponse.data.booking.bookingRooms.filter(
        (br: any) => br.status === 'CHECKED_IN'
      ).length
    });

    // ==================== STEP 7: Create Service Usage ====================
    log('STEP 7', 'Creating service usage for first room...');

    // Get a service
    const service = await prisma.service.findFirst({
      where: { isActive: true }
    });

    if (!service) {
      throw new Error('No active services found. Please seed the database first.');
    }

    const serviceResponse = await apiRequest(
      '/employee/service-usages',
      'POST',
      {
        bookingId,
        bookingRoomId: bookingRoomIds[0],
        serviceId: service.id,
        quantity: 2
      },
      employeeToken
    );

    serviceUsageId = serviceResponse.data.id;
    logSuccess('STEP 7', `Service usage created: ${service.name} x2`);
    log('STEP 7', 'Service details:', {
      serviceUsageId,
      serviceName: service.name,
      quantity: 2,
      totalPrice: serviceResponse.data.totalPrice
    });

    // ==================== STEP 8: Partial Payment (First 2 Rooms) ====================
    log('STEP 8', 'Making partial payment for first 2 rooms...');

    const partialPaymentResponse = await apiRequest(
      '/employee/transactions',
      'POST',
      {
        bookingId,
        bookingRoomIds: bookingRoomIds.slice(0, 2), // First 2 rooms
        paymentMethod: 'CREDIT_CARD',
        transactionType: 'ROOM_CHARGE',
        description: 'Partial payment for 2 rooms'
      },
      employeeToken
    );

    logSuccess(
      'STEP 8',
      `Partial payment completed: ${partialPaymentResponse.data.transaction.amount} VND`
    );
    log('STEP 8', 'Payment details:', {
      transactionId: partialPaymentResponse.data.transaction.id,
      paidRooms: 2,
      amount: partialPaymentResponse.data.transaction.amount
    });

    // ==================== STEP 9: Pay Service ====================
    log('STEP 9', 'Paying for service usage...');

    const servicePaymentResponse = await apiRequest(
      '/employee/transactions',
      'POST',
      {
        bookingId,
        serviceUsageId,
        paymentMethod: 'CASH',
        transactionType: 'SERVICE_CHARGE',
        description: 'Payment for room service'
      },
      employeeToken
    );

    logSuccess('STEP 9', `Service paid: ${servicePaymentResponse.data.transaction.amount} VND`);

    // ==================== STEP 10: Full Payment (Remaining Balance) ====================
    log('STEP 10', 'Making full payment for all remaining balances...');

    const fullPaymentResponse = await apiRequest(
      '/employee/transactions',
      'POST',
      {
        bookingId,
        paymentMethod: 'BANK_TRANSFER',
        transactionType: 'ROOM_CHARGE',
        description: 'Final payment for all rooms and services'
      },
      employeeToken
    );

    logSuccess(
      'STEP 10',
      `Full payment completed: ${fullPaymentResponse.data.transaction.amount} VND`
    );

    // ==================== STEP 11: Check-out All Rooms ====================
    log('STEP 11', 'Checking out all rooms...');

    const checkOutResponse = await apiRequest(
      '/employee/bookings/check-out',
      'POST',
      {
        bookingRoomIds
      },
      employeeToken
    );

    logSuccess('STEP 11', `Checked out ${bookingRoomIds.length} rooms`);
    log('STEP 11', 'Check-out details:', {
      bookingStatus: checkOutResponse.data.booking.status,
      checkedOutRooms: checkOutResponse.data.booking.bookingRooms.filter(
        (br: any) => br.status === 'CHECKED_OUT'
      ).length
    });

    // ==================== FINAL SUMMARY ====================
    console.log('\n' + '='.repeat(60));
    console.log('✅ BOOKING FLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));

    const finalBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingRooms: { include: { room: true } },
        transactions: true,
        serviceUsages: { include: { service: true } }
      }
    });

    console.log('\nFinal Booking Summary:');
    console.log(`  Booking Code: ${finalBooking!.bookingCode}`);
    console.log(`  Status: ${finalBooking!.status}`);
    console.log(`  Total Amount: ${finalBooking!.totalAmount} VND`);
    console.log(`  Total Amount: ${finalBooking!.totalAmount} VND`);
    console.log(`  Rooms: ${finalBooking!.bookingRooms.length}`);
    console.log(`  Services: ${finalBooking!.serviceUsages.length}`);
    console.log(`  Transactions: ${finalBooking!.transactions.length}`);
    console.log('\n' + '='.repeat(60) + '\n');
  } catch (error: any) {
    logError('TEST', error);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
console.log('\n' + '='.repeat(60));
console.log('STARTING FULL BOOKING FLOW TEST');
console.log('='.repeat(60));

runBookingFlowTest()
  .then(() => {
    console.log('Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
