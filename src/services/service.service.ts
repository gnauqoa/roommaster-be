import { Service, PaymentMethod, ServiceGroup, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from 'prisma';
import ApiError from 'utils/ApiError';
import { PaginatedResponse } from 'types/response';

// ==================== Service ====================

const createService = async (data: {
  code: string;
  name: string;
  unitPrice: number;
  unit?: string;
  serviceGroup?: ServiceGroup;
  allowPromotion?: boolean;
  allowDiscount?: boolean;
  isActive?: boolean;
  notes?: string;
}): Promise<Service> => {
  if (await prisma.service.findUnique({ where: { code: data.code } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Service code already exists');
  }
  return prisma.service.create({ data });
};

const queryServices = async (
  filter: Prisma.ServiceWhereInput,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  }
): Promise<PaginatedResponse<Service>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? 'name';
  const sortType = options.sortType ?? 'asc';

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where: filter,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortType }
    }),
    prisma.service.count({ where: filter })
  ]);

  return {
    results: services,
    meta: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total
    }
  };
};

const getServiceById = async (id: number): Promise<Service | null> => {
  return prisma.service.findUnique({ where: { id } });
};

const updateServiceById = async (
  id: number,
  updateData: Prisma.ServiceUpdateInput
): Promise<Service> => {
  const service = await getServiceById(id);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
  }

  if (updateData.code) {
    const existing = await prisma.service.findFirst({
      where: { code: updateData.code as string, NOT: { id } }
    });
    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Service code already exists');
    }
  }

  return prisma.service.update({
    where: { id },
    data: updateData
  });
};

const deleteServiceById = async (id: number): Promise<Service> => {
  const service = await getServiceById(id);
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
  }

  const transactionCount = await prisma.folioTransaction.count({
    where: { serviceId: id }
  });
  if (transactionCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete service with transactions');
  }

  return prisma.service.delete({ where: { id } });
};

// ==================== Payment Method ====================

const createPaymentMethod = async (data: {
  code: string;
  name: string;
  transactionFee?: number;
}): Promise<PaymentMethod> => {
  if (await prisma.paymentMethod.findUnique({ where: { code: data.code } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment method code already exists');
  }
  return prisma.paymentMethod.create({ data });
};

const queryPaymentMethods = async (
  filter: Prisma.PaymentMethodWhereInput,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  }
): Promise<PaginatedResponse<PaymentMethod>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? 'name';
  const sortType = options.sortType ?? 'asc';

  const [methods, total] = await Promise.all([
    prisma.paymentMethod.findMany({
      where: filter,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortType }
    }),
    prisma.paymentMethod.count({ where: filter })
  ]);

  return {
    results: methods,
    meta: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total
    }
  };
};

const getPaymentMethodById = async (id: number): Promise<PaymentMethod | null> => {
  return prisma.paymentMethod.findUnique({ where: { id } });
};

const updatePaymentMethodById = async (
  id: number,
  updateData: Prisma.PaymentMethodUpdateInput
): Promise<PaymentMethod> => {
  const method = await getPaymentMethodById(id);
  if (!method) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment method not found');
  }

  if (updateData.code) {
    const existing = await prisma.paymentMethod.findFirst({
      where: { code: updateData.code as string, NOT: { id } }
    });
    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment method code already exists');
    }
  }

  return prisma.paymentMethod.update({
    where: { id },
    data: updateData
  });
};

const deletePaymentMethodById = async (id: number): Promise<PaymentMethod> => {
  const method = await getPaymentMethodById(id);
  if (!method) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment method not found');
  }

  const transactionCount = await prisma.folioTransaction.count({
    where: { paymentMethodId: id }
  });
  if (transactionCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete payment method with transactions');
  }

  return prisma.paymentMethod.delete({ where: { id } });
};

export default {
  createService,
  queryServices,
  getServiceById,
  updateServiceById,
  deleteServiceById,
  createPaymentMethod,
  queryPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethodById,
  deletePaymentMethodById
};
