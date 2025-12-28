import { PrismaClient } from '@prisma/client';
import { seedEmployees } from './employee.seed';
import { seedCustomers } from './customer.seed';
import { seedRoomTypes } from './roomType.seed';
import { seedRooms } from './room.seed';
import { seedServices } from './service.seed';

const prisma = new PrismaClient();

const main = async () => {
  console.log('🌱 Starting seed...');

  try {
    // Seed in order of dependencies
    await seedEmployees(prisma);
    await seedCustomers(prisma);
    await seedRoomTypes(prisma);
    await seedRooms(prisma); // Depends on roomTypes
    await seedServices(prisma);

    console.log('✅ Seed completed successfully!');
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
