import { PrismaClient } from '@prisma/client';
import { hashPassword } from './utils';

/**
 * Seed employees data
 * @param prisma - Prisma client instance
 */
export const seedEmployees = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding employees...');

  const employees = [
    {
      name: 'Nguyễn Văn Admin',
      username: 'admin',
      password: await hashPassword('password123'),
      role: 'ADMIN'
    },
    {
      name: 'Trần Thị Lan',
      username: 'receptionist1',
      password: await hashPassword('password123'),
      role: 'RECEPTIONIST'
    },
    {
      name: 'Lê Văn Hùng',
      username: 'receptionist2',
      password: await hashPassword('password123'),
      role: 'RECEPTIONIST'
    },
    {
      name: 'Phạm Thị Mai',
      username: 'housekeeping1',
      password: await hashPassword('password123'),
      role: 'HOUSEKEEPING'
    },
    {
      name: 'Hoàng Văn Tùng',
      username: 'staff1',
      password: await hashPassword('password123'),
      role: 'STAFF'
    }
  ];

  for (const employee of employees) {
    await prisma.employee.upsert({
      where: { username: employee.username },
      update: {},
      create: employee
    });
  }

  console.log(`✓ Created ${employees.length} employees`);
};

/**
 * Get seeded employees for use in other seeds
 */
export const getSeededEmployees = async (prisma: PrismaClient) => {
  return prisma.employee.findMany();
};
