import { PrismaClient, BookingStatus } from '@prisma/client';
import { getSeededCustomers } from './customer.seed';
import { getSeededRoomTypes } from './roomType.seed';

/**
 * Seed bookings data
 * @param prisma - Prisma client instance
 */
export const seedBookings = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding bookings...');

  const customers = await getSeededCustomers(prisma);
  const roomTypes = await getSeededRoomTypes(prisma);

  if (customers.length === 0) {
    console.log('⚠ No customers found. Please seed customers first.');
    return;
  }

  if (roomTypes.length === 0) {
    console.log('⚠ No room types found. Please seed room types first.');
    return;
  }

  // Get available rooms
  const availableRooms = await prisma.room.findMany({
    where: { status: 'AVAILABLE' },
    take: 10
  });

  if (availableRooms.length === 0) {
    console.log('⚠ No available rooms found. Please seed rooms first.');
    return;
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const bookings = [
    {
      bookingCode: 'BK001',
      primaryCustomerId: customers[0].id,
      checkInDate: tomorrow,
      checkOutDate: new Date(tomorrow.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
      totalGuests: 2,
      status: BookingStatus.CONFIRMED,
      rooms: [availableRooms[0]]
    },
    {
      bookingCode: 'BK002',
      primaryCustomerId: customers[1]?.id || customers[0].id,
      checkInDate: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000),
      checkOutDate: new Date(tomorrow.getTime() + 5 * 24 * 60 * 60 * 1000),
      totalGuests: 4,
      status: BookingStatus.PENDING,
      rooms: [availableRooms[1], availableRooms[2]].filter(Boolean)
    },
    {
      bookingCode: 'BK003',
      primaryCustomerId: customers[2]?.id || customers[0].id,
      checkInDate: nextWeek,
      checkOutDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
      totalGuests: 2,
      status: BookingStatus.CONFIRMED,
      rooms: [availableRooms[3]].filter(Boolean)
    }
  ];

  for (const bookingData of bookings) {
    const { rooms, ...booking } = bookingData;

    // Check if booking already exists
    const existing = await prisma.booking.findUnique({
      where: { bookingCode: booking.bookingCode }
    });

    if (existing) {
      console.log(`  Booking ${booking.bookingCode} already exists, skipping...`);
      continue;
    }

    // Calculate total amount based on rooms
    let totalAmount = 0;
    const nights = Math.ceil(
      (booking.checkOutDate.getTime() - booking.checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    for (const room of rooms) {
      const roomType = await prisma.roomType.findUnique({
        where: { id: room.roomTypeId }
      });
      if (roomType) {
        totalAmount += Number(roomType.pricePerNight) * nights;
      }
    }

    const depositRequired = totalAmount * 0.3; // 30% deposit

    // Create booking with rooms
    await prisma.booking.create({
      data: {
        ...booking,
        totalAmount,
        depositRequired,
        totalDeposit: 0,
        totalPaid: 0,
        balance: totalAmount,
        bookingRooms: {
          create: rooms.map((room) => ({
            roomId: room.id,
            roomTypeId: room.roomTypeId,
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
            pricePerNight: 0, // Will be set by trigger or service
            depositAmount: depositRequired / rooms.length,
            subtotalRoom: totalAmount / rooms.length,
            subtotalService: 0,
            totalAmount: totalAmount / rooms.length,
            totalPaid: 0,
            balance: totalAmount / rooms.length,
            status: booking.status
          }))
        },
        bookingCustomers: {
          create: {
            customerId: booking.primaryCustomerId,
            isPrimary: true
          }
        }
      }
    });

    console.log(`  Created booking ${booking.bookingCode}`);
  }

  console.log(`✓ Completed booking seeding`);
};

/**
 * Get seeded bookings for use in other seeds
 */
export const getSeededBookings = async (prisma: PrismaClient) => {
  return prisma.booking.findMany({
    where: {
      bookingCode: {
        startsWith: 'BK'
      }
    },
    include: {
      bookingRooms: true
    }
  });
};
