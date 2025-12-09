import prisma from '../../src/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export const seedEmployees = async () => {
  console.log('👤 Seeding employees...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const employees = [
    {
      code: 'EMP001',
      name: 'Admin User',
      email: 'admin@hotel.com',
      passwordHash,
      role: Role.ADMIN,
      phone: '0123456789',
      isActive: true
    },
    {
      code: 'EMP002',
      name: 'Front Desk Receptionist',
      email: 'receptionist@hotel.com',
      passwordHash,
      role: Role.RECEPTIONIST,
      phone: '0123456790',
      isActive: true
    },
    {
      code: 'EMP003',
      name: 'Cashier Staff',
      email: 'cashier@hotel.com',
      passwordHash,
      role: Role.CASHIER,
      phone: '0123456791',
      isActive: true
    },
    {
      code: 'EMP004',
      name: 'Housekeeper Staff',
      email: 'housekeeper@hotel.com',
      passwordHash,
      role: Role.HOUSEKEEPER,
      phone: '0123456792',
      isActive: true
    },
    {
      code: 'EMP005',
      name: 'Restaurant Waiter',
      email: 'waiter@hotel.com',
      passwordHash,
      role: Role.WAITER,
      phone: '0123456793',
      isActive: true
    }
  ];

  for (const employee of employees) {
    await prisma.employee.upsert({
      where: { email: employee.email },
      update: {},
      create: employee
    });
  }

  console.log('✅ Employees seeded successfully!');
};
