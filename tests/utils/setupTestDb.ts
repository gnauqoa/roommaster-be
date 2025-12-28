import prisma from '../../src/prisma';
import { beforeAll, beforeEach, afterAll } from '@jest/globals';

const setupTestDB = () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    // Clean all tables in the correct order (respecting foreign key constraints)
    await prisma.serviceUsage.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.roomTypeTag.deleteMany();
    await prisma.roomTag.deleteMany();
    await prisma.room.deleteMany();
    await prisma.roomType.deleteMany();
    await prisma.service.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.employee.deleteMany();
  });

  afterAll(async () => {
    // Clean up after all tests
    await prisma.serviceUsage.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.roomTypeTag.deleteMany();
    await prisma.roomTag.deleteMany();
    await prisma.room.deleteMany();
    await prisma.roomType.deleteMany();
    await prisma.service.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.employee.deleteMany();

    await prisma.$disconnect();
  });
};

export default setupTestDB;
