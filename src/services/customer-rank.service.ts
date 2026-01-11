import { PrismaClient, TransactionStatus, ActivityType } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';

@Injectable()
export class CustomerRankService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Get all customer ranks ordered by spending threshold
   */
  async getRanks() {
    return this.prisma.customerRank.findMany({
      orderBy: { minSpending: 'asc' },
      include: {
        _count: {
          select: { customers: true }
        }
      }
    });
  }

  /**
   * Get rank by ID
   */
  async getRankById(id: string) {
    const rank = await this.prisma.customerRank.findUnique({
      where: { id },
      include: {
        _count: {
          select: { customers: true }
        }
      }
    });

    if (!rank) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer rank not found');
    }

    return rank;
  }

  /**
   * Create new customer rank
   */
  async createRank(data: {
    name: string;
    displayName: string;
    description?: string;
    minSpending: number;
    maxSpending?: number;
    benefits?: string;
    color?: string;
  }) {
    // Validate spending range
    if (data.maxSpending && data.maxSpending <= data.minSpending) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Max spending must be greater than min spending');
    }

    return this.prisma.customerRank.create({
      data
    });
  }

  /**
   * Update customer rank
   */
  async updateRank(
    id: string,
    data: {
      name?: string;
      displayName?: string;
      description?: string;
      minSpending?: number;
      maxSpending?: number;
      benefits?: string;
      color?: string;
    }
  ) {
    await this.getRankById(id); // Verify exists

    return this.prisma.customerRank.update({
      where: { id },
      data
    });
  }

  /**
   * Delete customer rank
   */
  async deleteRank(id: string) {
    await this.getRankById(id); // Verify exists

    // Check if any customers have this rank
    const customerCount = await this.prisma.customer.count({
      where: { rankId: id }
    });

    if (customerCount > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Cannot delete rank. ${customerCount} customer(s) currently have this rank`
      );
    }

    await this.prisma.customerRank.delete({
      where: { id }
    });

    return { message: 'Rank deleted successfully' };
  }

  /**
   * Determine appropriate rank based on total spending
   */
  async determineRank(totalSpent: number): Promise<string | null> {
    const rank = await this.prisma.customerRank.findFirst({
      where: {
        AND: [
          { minSpending: { lte: totalSpent } },
          {
            OR: [{ maxSpending: { gte: totalSpent } }, { maxSpending: null }]
          }
        ]
      },
      orderBy: { minSpending: 'desc' }
    });

    return rank?.id || null;
  }

  /**
   * Calculate customer total spending from completed transactions
   */
  async calculateCustomerSpending(customerId: string): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        booking: {
          primaryCustomerId: customerId
        },
        status: TransactionStatus.COMPLETED
      },
      _sum: {
        amount: true
      }
    });

    return Number(result._sum.amount || 0);
  }

  /**
   * Update customer rank based on current spending
   * Returns true if rank changed
   */
  async updateCustomerRank(customerId: string): Promise<boolean> {
    const totalSpent = await this.calculateCustomerSpending(customerId);
    const newRankId = await this.determineRank(totalSpent);

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { rankId: true }
    });

    if (!customer) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
    }

    // Only update if rank changed
    if (customer.rankId !== newRankId) {
      await this.prisma.customer.update({
        where: { id: customerId },
        data: {
          totalSpent,
          rankId: newRankId
        }
      });
      return true;
    }

    // Update totalSpent even if rank didn't change
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { totalSpent }
    });

    return false;
  }

  /**
   * Manually set customer rank (employee action)
   * Creates activity log
   */
  async setCustomerRank(
    customerId: string,
    rankId: string | null,
    employeeId: string
  ): Promise<void> {
    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, fullName: true, rankId: true, rank: true }
    });

    if (!customer) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
    }

    // Verify rank exists if provided
    let newRank = null;
    if (rankId) {
      newRank = await this.getRankById(rankId);
    }

    const oldRank = customer.rank;

    // Update customer rank
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { rankId }
    });

    // Create activity log
    await this.prisma.activity.create({
      data: {
        type: ActivityType.UPDATE_CUSTOMER_RANK,
        customerId,
        employeeId,
        description: `Rank updated from ${oldRank?.displayName || 'None'} to ${
          newRank?.displayName || 'None'
        }`,
        metadata: {
          oldRankId: customer.rankId,
          oldRankName: oldRank?.displayName,
          newRankId: rankId,
          newRankName: newRank?.displayName,
          customerName: customer.fullName
        }
      }
    });
  }

  /**
   * Get rank statistics
   */
  async getRankStatistics() {
    const ranks = await this.prisma.customerRank.findMany({
      orderBy: { minSpending: 'asc' },
      include: {
        _count: {
          select: { customers: true }
        }
      }
    });

    const totalCustomers = await this.prisma.customer.count();
    const customersWithoutRank = await this.prisma.customer.count({
      where: { rankId: null }
    });

    return {
      ranks: ranks.map((rank) => ({
        id: rank.id,
        name: rank.name,
        displayName: rank.displayName,
        customerCount: rank._count.customers,
        percentage: totalCustomers > 0 ? (rank._count.customers / totalCustomers) * 100 : 0
      })),
      totalCustomers,
      customersWithoutRank,
      customersWithRank: totalCustomers - customersWithoutRank
    };
  }
}

export default CustomerRankService;
