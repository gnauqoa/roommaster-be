import { seedEmployees } from './employee';
import { seedRoomTypes, seedRooms } from './room';
import { seedCustomerTiers, seedCustomers } from './customer';
import { seedServices, seedPaymentMethods } from './service';
import { seedSystemFunctions, seedUserGroups, assignUserGroupsToEmployees } from './permission';

const main = async () => {
  console.log('🌱 Starting database seeding...\n');

  // Seed permissions first (SystemFunctions and UserGroups)
  await seedSystemFunctions();
  await seedUserGroups();

  // Seed employees (for authentication)
  await seedEmployees();

  // Assign user groups to employees based on their role
  await assignUserGroupsToEmployees();

  // Seed room configuration
  await seedRoomTypes();
  await seedRooms();

  // Seed customer configuration
  await seedCustomerTiers();
  await seedCustomers();

  // Seed services and payment methods
  await seedServices();
  await seedPaymentMethods();

  console.log('\n✅ Database seeding completed successfully!');
  process.exit(0);
};

main();
