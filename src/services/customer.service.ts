import { Customer, CustomerTier, CustomerType, Prisma, PrismaClient } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { PaginatedResponse } from 'types/response';
import { Injectable } from 'core/decorators';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaClient) {}

  // ==================== Customer Tier Services ====================

  async createCustomerTier(data: {
    code: string;
    name: string;
    pointsRequired?: number;
    roomDiscountFactor: number;
    serviceDiscountFactor: number;
  }): Promise<CustomerTier> {
    if (await this.prisma.customerTier.findUnique({ where: { code: data.code } })) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Customer tier code already exists');
    }
    return this.prisma.customerTier.create({ data });
  }

  async queryCustomerTiers(
    filter: Prisma.CustomerTierWhereInput,
    options: {
      limit?: number;
      page?: number;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<CustomerTier>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'pointsRequired';
    const sortType = options.sortType ?? 'asc';

    const [tiers, total] = await Promise.all([
      this.prisma.customerTier.findMany({
        where: filter,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortType }
      }),
      this.prisma.customerTier.count({ where: filter })
    ]);

    return {
      results: tiers,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    };
  }

  async getCustomerTierById(id: number): Promise<CustomerTier | null> {
    return this.prisma.customerTier.findUnique({ where: { id } });
  }

  async updateCustomerTierById(
    id: number,
    updateData: Prisma.CustomerTierUpdateInput
  ): Promise<CustomerTier> {
    const tier = await this.getCustomerTierById(id);
    if (!tier) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer tier not found');
    }

    if (updateData.code) {
      const existing = await this.prisma.customerTier.findFirst({
        where: { code: updateData.code as string, NOT: { id } }
      });
      if (existing) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Customer tier code already exists');
      }
    }

    return this.prisma.customerTier.update({
      where: { id },
      data: updateData
    });
  }

  async deleteCustomerTierById(id: number): Promise<CustomerTier> {
    const tier = await this.getCustomerTierById(id);
    if (!tier) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer tier not found');
    }

    const customerCount = await this.prisma.customer.count({ where: { tierId: id } });
    if (customerCount > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete tier with existing customers');
    }

    return this.prisma.customerTier.delete({ where: { id } });
  }

  // ==================== Customer Services ====================

  async createCustomer(data: {
    code: string;
    tierId?: number;
    fullName: string;
    phone?: string;
    email?: string;
    idNumber?: string;
    nationality?: string;
    address?: string;
    customerType?: CustomerType;
  }): Promise<Customer> {
    if (await this.prisma.customer.findUnique({ where: { code: data.code } })) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Customer code already exists');
    }

    if (
      data.idNumber &&
      (await this.prisma.customer.findUnique({ where: { idNumber: data.idNumber } }))
    ) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'ID number already exists');
    }

    return this.prisma.customer.create({
      data,
      include: { tier: true }
    });
  }

  async queryCustomers(
    filter: Prisma.CustomerWhereInput,
    options: {
      limit?: number;
      page?: number;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<Customer>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'createdAt';
    const sortType = options.sortType ?? 'desc';

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where: filter,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortType },
        include: { tier: true }
      }),
      this.prisma.customer.count({ where: filter })
    ]);

    return {
      results: customers,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    };
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    return this.prisma.customer.findUnique({
      where: { id },
      include: { tier: true }
    });
  }

  async updateCustomerById(id: number, updateData: Prisma.CustomerUpdateInput): Promise<Customer> {
    const customer = await this.getCustomerById(id);
    if (!customer) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
    }

    if (updateData.code) {
      const existing = await this.prisma.customer.findFirst({
        where: { code: updateData.code as string, NOT: { id } }
      });
      if (existing) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Customer code already exists');
      }
    }

    if (updateData.idNumber) {
      const existing = await this.prisma.customer.findFirst({
        where: { idNumber: updateData.idNumber as string, NOT: { id } }
      });
      if (existing) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'ID number already exists');
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: updateData,
      include: { tier: true }
    });
  }

  async deleteCustomerById(id: number): Promise<Customer> {
    const customer = await this.getCustomerById(id);
    if (!customer) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
    }

    const reservationCount = await this.prisma.reservation.count({ where: { customerId: id } });
    if (reservationCount > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete customer with reservations');
    }

    return this.prisma.customer.delete({ where: { id } });
  }

  async searchCustomers(query: string, limit = 10): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { email: { contains: query, mode: 'insensitive' } },
          { idNumber: { contains: query } },
          { code: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: { tier: true },
      take: limit
    });
  }

  async updateCustomerStats(
    customerId: number,
    spendingAmount: number,
    nights: number
  ): Promise<Customer> {
    return this.prisma.customer.update({
      where: { id: customerId },
      data: {
        totalSpending: { increment: spendingAmount },
        totalNights: { increment: nights },
        lastStayDate: new Date()
      }
    });
  }
}

export default CustomerService;
