import { PrismaClient, Customer, Prisma } from '@prisma/client';
import { Injectable } from 'core/decorators';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { encryptPassword } from 'utils/encryption';

export interface CreateCustomerData {
  fullName: string;
  phone: string;
  password: string;
  email?: string;
  idNumber?: string;
  address?: string;
}

export interface UpdateCustomerData {
  fullName?: string;
  email?: string;
  idNumber?: string;
  address?: string;
}

export interface CustomerFilters {
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new customer
   * @param {CreateCustomerData} customerData - Customer data
   * @returns {Promise<Customer>} Created customer
   */
  async createCustomer(customerData: CreateCustomerData): Promise<Customer> {
    // Check if phone already exists
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { phone: customerData.phone }
    });

    if (existingCustomer) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Phone number already registered');
    }

    // Hash password
    const hashedPassword = await encryptPassword(customerData.password);

    // Create customer
    const customer = await this.prisma.customer.create({
      data: {
        ...customerData,
        password: hashedPassword
      }
    });

    return customer;
  }

  /**
   * Get all customers with filters and pagination
   * @param {CustomerFilters} filters - Filter options
   * @param {PaginationOptions} options - Pagination options
   * @returns {Promise<{ data: any[]; total: number; page: number; limit: number }>}
   */
  async getAllCustomers(
    filters: CustomerFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const { search } = filters;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const where: Prisma.CustomerWhereInput = {};

    // Apply search filter (search by name, phone, or email)
    if (search) {
      where.OR = [
        {
          fullName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          phone: {
            contains: search
          }
        },
        {
          email: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          idNumber: true,
          address: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bookings: true
            }
          }
        }
      }),
      this.prisma.customer.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit
    };
  }

  /**
   * Get customer by ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<Customer>} Customer
   */
  async getCustomerById(customerId: string): Promise<Customer> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
    }

    return customer;
  }

  /**
   * Get customer by phone
   * @param {string} phone - Customer phone
   * @returns {Promise<Customer | null>} Customer or null
   */
  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({
      where: { phone }
    });
  }

  /**
   * Update customer by ID
   * @param {string} customerId - Customer ID
   * @param {UpdateCustomerData} updateData - Update data
   * @returns {Promise<Customer>} Updated customer
   */
  async updateCustomer(customerId: string, updateData: UpdateCustomerData): Promise<Customer> {
    const customer = await this.getCustomerById(customerId);

    // If email is being updated, check if it's already in use
    if (updateData.email && updateData.email !== customer.email) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          email: updateData.email,
          id: { not: customerId }
        }
      });

      if (existingCustomer) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already in use');
      }
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id: customerId },
      data: updateData
    });

    return updatedCustomer;
  }

  /**
   * Delete customer by ID
   * @param {string} customerId - Customer ID
   * @returns {Promise<void>}
   */
  async deleteCustomer(customerId: string): Promise<void> {
    await this.getCustomerById(customerId);

    // Check if customer has bookings
    const bookingCount = await this.prisma.booking.count({
      where: { primaryCustomerId: customerId }
    });

    if (bookingCount > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete customer with booking history.');
    }

    await this.prisma.customer.delete({
      where: { id: customerId }
    });
  }
}

export default CustomerService;
