import { PrismaClient } from '@prisma/client';
import { seedEmployees } from './employee.seed';
import { seedCustomers, seedCustomerPromotions } from './customer.seed';
import { seedRoomTypes } from './roomType.seed';
import { seedRooms } from './room.seed';
import { seedServices } from './service.seed';
import { seedPromotions } from './promotion.seed';
import { seedBookings } from './booking.seed';
import { seedHistoricalBookings } from './historical-booking.seed';
import { seedTransactions } from './transaction.seed';
import { seedServiceUsage } from './service-usage.seed';
import { seedActivities } from './activity.seed';
import { seedRBAC } from './permissions.seed';
import { seedCalendarEvents } from './calendar-event.seed';
import { seedPricingRules } from './pricing-rule.seed';
import { seedCustomerRanks } from './customer-rank.seed';
import { seedAppSettings } from './app-settings.seed';

const prisma = new PrismaClient();

const main = async () => {
  console.log('🌱 Starting seed...');
  console.log('');

  try {
    // Seed in order of dependencies
    console.log('📋 Phase 1: Base entities');
    await seedRBAC(prisma);
    await seedEmployees(prisma);
    await seedCustomers(prisma);
    await seedRoomTypes(prisma); // Also seeds room tags
    await seedRooms(prisma);
    await seedServices(prisma);

    // Seed app settings (depends on services for some settings)
    await seedAppSettings(prisma);

    await seedPromotions(prisma);
    await seedCustomerPromotions(prisma);
    await seedCustomerRanks(prisma);
    await seedCalendarEvents(prisma);
    await seedPricingRules(prisma);

    console.log('');
    console.log('📋 Phase 2: Bookings and activities');
    await seedBookings(prisma); // Creates basic bookings
    await seedHistoricalBookings(prisma); // Creates historical bookings for reports
    await seedActivities(prisma);

    console.log('');
    console.log('📋 Phase 3: Transactions and service usage (for reports)');
    await seedTransactions(prisma); // Creates transaction records
    await seedServiceUsage(prisma); // Creates service usage records

    console.log('');
    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    const counts = await Promise.all([
      prisma.appSetting.count(),
      prisma.role.count(),
      prisma.permission.count(),
      prisma.employee.count(),
      prisma.customer.count(),
      prisma.roomType.count(),
      prisma.roomTag.count(),
      prisma.room.count(),
      prisma.service.count(),
      prisma.promotion.count(),
      prisma.customerPromotion.count(),
      prisma.customerRank.count(),
      prisma.calendarEvent.count(),
      prisma.pricingRule.count(),
      prisma.booking.count(),
      prisma.bookingRoom.count(),
      prisma.activity.count(),
      prisma.transaction.count(),
      prisma.serviceUsage.count()
    ]);

    console.log(`  - App Settings: ${counts[0]}`);
    console.log(`  - Roles: ${counts[1]}`);
    console.log(`  - Permissions: ${counts[2]}`);
    console.log(`  - Employees: ${counts[3]}`);
    console.log(`  - Customers: ${counts[4]}`);
    console.log(`  - Room Types: ${counts[5]}`);
    console.log(`  - Room Tags: ${counts[6]}`);
    console.log(`  - Rooms: ${counts[7]}`);
    console.log(`  - Services: ${counts[8]}`);
    console.log(`  - Promotions: ${counts[9]}`);
    console.log(`  - Customer Promotions: ${counts[10]}`);
    console.log(`  - Customer Ranks: ${counts[11]}`);
    console.log(`  - Calendar Events: ${counts[12]}`);
    console.log(`  - Pricing Rules: ${counts[13]}`);
    console.log(`  - Bookings: ${counts[14]}`);
    console.log(`  - Booking Rooms: ${counts[15]}`);
    console.log(`  - Activities: ${counts[16]}`);
    console.log(`  - Transactions: ${counts[17]}`);
    console.log(`  - Service Usage: ${counts[18]}`);
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
