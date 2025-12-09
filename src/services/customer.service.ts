import { Customer, CustomerTier, CustomerType, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from 'prisma';
import ApiError from 'utils/ApiError';
import { PaginatedResponse } from 'types/response';

// ==================== Customer Tier Services ====================

const createCustomerTier = async (data: {
  code: string;
  name: string;
  pointsRequired?: number;
  roomDiscountFactor: number;
  serviceDiscountFactor: number;
}): Promise<CustomerTier> => {
  if (await prisma.customerTier.findUnique({ where: { code: data.code } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Customer tier code already exists');
  }
  return prisma.customerTier.create({ data });
};

const queryCustomerTiers = async (
  filter: Prisma.CustomerTierWhereInput,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  }
): Promise<PaginatedResponse<CustomerTier>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? 'pointsRequired';
  const sortType = options.sortType ?? 'asc';

  const [tiers, total] = await Promise.all([
    prisma.customerTier.findMany({
      where: filter,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortType }
    }),
    prisma.customerTier.count({ where: filter })
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
};

const getCustomerTierById = async (id: number): Promise<CustomerTier | null> => {
  return prisma.customerTier.findUnique({ where: { id } });
};

const updateCustomerTierById = async (
  id: number,
  updateData: Prisma.CustomerTierUpdateInput
): Promise<CustomerTier> => {
  const tier = await getCustomerTierById(id);
  if (!tier) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer tier not found');
  }

  if (updateData.code) {
    const existing = await prisma.customerTier.findFirst({
      where: { code: updateData.code as string, NOT: { id } }
    });
    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Customer tier code already exists');
    }
  }

  return prisma.customerTier.update({
    where: { id },
    data: updateData
  });
};

const deleteCustomerTierById = async (id: number): Promise<CustomerTier> => {
  const tier = await getCustomerTierById(id);
  if (!tier) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer tier not found');
  }

  const customerCount = await prisma.customer.count({ where: { tierId: id } });
  if (customerCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete tier with existing customers');
  }

  return prisma.customerTier.delete({ where: { id } });
};

// ==================== Customer Services ====================

const createCustomer = async (data: {
  code: string;
  tierId?: number;
  fullName: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  nationality?: string;
  address?: string;
  customerType?: CustomerType;
}): Promise<Customer> => {
  if (await prisma.customer.findUnique({ where: { code: data.code } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Customer code already exists');
  }

  if (data.idNumber && (await prisma.customer.findUnique({ where: { idNumber: data.idNumber } }))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'ID number already exists');
  }

  return prisma.customer.create({
    data,
    include: { tier: true }
  });
};

const queryCustomers = async (
  filter: Prisma.CustomerWhereInput,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  }
): Promise<PaginatedResponse<Customer>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? 'createdAt';
  const sortType = options.sortType ?? 'desc';

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: filter,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortType },
      include: { tier: true }
    }),
    prisma.customer.count({ where: filter })
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
};

const getCustomerById = async (id: number): Promise<Customer | null> => {
  return prisma.customer.findUnique({
    where: { id },
    include: { tier: true }
  });
};

const updateCustomerById = async (
  id: number,
  updateData: Prisma.CustomerUpdateInput
): Promise<Customer> => {
  const customer = await getCustomerById(id);
  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  if (updateData.code) {
    const existing = await prisma.customer.findFirst({
      where: { code: updateData.code as string, NOT: { id } }
    });
    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Customer code already exists');
    }
  }

  if (updateData.idNumber) {
    const existing = await prisma.customer.findFirst({
      where: { idNumber: updateData.idNumber as string, NOT: { id } }
    });
    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'ID number already exists');
    }
  }

  return prisma.customer.update({
    where: { id },
    data: updateData,
    include: { tier: true }
  });
};

const deleteCustomerById = async (id: number): Promise<Customer> => {
  const customer = await getCustomerById(id);
  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const reservationCount = await prisma.reservation.count({ where: { customerId: id } });
  if (reservationCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete customer with reservations');
  }

  return prisma.customer.delete({ where: { id } });
};

const searchCustomers = async (query: string, limit = 10): Promise<Customer[]> => {
  return prisma.customer.findMany({
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
};

const updateCustomerStats = async (
  customerId: number,
  spendingAmount: number,
  nights: number
): Promise<Customer> => {
  return prisma.customer.update({
    where: { id: customerId },
    data: {
      totalSpending: { increment: spendingAmount },
      totalNights: { increment: nights },
      lastStayDate: new Date()
    }
  });
};

export default {
  createCustomerTier,
  queryCustomerTiers,
  getCustomerTierById,
  updateCustomerTierById,
  deleteCustomerTierById,
  createCustomer,
  queryCustomers,
  getCustomerById,
  updateCustomerById,
  deleteCustomerById,
  searchCustomers,
  updateCustomerStats
};
