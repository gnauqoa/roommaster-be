import prisma from 'prisma';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const password = 'password123';
const hashedPassword = bcrypt.hashSync(password, 8);

export const adminEmployee = {
  code: 'EMP001',
  name: 'Admin Test',
  email: 'admin@test.com',
  userGroupId: 1,
  passwordHash: hashedPassword,
  isActive: true
};

export const receptionistEmployee = {
  code: 'EMP002',
  name: 'Receptionist Test',
  email: 'receptionist@test.com',
  userGroupId: 2,
  passwordHash: hashedPassword,
  isActive: true
};

export const insertEmployees = async (employees: Prisma.EmployeeCreateManyInput[]) => {
  await prisma.employee.createMany({
    data: employees.map((emp) => ({
      ...emp,
      passwordHash: hashedPassword
    }))
  });
};
