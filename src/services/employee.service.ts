import { Employee, Prisma, PrismaClient } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { encryptPassword } from 'utils/encryption';
import { PaginatedResponse } from 'types/response';
import { Injectable } from 'core/decorators';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create an employee
   */
  async createEmployee(data: {
    code: string;
    name: string;
    email: string;
    phone?: string;
    userGroupId?: number;
    password: string;
    isActive?: boolean;
  }): Promise<Employee> {
    if (await this.getEmployeeByEmail(data.email)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }
    if (await this.getEmployeeByCode(data.code)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Employee code already exists');
    }
    return this.prisma.employee.create({
      data: {
        ...data,
        passwordHash: await encryptPassword(data.password)
      }
    });
  }

  /**
   * Query employees with pagination
   */
  async queryEmployees(
    filter: Prisma.EmployeeWhereInput,
    options: {
      limit?: number;
      page?: number;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<Omit<Employee, 'passwordHash'>>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'createdAt';
    const sortType = options.sortType ?? 'desc';

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
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
          userGroupId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          userGroup: true
        }
      }),
      this.prisma.employee.count({ where: filter })
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
  }

  /**
   * Get employee by id
   */
  async getEmployeeById(id: number): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { id },
      include: { userGroup: true }
    });
  }

  /**
   * Get employee by email
   */
  async getEmployeeByEmail(email: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({ where: { email } });
  }

  /**
   * Get employee by code
   */
  async getEmployeeByCode(code: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({ where: { code } });
  }

  /**
   * Update employee by id
   */
  async updateEmployeeById(
    id: number,
    updateData: Prisma.EmployeeUpdateInput & { password?: string }
  ): Promise<Employee> {
    const employee = await this.getEmployeeById(id);
    if (!employee) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
    }

    if (
      updateData.email &&
      (await this.prisma.employee.findFirst({
        where: { email: updateData.email as string, NOT: { id } }
      }))
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    if (
      updateData.code &&
      (await this.prisma.employee.findFirst({
        where: { code: updateData.code as string, NOT: { id } }
      }))
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Employee code already exists');
    }

    const dataToUpdate: Prisma.EmployeeUpdateInput = { ...updateData };
    if (updateData.password) {
      dataToUpdate.passwordHash = await encryptPassword(updateData.password);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (dataToUpdate as any).password;
    }

    return this.prisma.employee.update({
      where: { id },
      data: dataToUpdate
    });
  }

  /**
   * Delete employee by id
   */
  async deleteEmployeeById(id: number): Promise<Employee> {
    const employee = await this.getEmployeeById(id);
    if (!employee) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
    }
    return this.prisma.employee.delete({ where: { id } });
  }
}

export default EmployeeService;
