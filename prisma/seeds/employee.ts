import prisma from '../../src/prisma';
import bcrypt from 'bcryptjs';

export const seedEmployees = async () => {
  console.log('👤 Seeding employees...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // Get user groups
  const adminGroup = await prisma.userGroup.findUnique({ where: { code: 'ADMIN_GROUP' } });
  const receptionistGroup = await prisma.userGroup.findUnique({
    where: { code: 'RECEPTIONIST_GROUP' }
  });
  const cashierGroup = await prisma.userGroup.findUnique({ where: { code: 'CASHIER_GROUP' } });
  const housekeeperGroup = await prisma.userGroup.findUnique({
    where: { code: 'HOUSEKEEPER_GROUP' }
  });
  const waiterGroup = await prisma.userGroup.findUnique({ where: { code: 'WAITER_GROUP' } });

  const employees = [
    {
      code: 'EMP001',
      name: 'Admin User',
      email: 'admin@hotel.com',
      passwordHash,
      userGroupId: adminGroup?.id,
      phone: '0123456789',
      isActive: true
    },
    {
      code: 'EMP002',
      name: 'Front Desk Receptionist',
      email: 'receptionist@hotel.com',
      passwordHash,
      userGroupId: receptionistGroup?.id,
      phone: '0123456790',
      isActive: true
    },
    {
      code: 'EMP003',
      name: 'Cashier Staff',
      email: 'cashier@hotel.com',
      passwordHash,
      userGroupId: cashierGroup?.id,
      phone: '0123456791',
      isActive: true
    },
    {
      code: 'EMP004',
      name: 'Housekeeper Staff',
      email: 'housekeeper@hotel.com',
      passwordHash,
      userGroupId: housekeeperGroup?.id,
      phone: '0123456792',
      isActive: true
    },
    {
      code: 'EMP005',
      name: 'Restaurant Waiter',
      email: 'waiter@hotel.com',
      passwordHash,
      userGroupId: waiterGroup?.id,
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
