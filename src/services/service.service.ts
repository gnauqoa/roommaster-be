import { PrismaClient, Service, Prisma } from '@prisma/client';
import { Injectable } from 'core/decorators';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';

export interface CreateServiceData {
  name: string;
  price: number;
  unit?: string;
  isActive?: boolean;
}

export interface UpdateServiceData {
  name?: string;
  price?: number;
  unit?: string;
  isActive?: boolean;
}

export interface ServiceFilters {
  search?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new service
   * @param {CreateServiceData} serviceData - Service data
   * @returns {Promise<Service>} Created service
   */
  async createService(serviceData: CreateServiceData): Promise<Service> {
    // Check if service with same name already exists
    const existingService = await this.prisma.service.findFirst({
      where: { name: serviceData.name }
    });

    if (existingService) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Service with this name already exists');
    }

    const service = await this.prisma.service.create({
      data: {
        name: serviceData.name,
        price: serviceData.price,
        unit: serviceData.unit || 'lần',
        isActive: serviceData.isActive !== undefined ? serviceData.isActive : true
      }
    });

    return service;
  }

  /**
   * Get all services with filters and pagination
   * @param {ServiceFilters} filters - Filter options
   * @param {PaginationOptions} options - Pagination options
   * @returns {Promise<{ data: Service[]; total: number; page: number; limit: number }>}
   */
  async getAllServices(
    filters: ServiceFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ data: Service[]; total: number; page: number; limit: number }> {
    const { search, isActive, minPrice, maxPrice } = filters;
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = options;

    const where: Prisma.ServiceWhereInput = {};

    // Apply search filter
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Apply isActive filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Apply price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              serviceUsages: true
            }
          }
        }
      }),
      this.prisma.service.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit
    };
  }

  /**
   * Get service by ID
   * @param {string} serviceId - Service ID
   * @returns {Promise<Service>} Service
   */
  async getServiceById(serviceId: string): Promise<Service> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        _count: {
          select: {
            serviceUsages: true
          }
        }
      }
    });

    if (!service) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Service not found');
    }

    return service;
  }

  /**
   * Update service by ID
   * @param {string} serviceId - Service ID
   * @param {UpdateServiceData} updateData - Update data
   * @returns {Promise<Service>} Updated service
   */
  async updateService(serviceId: string, updateData: UpdateServiceData): Promise<Service> {
    await this.getServiceById(serviceId);

    // Check if updating name to an existing name
    if (updateData.name) {
      const existingService = await this.prisma.service.findFirst({
        where: {
          name: updateData.name,
          id: { not: serviceId }
        }
      });

      if (existingService) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Service with this name already exists');
      }
    }

    const updatedService = await this.prisma.service.update({
      where: { id: serviceId },
      data: updateData
    });

    return updatedService;
  }

  /**
   * Delete service by ID
   * @param {string} serviceId - Service ID
   * @returns {Promise<void>}
   */
  async deleteService(serviceId: string): Promise<void> {
    await this.getServiceById(serviceId);

    // Check if service has associated service usages
    const usageCount = await this.prisma.serviceUsage.count({
      where: { serviceId }
    });

    if (usageCount > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Cannot delete service with existing usage records. Please deactivate the service instead.'
      );
    }

    await this.prisma.service.delete({
      where: { id: serviceId }
    });
  }
}

export default ServiceService;
