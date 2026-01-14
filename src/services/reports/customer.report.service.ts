import { PrismaClient, Prisma, BookingStatus } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import dayjs from 'dayjs';

export interface CustomerStayHistoryFilters {
  fromDate?: string;
  toDate?: string;
  rankId?: string;
  minStays?: number;
  minTotalSpent?: number;
  sortBy?: 'totalSpent' | 'totalStays' | 'lastVisit';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface FirstTimeGuestsFilters {
  fromDate: string;
  toDate: string;
  page?: number;
  limit?: number;
}

/**
 * Customer Report Service
 * Handles customer-related reports and analytics
 */
@Injectable()
export class CustomerReportService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * API 2.1: Customer Stay History
   * Returns list of customers who have stayed with history details
   */
  async getCustomerStayHistory(filters: CustomerStayHistoryFilters) {
    const {
      fromDate,
      toDate,
      rankId,
      minStays,
      minTotalSpent,
      sortBy = 'totalSpent',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = filters;

    const skip = (page - 1) * limit;

    // Build date filter for bookings
    const dateFilter: any = {};
    if (fromDate) {
      dateFilter.gte = dayjs(fromDate).toDate();
    }
    if (toDate) {
      dateFilter.lte = dayjs(toDate).endOf('day').toDate();
    }

    // Get customers with their bookings
    const whereClause: Prisma.CustomerWhereInput = {
      ...(rankId && { rankId }),
      bookings: {
        some: {
          status: {
            in: [BookingStatus.CHECKED_OUT, BookingStatus.CHECKED_IN]
          },
          ...(Object.keys(dateFilter).length > 0 && {
            checkInDate: dateFilter
          })
        }
      }
    };

    const customers = await this.prisma.customer.findMany({
      where: whereClause,
      include: {
        rank: true,
        bookings: {
          where: {
            status: {
              in: [BookingStatus.CHECKED_OUT, BookingStatus.CHECKED_IN]
            },
            ...(Object.keys(dateFilter).length > 0 && {
              checkInDate: dateFilter
            })
          },
          include: {
            transactions: {
              where: {
                status: 'COMPLETED'
              }
            }
          }
        }
      }
    });

    // Calculate statistics for each customer
    const customersWithStats = customers.map((customer) => {
      const totalStays = customer.bookings.length;
      const totalSpent = customer.bookings.reduce((sum, booking) => {
        const bookingTotal = booking.transactions
          .filter((t) => t.status === 'COMPLETED')
          .reduce((tSum, transaction) => tSum + Number(transaction.amount), 0);
        return sum + bookingTotal;
      }, 0);

      const sortedBookings = customer.bookings.sort(
        (a, b) => b.checkInDate.getTime() - a.checkInDate.getTime()
      );

      const lastVisitDate = sortedBookings[0]?.checkInDate;
      const firstVisitDate = sortedBookings[sortedBookings.length - 1]?.checkInDate;
      const averageSpendPerStay = totalStays > 0 ? totalSpent / totalStays : 0;

      return {
        customerId: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        rank: customer.rank
          ? {
              id: customer.rank.id,
              name: customer.rank.name,
              minSpending: Number(customer.rank.minSpending)
            }
          : null,
        totalStays,
        totalSpent: Math.round(totalSpent * 100) / 100,
        lastVisitDate: lastVisitDate?.toISOString(),
        firstVisitDate: firstVisitDate?.toISOString(),
        averageSpendPerStay: Math.round(averageSpendPerStay * 100) / 100
      };
    });

    // Apply filters
    let filteredCustomers = customersWithStats;

    if (minStays !== undefined) {
      filteredCustomers = filteredCustomers.filter((c) => c.totalStays >= minStays);
    }

    if (minTotalSpent !== undefined) {
      filteredCustomers = filteredCustomers.filter((c) => c.totalSpent >= minTotalSpent);
    }

    // Sort
    filteredCustomers.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'totalStays':
          aVal = a.totalStays;
          bVal = b.totalStays;
          break;
        case 'lastVisit':
          aVal = a.lastVisitDate ? new Date(a.lastVisitDate).getTime() : 0;
          bVal = b.lastVisitDate ? new Date(b.lastVisitDate).getTime() : 0;
          break;
        case 'totalSpent':
        default:
          aVal = a.totalSpent;
          bVal = b.totalSpent;
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Paginate
    const total = filteredCustomers.length;
    const paginatedCustomers = filteredCustomers.slice(skip, skip + limit);

    return {
      customers: paginatedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * API 2.2: First-Time Guests
   * Returns customers who checked in for the first time in the given period
   */
  async getFirstTimeGuests(filters: FirstTimeGuestsFilters) {
    const { fromDate, toDate, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const startDate = dayjs(fromDate).startOf('day').toDate();
    const endDate = dayjs(toDate).endOf('day').toDate();

    // Get all customers with their first booking
    const customers = await this.prisma.customer.findMany({
      include: {
        rank: true,
        bookings: {
          where: {
            status: {
              in: [BookingStatus.CHECKED_OUT, BookingStatus.CHECKED_IN]
            }
          },
          orderBy: {
            checkInDate: 'asc'
          },
          take: 1
        }
      }
    });

    // Filter customers whose first booking is in the date range
    const firstTimeGuests = customers
      .filter((customer) => {
        if (customer.bookings.length === 0) return false;
        const firstBookingDate = customer.bookings[0].checkInDate;
        return firstBookingDate >= startDate && firstBookingDate <= endDate;
      })
      .map((customer) => ({
        customerId: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        firstCheckInDate: customer.bookings[0].checkInDate.toISOString(),
        bookingCode: customer.bookings[0].bookingCode,
        rank: customer.rank
          ? {
              id: customer.rank.id,
              name: customer.rank.name
            }
          : null
      }));

    // Sort by first check-in date
    firstTimeGuests.sort(
      (a, b) => new Date(b.firstCheckInDate).getTime() - new Date(a.firstCheckInDate).getTime()
    );

    const total = firstTimeGuests.length;
    const paginatedGuests = firstTimeGuests.slice(skip, skip + limit);

    return {
      fromDate,
      toDate,
      firstTimeGuests: paginatedGuests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * API 2.3: Customer Lifetime Value (CLV)
   * Returns top customers by various metrics
   */
  async getCustomerLifetimeValue(options: { limit?: number } = {}) {
    const { limit = 50 } = options;

    const customers = await this.prisma.customer.findMany({
      where: {
        bookings: {
          some: {
            status: {
              in: [BookingStatus.CHECKED_OUT, BookingStatus.CHECKED_IN]
            }
          }
        }
      },
      include: {
        rank: true,
        bookings: {
          where: {
            status: {
              in: [BookingStatus.CHECKED_OUT, BookingStatus.CHECKED_IN]
            }
          },
          include: {
            transactions: {
              where: {
                status: 'COMPLETED'
              }
            }
          },
          orderBy: {
            checkInDate: 'desc'
          }
        }
      }
    });

    const customersWithCLV = customers.map((customer) => {
      const totalStays = customer.bookings.length;
      const totalSpent = customer.bookings.reduce((sum, booking) => {
        const bookingTotal = booking.transactions
          .filter((t) => t.status === 'COMPLETED')
          .reduce((tSum, transaction) => tSum + Number(transaction.amount), 0);
        return sum + bookingTotal;
      }, 0);

      const firstVisit = customer.bookings[customer.bookings.length - 1]?.checkInDate;
      const lastVisit = customer.bookings[0]?.checkInDate;

      // Calculate recency score (days since last visit)
      const daysSinceLastVisit = lastVisit ? dayjs().diff(dayjs(lastVisit), 'day') : 999999;

      // Calculate frequency (visits per month since first visit)
      const monthsSinceFirstVisit = firstVisit
        ? Math.max(1, dayjs().diff(dayjs(firstVisit), 'month'))
        : 1;
      const frequency = totalStays / monthsSinceFirstVisit;

      // CLV Score (simple calculation)
      const clvScore = totalSpent * 0.5 + totalStays * 100 - daysSinceLastVisit * 0.5;

      return {
        customerId: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        rank: customer.rank
          ? {
              id: customer.rank.id,
              name: customer.rank.name
            }
          : null,
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalStays,
        averageSpendPerStay: Math.round((totalSpent / totalStays) * 100) / 100,
        firstVisit: firstVisit?.toISOString(),
        lastVisit: lastVisit?.toISOString(),
        daysSinceLastVisit,
        frequency: Math.round(frequency * 100) / 100,
        clvScore: Math.round(clvScore * 100) / 100
      };
    });

    // Sort by CLV score
    customersWithCLV.sort((a, b) => b.clvScore - a.clvScore);

    const averageCLV =
      customersWithCLV.length === 0
        ? 0
        : Math.round(
            (customersWithCLV.reduce((sum, c) => sum + c.clvScore, 0) / customersWithCLV.length) *
              100
          ) / 100;

    return {
      topCustomersByValue: customersWithCLV.slice(0, limit),
      totalCustomers: customersWithCLV.length,
      averageCLV
    };
  }

  /**
   * API 2.4: Customer Rank Distribution
   * Returns distribution of customers by rank
   */
  async getCustomerRankDistribution() {
    const ranks = await this.prisma.customerRank.findMany({
      include: {
        _count: {
          select: {
            customers: true
          }
        },
        customers: {
          include: {
            bookings: {
              where: {
                status: {
                  in: [BookingStatus.CHECKED_OUT, BookingStatus.CHECKED_IN]
                }
              },
              include: {
                transactions: {
                  where: {
                    status: 'COMPLETED'
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        minSpending: 'asc'
      }
    });

    const totalCustomers = await this.prisma.customer.count();

    const distribution = ranks.map((rank) => {
      const customerCount = rank._count.customers;
      const percentage =
        totalCustomers > 0 ? Math.round((customerCount / totalCustomers) * 10000) / 100 : 0;

      // Calculate total revenue from customers in this rank
      const totalRevenue = rank.customers.reduce((sum, customer) => {
        const customerRevenue = customer.bookings.reduce((bSum, booking) => {
          const bookingRevenue = booking.transactions
            .filter((t) => t.status === 'COMPLETED')
            .reduce((tSum, transaction) => tSum + Number(transaction.amount), 0);
          return bSum + bookingRevenue;
        }, 0);
        return sum + customerRevenue;
      }, 0);

      return {
        rankId: rank.id,
        rankName: rank.name,
        minSpending: Number(rank.minSpending),
        customerCount,
        percentage,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageRevenuePerCustomer:
          customerCount > 0 ? Math.round((totalRevenue / customerCount) * 100) / 100 : 0
      };
    });

    // Customers without rank
    const customersWithoutRank = await this.prisma.customer.count({
      where: {
        rankId: null
      }
    });

    if (customersWithoutRank > 0) {
      distribution.push({
        rankId: 'none',
        rankName: 'No Rank',
        minSpending: 0,
        customerCount: customersWithoutRank,
        percentage: Math.round((customersWithoutRank / totalCustomers) * 10000) / 100,
        totalRevenue: 0,
        averageRevenuePerCustomer: 0
      });
    }

    return {
      totalCustomers,
      distribution
    };
  }
}
