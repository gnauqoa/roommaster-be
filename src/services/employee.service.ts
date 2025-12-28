import { PrismaClient, Employee, Prisma } from '@prisma/client';
import { Injectable } from 'core/decorators';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { encryptPassword } from 'utils/encryption';

export interface CreateEmployeeData {
  name: string;
  username: string;
  password: string;
  role?: string;
}

export interface UpdateEmployeeData {
  name?: string;
  role?: string;
}

export interface EmployeeFilters {
  search?: string;
  role?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new employee
   * @param {CreateEmployeeData} employeeData - Employee data
   * @returns {Promise<Employee>} Created employee
   */
  async createEmployee(employeeData: CreateEmployeeData): Promise<Employee> {
    // Check if username already exists
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { username: employeeData.username }
    });

    if (existingEmployee) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Username already exists');
    }

    // Hash password
    const hashedPassword = await encryptPassword(employeeData.password);

    // Create employee
    const employee = await this.prisma.employee.create({
      data: {
        name: employeeData.name,
        username: employeeData.username,
        password: hashedPassword,
        role: employeeData.role || 'STAFF'
      }
    });

    return employee;
  }

  /**
   * Get all employees with filters and pagination
   * @param {EmployeeFilters} filters - Filter options
   * @param {PaginationOptions} options - Pagination options
   * @returns {Promise<{ data: any[]; total: number; page: number; limit: number }>}
   */
  async getAllEmployees(
    filters: EmployeeFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const { search, role } = filters;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const where: Prisma.EmployeeWhereInput = {};

    // Apply search filter (search by name or username)
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          username: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Apply role filter
    if (role) {
      where.role = role;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          updatedAt: true
        }
      }),
      this.prisma.employee.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit
    };
  }

  /**
   * Get employee by ID
   * @param {string} employeeId - Employee ID
   * @returns {Promise<Employee>} Employee
   */
  async getEmployeeById(employeeId: string): Promise<Employee> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
    }

    return employee;
  }

  /**
   * Get employee by username
   * @param {string} username - Employee username
   * @returns {Promise<Employee | null>} Employee or null
   */
  async getEmployeeByUsername(username: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { username }
    });
  }

  /**
   * Update employee by ID
   * @param {string} employeeId - Employee ID
   * @param {UpdateEmployeeData} updateData - Update data
   * @returns {Promise<Employee>} Updated employee
   */
  async updateEmployee(employeeId: string, updateData: UpdateEmployeeData): Promise<Employee> {
    await this.getEmployeeById(employeeId);

    const updatedEmployee = await this.prisma.employee.update({
      where: { id: employeeId },
      data: updateData
    });

    return updatedEmployee;
  }

  /**
   * Delete employee by ID
   * @param {string} employeeId - Employee ID
   * @returns {Promise<void>}
   */
  async deleteEmployee(employeeId: string): Promise<void> {
    await this.getEmployeeById(employeeId);

    // Check if employee has processed transactions
    const transactionCount = await this.prisma.transaction.count({
      where: { processedById: employeeId }
    });

    if (transactionCount > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Cannot delete employee with transaction history. Consider deactivating the account instead.'
      );
    }

    await this.prisma.employee.delete({
      where: { id: employeeId }
    });
  }
}

export default EmployeeService;
