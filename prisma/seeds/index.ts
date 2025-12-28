import { PrismaClient } from '@prisma/client';
import { seedEmployees } from './employee.seed';
import { seedCustomers } from './customer.seed';
import { seedRoomTypes } from './roomType.seed';
import { seedRooms } from './room.seed';
import { seedServices } from './service.seed';
import { seedPromotions } from './promotion.seed';
import { seedBookings } from './booking.seed';
import { seedActivities } from './activity.seed';

const prisma = new PrismaClient();

const main = async () => {
  console.log('🌱 Starting seed...');
  console.log('');

  try {
    // Seed in order of dependencies
    console.log('📋 Phase 1: Base entities');
    await seedEmployees(prisma);
    await seedCustomers(prisma);
    await seedRoomTypes(prisma); // Also seeds room tags
    await seedRooms(prisma);
    await seedServices(prisma);
    await seedPromotions(prisma);

    console.log('');
    console.log('📋 Phase 2: Bookings and activities');
    await seedBookings(prisma); // Creates bookings, booking rooms, and booking customers
    await seedActivities(prisma);

    console.log('');
    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    const counts = await Promise.all([
      prisma.employee.count(),
      prisma.customer.count(),
      prisma.roomType.count(),
      prisma.roomTag.count(),
      prisma.room.count(),
      prisma.service.count(),
      prisma.promotion.count(),
      prisma.booking.count(),
      prisma.bookingRoom.count(),
      prisma.activity.count()
    ]);

    console.log(`  - Employees: ${counts[0]}`);
    console.log(`  - Customers: ${counts[1]}`);
    console.log(`  - Room Types: ${counts[2]}`);
    console.log(`  - Room Tags: ${counts[3]}`);
    console.log(`  - Rooms: ${counts[4]}`);
    console.log(`  - Services: ${counts[5]}`);
    console.log(`  - Promotions: ${counts[6]}`);
    console.log(`  - Bookings: ${counts[7]}`);
    console.log(`  - Booking Rooms: ${counts[8]}`);
    console.log(`  - Activities: ${counts[9]}`);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
