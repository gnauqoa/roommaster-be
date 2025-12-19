import { PrismaClient, Prisma } from '@prisma/client';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { Injectable } from 'core/decorators';

@Injectable()
export class CustomerTierService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a customer tier
   */
  async createCustomerTier(data: {
    code: string;
    name: string;
    pointsRequired?: number;
    roomDiscountFactor?: number;
    serviceDiscountFactor?: number;
  }) {
    // Check if tier code already exists
    const existing = await this.prisma.customerTier.findUnique({
      where: { code: data.code }
    });

    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Customer tier code already exists');
    }

    const tier = await this.prisma.customerTier.create({
      data: {
        code: data.code,
        name: data.name,
        pointsRequired: data.pointsRequired || 0,
        roomDiscountFactor: new Prisma.Decimal(data.roomDiscountFactor || 0),
        serviceDiscountFactor: new Prisma.Decimal(data.serviceDiscountFactor || 0)
      }
    });

    return tier;
  }

  /**
   * Query customer tiers
   */
  async queryCustomerTiers(filter: {
    name?: string;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
    limit?: number;
    page?: number;
  }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerTierWhereInput = {};

    if (filter.name) {
      where.name = { contains: filter.name, mode: 'insensitive' };
    }

    const orderBy: Prisma.CustomerTierOrderByWithRelationInput = {};
    if (filter.sortBy) {
      orderBy[filter.sortBy as keyof Prisma.CustomerTierOrderByWithRelationInput] =
        filter.sortType || 'asc';
    } else {
      orderBy.pointsRequired = 'asc';
    }

    const [tiers, total] = await Promise.all([
      this.prisma.customerTier.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { customers: true }
          }
        }
      }),
      this.prisma.customerTier.count({ where })
    ]);

    return {
      results: tiers,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total
    };
  }

  /**
   * Get customer tier by ID
   */
  async getCustomerTierById(tierId: number) {
    const tier = await this.prisma.customerTier.findUnique({
      where: { id: tierId },
      include: {
        _count: {
          select: { customers: true }
        }
      }
    });

    if (!tier) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer tier not found');
    }

    return tier;
  }

  /**
   * Update customer tier
   */
  async updateCustomerTier(
    tierId: number,
    data: {
      name?: string;
      pointsRequired?: number;
      roomDiscountFactor?: number;
      serviceDiscountFactor?: number;
    }
  ) {
    const tier = await this.prisma.customerTier.findUnique({
      where: { id: tierId }
    });

    if (!tier) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer tier not found');
    }

    const updateData: Prisma.CustomerTierUpdateInput = {};

    if (data.name) updateData.name = data.name;
    if (data.pointsRequired !== undefined) updateData.pointsRequired = data.pointsRequired;
    if (data.roomDiscountFactor !== undefined) {
      updateData.roomDiscountFactor = new Prisma.Decimal(data.roomDiscountFactor);
    }
    if (data.serviceDiscountFactor !== undefined) {
      updateData.serviceDiscountFactor = new Prisma.Decimal(data.serviceDiscountFactor);
    }

    const updatedTier = await this.prisma.customerTier.update({
      where: { id: tierId },
      data: updateData
    });

    return updatedTier;
  }

  /**
   * Delete customer tier
   */
  async deleteCustomerTier(tierId: number) {
    const tier = await this.prisma.customerTier.findUnique({
      where: { id: tierId },
      include: {
        _count: {
          select: { customers: true }
        }
      }
    });

    if (!tier) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer tier not found');
    }

    if (tier._count.customers > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot delete tier with ${tier._count.customers} customers assigned`
      );
    }

    await this.prisma.customerTier.delete({
      where: { id: tierId }
    });
  }

  /**
   * Check and upgrade customer tier based on spending/points
   */
  async checkAndUpgradeCustomerTier(customerId: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { tier: true }
    });

    if (!customer) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
    }

    // Get all tiers sorted by points required (descending)
    const tiers = await this.prisma.customerTier.findMany({
      orderBy: { pointsRequired: 'desc' }
    });

    // Find the highest tier the customer qualifies for
    const qualifiedTier = tiers.find((tier) => customer.loyaltyPoints >= tier.pointsRequired);

    if (qualifiedTier && (!customer.tier || qualifiedTier.id !== customer.tier.id)) {
      // Upgrade customer tier
      const updatedCustomer = await this.prisma.customer.update({
        where: { id: customerId },
        data: { tierId: qualifiedTier.id },
        include: { tier: true }
      });

      return {
        upgraded: true,
        previousTier: customer.tier?.name || 'None',
        newTier: qualifiedTier.name,
        customer: updatedCustomer
      };
    }

    return {
      upgraded: false,
      currentTier: customer.tier?.name || 'None',
      customer
    };
  }

  /**
   * Batch check and upgrade all customer tiers
   */
  async batchUpgradeCustomerTiers() {
    const customers = await this.prisma.customer.findMany({
      include: { tier: true }
    });

    const tiers = await this.prisma.customerTier.findMany({
      orderBy: { pointsRequired: 'desc' }
    });

    const upgrades: Array<{
      customerId: number;
      customerName: string;
      fromTier: string;
      toTier: string;
    }> = [];

    for (const customer of customers) {
      const qualifiedTier = tiers.find((tier) => customer.loyaltyPoints >= tier.pointsRequired);

      if (qualifiedTier && (!customer.tier || qualifiedTier.id !== customer.tier.id)) {
        await this.prisma.customer.update({
          where: { id: customer.id },
          data: { tierId: qualifiedTier.id }
        });

        upgrades.push({
          customerId: customer.id,
          customerName: customer.fullName,
          fromTier: customer.tier?.name || 'None',
          toTier: qualifiedTier.name
        });
      }
    }

    return {
      totalCustomers: customers.length,
      upgraded: upgrades.length,
      upgrades
    };
  }
}

export default CustomerTierService;
