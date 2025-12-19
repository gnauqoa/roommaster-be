import prisma from 'prisma';
import { beforeAll, beforeEach, afterAll } from '@jest/globals';

const setupTestDB = () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.token.deleteMany();
    await prisma.employee.deleteMany();
  });

  afterAll(async () => {
    await prisma.token.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.$disconnect();
  });
};

export default setupTestDB;
