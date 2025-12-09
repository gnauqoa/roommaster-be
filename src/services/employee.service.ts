import { Employee, Role, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from 'prisma';
import ApiError from 'utils/ApiError';
import { encryptPassword } from 'utils/encryption';
import { PaginatedResponse } from 'types/response';

/**
 * Create an employee
 */
const createEmployee = async (data: {
  code: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  userGroupId?: number;
  password: string;
  isActive?: boolean;
}): Promise<Employee> => {
  if (await getEmployeeByEmail(data.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (await getEmployeeByCode(data.code)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee code already exists');
  }
  return prisma.employee.create({
    data: {
      ...data,
      passwordHash: await encryptPassword(data.password)
    }
  });
};

/**
 * Query employees with pagination
 */
const queryEmployees = async (
  filter: Prisma.EmployeeWhereInput,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  }
): Promise<PaginatedResponse<Omit<Employee, 'passwordHash'>>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? 'createdAt';
  const sortType = options.sortType ?? 'desc';

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where: filter,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortType },
      select: {
        id: true,
        code: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        userGroupId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userGroup: true
      }
    }),
    prisma.employee.count({ where: filter })
  ]);

  return {
    results: employees as Omit<Employee, 'passwordHash'>[],
    meta: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total
    }
  };
};

/**
 * Get employee by id
 */
const getEmployeeById = async (id: number): Promise<Employee | null> => {
  return prisma.employee.findUnique({
    where: { id },
    include: { userGroup: true }
  });
};

/**
 * Get employee by email
 */
const getEmployeeByEmail = async (email: string): Promise<Employee | null> => {
  return prisma.employee.findUnique({ where: { email } });
};

/**
 * Get employee by code
 */
const getEmployeeByCode = async (code: string): Promise<Employee | null> => {
  return prisma.employee.findUnique({ where: { code } });
};

/**
 * Update employee by id
 */
const updateEmployeeById = async (
  id: number,
  updateData: Prisma.EmployeeUpdateInput & { password?: string }
): Promise<Employee> => {
  const employee = await getEmployeeById(id);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
  }

  if (
    updateData.email &&
    (await prisma.employee.findFirst({
      where: { email: updateData.email as string, NOT: { id } }
    }))
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  if (
    updateData.code &&
    (await prisma.employee.findFirst({
      where: { code: updateData.code as string, NOT: { id } }
    }))
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee code already exists');
  }

  const dataToUpdate: Prisma.EmployeeUpdateInput = { ...updateData };
  if (updateData.password) {
    dataToUpdate.passwordHash = await encryptPassword(updateData.password);
    delete (dataToUpdate as any).password;
  }

  return prisma.employee.update({
    where: { id },
    data: dataToUpdate
  });
};

/**
 * Delete employee by id
 */
const deleteEmployeeById = async (id: number): Promise<Employee> => {
  const employee = await getEmployeeById(id);
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
  }
  return prisma.employee.delete({ where: { id } });
};

export default {
  createEmployee,
  queryEmployees,
  getEmployeeById,
  getEmployeeByEmail,
  getEmployeeByCode,
  updateEmployeeById,
  deleteEmployeeById
};
