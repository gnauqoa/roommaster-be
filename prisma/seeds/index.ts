import prisma from '../../src/prisma';
import { seedSystemFunctions, seedUserGroups } from './permission';
import { seedEmployees } from './employee';
import { seedCustomerTiers, seedCustomers } from './customer';
import { seedRoomTypes, seedRooms } from './room';
import { seedPaymentMethods, seedServices } from './service';

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Seed System Functions (Permissions) - Required for UserGroups
    await seedSystemFunctions();

    // 2. Seed UserGroups (ADMIN, RECEPTIONIST, CASHIER, HOUSEKEEPER, WAITER) with permissions
    await seedUserGroups();

    // 3. Seed Employees - Requires UserGroups to be created first
    await seedEmployees();

    // 4. Seed Customer Tiers - Required for Customers
    await seedCustomerTiers();

    // 5. Seed Customers
    await seedCustomers();

    // 6. Seed Room Types - Required for Rooms
    await seedRoomTypes();

    // 7. Seed Rooms
    await seedRooms();

    // 8. Seed Payment Methods
    await seedPaymentMethods();

    // 9. Seed Services
    await seedServices();

    console.log('\n✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
