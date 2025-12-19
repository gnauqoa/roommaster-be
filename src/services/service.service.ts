import { Service, PaymentMethod, ServiceGroup, Prisma, PrismaClient } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { PaginatedResponse } from 'types/response';
import { Injectable } from 'core/decorators';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaClient) {}

  // ==================== Service ====================

  async createService(data: {
    code: string;
    name: string;
    unitPrice: number;
    unit?: string;
    serviceGroup?: ServiceGroup;
    allowPromotion?: boolean;
    allowDiscount?: boolean;
    isActive?: boolean;
    notes?: string;
  }): Promise<Service> {
    if (await this.prisma.service.findUnique({ where: { code: data.code } })) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Service code already exists');
    }
    return this.prisma.service.create({ data });
  }

  async queryServices(
    filter: Prisma.ServiceWhereInput,
    options: {
      limit?: number;
      page?: number;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<Service>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'name';
    const sortType = options.sortType ?? 'asc';

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where: filter,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortType }
      }),
      this.prisma.service.count({ where: filter })
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
  }

  async getServiceById(id: number): Promise<Service | null> {
    return this.prisma.service.findUnique({ where: { id } });
  }

  async updateServiceById(id: number, updateData: Prisma.ServiceUpdateInput): Promise<Service> {
    const service = await this.getServiceById(id);
    if (!service) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
    }

    if (updateData.code) {
      const existing = await this.prisma.service.findFirst({
        where: { code: updateData.code as string, NOT: { id } }
      });
      if (existing) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Service code already exists');
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: updateData
    });
  }

  async deleteServiceById(id: number): Promise<Service> {
    const service = await this.getServiceById(id);
    if (!service) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
    }

    const transactionCount = await this.prisma.folioTransaction.count({
      where: { serviceId: id }
    });
    if (transactionCount > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete service with transactions');
    }

    return this.prisma.service.delete({ where: { id } });
  }

  // ==================== Payment Method ====================

  async createPaymentMethod(data: {
    code: string;
    name: string;
    transactionFee?: number;
  }): Promise<PaymentMethod> {
    if (await this.prisma.paymentMethod.findUnique({ where: { code: data.code } })) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Payment method code already exists');
    }
    return this.prisma.paymentMethod.create({ data });
  }

  async queryPaymentMethods(
    filter: Prisma.PaymentMethodWhereInput,
    options: {
      limit?: number;
      page?: number;
      sortBy?: string;
      sortType?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<PaymentMethod>> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const sortBy = options.sortBy ?? 'name';
    const sortType = options.sortType ?? 'asc';

    const [methods, total] = await Promise.all([
      this.prisma.paymentMethod.findMany({
        where: filter,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortType }
      }),
      this.prisma.paymentMethod.count({ where: filter })
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
  }

  async getPaymentMethodById(id: number): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findUnique({ where: { id } });
  }

  async updatePaymentMethodById(
    id: number,
    updateData: Prisma.PaymentMethodUpdateInput
  ): Promise<PaymentMethod> {
    const method = await this.getPaymentMethodById(id);
    if (!method) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment method not found');
    }

    if (updateData.code) {
      const existing = await this.prisma.paymentMethod.findFirst({
        where: { code: updateData.code as string, NOT: { id } }
      });
      if (existing) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Payment method code already exists');
      }
    }

    return this.prisma.paymentMethod.update({
      where: { id },
      data: updateData
    });
  }

  async deletePaymentMethodById(id: number): Promise<PaymentMethod> {
    const method = await this.getPaymentMethodById(id);
    if (!method) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Payment method not found');
    }

    const transactionCount = await this.prisma.folioTransaction.count({
      where: { paymentMethodId: id }
    });
    if (transactionCount > 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete payment method with transactions');
    }

    return this.prisma.paymentMethod.delete({ where: { id } });
  }
}

export default ServiceService;
