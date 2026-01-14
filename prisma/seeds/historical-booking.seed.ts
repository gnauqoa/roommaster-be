import { PrismaClient, BookingStatus } from '@prisma/client';
import { getSeededCustomers } from './customer.seed';

/**
 * Seed comprehensive historical bookings for report testing
 * @param prisma - Prisma client instance
 */
export const seedHistoricalBookings = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding historical bookings...');

  const customers = await getSeededCustomers(prisma);
  const roomTypes = await prisma.roomType.findMany();
  const employees = await prisma.employee.findMany();
  const rooms = await prisma.room.findMany();

  if (customers.length === 0 || roomTypes.length === 0 || rooms.length === 0) {
    console.log('⚠ Missing required data. Skipping historical bookings.');
    return;
  }

  const now = new Date();

  // Helper function to create date
  const daysAgo = (days: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date;
  };

  // Create bookings for the last 6 months with various statuses
  const historicalBookings = [
    // Month 1 (most recent) - Multiple bookings
    {
      bookingCode: 'BK-2026-001',
      primaryCustomerId: customers[0]?.id,
      checkInDate: daysAgo(25),
      checkOutDate: daysAgo(22),
      totalGuests: 2,
      status: BookingStatus.CHECKED_OUT,
      totalAmount: 4500000,
      depositRequired: 2250000,
      roomId: rooms[0]?.id,
      roomTypeId: rooms[0]?.roomTypeId
    },
    {
      bookingCode: 'BK-2026-002',
      primaryCustomerId: customers[1]?.id || customers[0]?.id,
      checkInDate: daysAgo(20),
      checkOutDate: daysAgo(18),
      totalGuests: 3,
      status: BookingStatus.CHECKED_OUT,
      totalAmount: 3200000,
      depositRequired: 1600000,
      roomId: rooms[1]?.id || rooms[0]?.id,
      roomTypeId: rooms[1]?.roomTypeId || rooms[0]?.roomTypeId
    },
    {
      bookingCode: 'BK-2026-003',
      primaryCustomerId: customers[2]?.id || customers[0]?.id,
      checkInDate: daysAgo(15),
      checkOutDate: daysAgo(12),
      totalGuests: 4,
      status: BookingStatus.CHECKED_OUT,
      totalAmount: 6800000,
      depositRequired: 3400000,
      roomId: rooms[2]?.id || rooms[0]?.id,
      roomTypeId: rooms[2]?.roomTypeId || rooms[0]?.roomTypeId
    },
    {
      bookingCode: 'BK-2026-004',
      primaryCustomerId: customers[0]?.id,
      checkInDate: daysAgo(10),
      checkOutDate: daysAgo(7),
      totalGuests: 2,
      status: BookingStatus.CHECKED_OUT,
      totalAmount: 5100000,
      depositRequired: 2550000,
      roomId: rooms[3]?.id || rooms[0]?.id,
      roomTypeId: rooms[3]?.roomTypeId || rooms[0]?.roomTypeId
    },

    // Month 2 - December 2025
    {
      bookingCode: 'BK-2025-047',
      primaryCustomerId: customers[3]?.id || customers[0]?.id,
      checkInDate: daysAgo(45),
      checkOutDate: daysAgo(42),
      totalGuests: 2,
      status: BookingStatus.CHECKED_OUT,
      totalAmount: 4800000,
      depositRequired: 2400000,
      roomId: rooms[4]?.id || rooms[0]?.id,
      roomTypeId: rooms[4]?.roomTypeId || rooms[0]?.roomTypeId
    },
    {
      bookingCode: 'BK-2025-048',
      primaryCustomerId: customers[1]?.id || customers[0]?.id,
      checkInDate: daysAgo(40),
      checkOutDate: daysAgo(37),
      totalGuests: 5,
      status: BookingStatus.CHECKED_OUT,
      totalAmount: 7500000,
      depositRequired: 3750000,
      roomId: rooms[5]?.id || rooms[0]?.id,
      roomTypeId: rooms[5]?.roomTypeId || rooms[0]?.roomTypeId
    },
    {
      bookingCode: 'BK-2025-049',
      primaryCustomerId: customers[2]?.id || customers[0]?.id,
      checkInDate: daysAgo(35),
      checkOutDate: daysAgo(33),
      totalGuests: 2,
      status: BookingStatus.CHECKED_OUT,
      totalAmount: 3600000,
      depositRequired: 1800000,
      roomId: rooms[6]?.id || rooms[0]?.id,
      roomTypeId: rooms[6]?.roomTypeId || rooms[0]?.roomTypeId
    },

    // Month 3 - November 2025
    {
      bookingCode: 'BK-2025-038',
      primaryCustomerId: customers[0]?.id,
      checkInDate: daysAgo(75),
      checkOutDate: daysAgo(70),
      totalGuests: 3,
      status: BookingStatus.CHECKED_OUT,
      totalAmount: 8500000,
      depositRequired: 4250000,
      roomId: rooms[7]?.id || rooms[0]?.id,
      roomTypeId: rooms[7]?.roomTypeId || rooms[0]?.roomTypeId
    },
    {
      bookingCode: 'BK-2025-039',
      primaryCustomerId: customers[3]?.id || customers[0]?.id,
      checkInDate: daysAgo(68),
      checkOutDate: daysAgo(66),
      totalGuests: 2,
      status: BookingStatus.CHECKED_OUT,
      totalAmount: 3400000,
      depositRequired: 1700000,
      roomId: rooms[8]?.id || rooms[0]?.id,
      roomTypeId: rooms[8]?.roomTypeId || rooms[0]?.roomTypeId
    },
    {
      bookingCode: 'BK-2025-040',
      primaryCustomerId: customers[1]?.id || customers[0]?.id,
      checkInDate: daysAgo(62),
      checkOutDate: daysAgo(60),
      totalGuests: 4,
      status: BookingStatus.CHECKED_OUT,
      totalAmount: 6200000,
      depositRequired: 3100000,
      roomId: rooms[9]?.id || rooms[0]?.id,
      roomTypeId: rooms[9]?.roomTypeId || rooms[0]?.roomTypeId
    },

    // Month 4 - October 2025
    {
      bookingCode: 'BK-2025-028',
      primaryCustomerId: customers[2]?.id || customers[0]?.id,
      checkInDate: daysAgo(105),
      checkOutDate: daysAgo(102),
      totalGuests: 2,
      status: BookingStatus.CHECKED_OUT,
      totalAmount: 4700000,
      depositRequired: 2350000,
      roomId: rooms[0]?.id,
      roomTypeId: rooms[0]?.roomTypeId
    },
    {
      bookingCode: 'BK-2025-029',
      primaryCustomerId: customers[0]?.id,
      checkInDate: daysAgo(98),
      checkOutDate: daysAgo(95),
      totalGuests: 3,
      status: BookingStatus.CHECKED_OUT,
      totalAmount: 5800000,
      depositRequired: 2900000,
      roomId: rooms[1]?.id || rooms[0]?.id,
      roomTypeId: rooms[1]?.roomTypeId || rooms[0]?.roomTypeId
    },

    // Cancelled bookings
    {
      bookingCode: 'BK-2025-050',
      primaryCustomerId: customers[3]?.id || customers[0]?.id,
      checkInDate: daysAgo(30),
      checkOutDate: daysAgo(28),
      totalGuests: 2,
      status: BookingStatus.CANCELLED,
      totalAmount: 3800000,
      depositRequired: 1900000,
      roomId: rooms[2]?.id || rooms[0]?.id,
      roomTypeId: rooms[2]?.roomTypeId || rooms[0]?.roomTypeId
    },
    {
      bookingCode: 'BK-2025-051',
      primaryCustomerId: customers[1]?.id || customers[0]?.id,
      checkInDate: daysAgo(55),
      checkOutDate: daysAgo(53),
      totalGuests: 3,
      status: BookingStatus.CANCELLED,
      totalAmount: 4500000,
      depositRequired: 2250000,
      roomId: rooms[3]?.id || rooms[0]?.id,
      roomTypeId: rooms[3]?.roomTypeId || rooms[0]?.roomTypeId
    },

    // Future bookings (confirmed)
    {
      bookingCode: 'BK-2026-FUTURE-001',
      primaryCustomerId: customers[0]?.id,
      checkInDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      checkOutDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
      totalGuests: 2,
      status: BookingStatus.CONFIRMED,
      totalAmount: 5400000,
      depositRequired: 2700000,
      roomId: rooms[4]?.id || rooms[0]?.id,
      roomTypeId: rooms[4]?.roomTypeId || rooms[0]?.roomTypeId
    },
    {
      bookingCode: 'BK-2026-FUTURE-002',
      primaryCustomerId: customers[2]?.id || customers[0]?.id,
      checkInDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      checkOutDate: new Date(now.getTime() + 13 * 24 * 60 * 60 * 1000),
      totalGuests: 4,
      status: BookingStatus.CONFIRMED,
      totalAmount: 7200000,
      depositRequired: 3600000,
      roomId: rooms[5]?.id || rooms[0]?.id,
      roomTypeId: rooms[5]?.roomTypeId || rooms[0]?.roomTypeId
    }
  ];

  let createdCount = 0;
  for (const bookingData of historicalBookings) {
    const { roomId, roomTypeId, ...bookingFields } = bookingData;

    // Check if booking already exists
    const existing = await prisma.booking.findUnique({
      where: { bookingCode: bookingData.bookingCode }
    });

    if (existing) {
      console.log(`  Booking ${bookingData.bookingCode} already exists, skipping...`);
      continue;
    }

    const nights = Math.ceil(
      (bookingData.checkOutDate.getTime() - bookingData.checkInDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const pricePerNight = bookingData.totalAmount / nights;

    // Create booking with booking room
    await prisma.booking.create({
      data: {
        ...bookingFields,
        bookingRooms: {
          create: {
            roomId,
            roomTypeId,
            checkInDate: bookingData.checkInDate,
            checkOutDate: bookingData.checkOutDate,
            actualCheckIn:
              bookingData.status === BookingStatus.CHECKED_OUT
                ? bookingData.checkInDate
                : undefined,
            actualCheckOut:
              bookingData.status === BookingStatus.CHECKED_OUT
                ? bookingData.checkOutDate
                : undefined,
            pricePerNight,
            subtotalRoom: bookingData.totalAmount,
            subtotalService: 0,
            totalAmount: bookingData.totalAmount,
            status: bookingData.status
          }
        },
        bookingCustomers: {
          create: {
            customerId: bookingData.primaryCustomerId,
            isPrimary: true
          }
        }
      }
    });

    createdCount++;
    console.log(`  Created booking ${bookingData.bookingCode}`);
  }

  console.log(`✓ Completed historical bookings seeding (${createdCount} created)`);
};
