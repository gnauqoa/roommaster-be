import { PrismaClient } from '@prisma/client';
import { seedEmployees } from './employee.seed';
import { seedCustomers, seedCustomerPromotions } from './customer.seed';
import { seedRoomTypes } from './roomType.seed';
import { seedRooms } from './room.seed';
import { seedServices } from './service.seed';
import { seedPromotions } from './promotion.seed';
import { seedBookings } from './booking.seed';
import { seedActivities } from './activity.seed';
import { APP_SETTING_KEYS } from '../../src/constants/app-settings.constant';

const prisma = new PrismaClient();

const main = async () => {
  console.log('🌱 Starting seed...');
  console.log('');

  try {
    // Seed in order of dependencies
    console.log('📋 Phase 0: App Settings');
    // Seed app settings
    const appSettings = [
      {
        key: APP_SETTING_KEYS.CHECKIN_TIME,
        value: { hour: 14, minute: 0, gracePeriodMinutes: 60 },
        description: 'Standard check-in time'
      },
      {
        key: APP_SETTING_KEYS.CHECKOUT_TIME,
        value: { hour: 12, minute: 0, gracePeriodMinutes: 60 },
        description: 'Standard check-out time'
      },
      {
        key: APP_SETTING_KEYS.DEPOSIT_PERCENTAGE,
        value: { percentage: 50 },
        description: 'Deposit percentage of total booking amount'
      }
    ];
    for (const setting of appSettings) {
      await prisma.appSetting.upsert({
        where: { key: setting.key },
        create: setting,
        update: { value: setting.value }
      });
    }
    console.log('  ✓ App settings seeded');

    console.log('');
    console.log('📋 Phase 1: Base entities');
    await seedEmployees(prisma);
    await seedCustomers(prisma);
    await seedRoomTypes(prisma); // Also seeds room tags
    await seedRooms(prisma);
    await seedServices(prisma);
    await seedPromotions(prisma);
    await seedCustomerPromotions(prisma);

    console.log('');
    console.log('📋 Phase 2: Bookings and activities');
    await seedBookings(prisma); // Creates bookings, booking rooms, and booking customers
    await seedActivities(prisma);

    console.log('');
    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    const counts = await Promise.all([
      prisma.appSetting.count(),
      prisma.employee.count(),
      prisma.customer.count(),
      prisma.roomType.count(),
      prisma.roomTag.count(),
      prisma.room.count(),
      prisma.service.count(),
      prisma.promotion.count(),
      prisma.customerPromotion.count(),
      prisma.booking.count(),
      prisma.bookingRoom.count(),
      prisma.activity.count()
    ]);

    console.log(`  - App Settings: ${counts[0]}`);
    console.log(`  - Employees: ${counts[1]}`);
    console.log(`  - Customers: ${counts[2]}`);
    console.log(`  - Room Types: ${counts[3]}`);
    console.log(`  - Room Tags: ${counts[4]}`);
    console.log(`  - Rooms: ${counts[5]}`);
    console.log(`  - Services: ${counts[6]}`);
    console.log(`  - Promotions: ${counts[7]}`);
    console.log(`  - Customer Promotions: ${counts[8]}`);
    console.log(`  - Bookings: ${counts[9]}`);
    console.log(`  - Booking Rooms: ${counts[10]}`);
    console.log(`  - Activities: ${counts[11]}`);
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
