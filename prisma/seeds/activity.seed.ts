import { PrismaClient, ActivityType } from '@prisma/client';
import { getSeededBookings } from './booking.seed';
import { getSeededEmployees } from './employee.seed';
import { getSeededCustomers } from './customer.seed';

/**
 * Seed activities data
 * @param prisma - Prisma client instance
 */
export const seedActivities = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding activities...');

  const bookings = await getSeededBookings(prisma);
  const employees = await getSeededEmployees(prisma);
  const customers = await getSeededCustomers(prisma);

  if (bookings.length === 0 || employees.length === 0 || customers.length === 0) {
    console.log('⚠ Missing required data for activities. Skipping...');
    return;
  }

  const receptionist = employees.find((e) => e.role === 'RECEPTIONIST') || employees[0];

  // Create activities for bookings
  for (const booking of bookings.slice(0, 2)) {
    const bookingRoom = booking.bookingRooms[0];

    const activities = [
      {
        type: ActivityType.CREATE_BOOKING,
        description: `Tạo booking ${booking.bookingCode}`,
        metadata: {
          bookingCode: booking.bookingCode,
          totalAmount: Number(booking.totalAmount)
        },
        customerId: booking.primaryCustomerId,
        employeeId: receptionist.id
      },
      {
        type: ActivityType.CREATE_BOOKING_ROOM,
        description: `Thêm phòng vào booking ${booking.bookingCode}`,
        metadata: {
          bookingCode: booking.bookingCode,
          roomNumber: bookingRoom ? 'Room added' : 'N/A'
        },
        bookingRoomId: bookingRoom?.id,
        employeeId: receptionist.id
      }
    ];

    for (const activity of activities) {
      const existing = await prisma.activity.findFirst({
        where: {
          type: activity.type,
          customerId: activity.customerId,
          employeeId: activity.employeeId
        }
      });

      if (!existing) {
        await prisma.activity.create({
          data: activity
        });
      }
    }

    console.log(`  Created activities for booking ${booking.bookingCode}`);
  }

  console.log(`✓ Completed activity seeding`);
};
