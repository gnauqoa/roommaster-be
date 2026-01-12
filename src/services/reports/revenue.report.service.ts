import { PrismaClient, BookingStatus, TransactionStatus } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(quarterOfYear);

export interface RevenueSummaryFilters {
  fromDate: string;
  toDate: string;
  groupBy: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface RevenueByRoomTypeFilters {
  fromDate: string;
  toDate: string;
}

/**
 * Revenue Report Service
 * Handles revenue and financial analytics
 */
@Injectable()
export class RevenueReportService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * API 5.1: Revenue Summary
   * Returns comprehensive revenue summary with key metrics
   */
  async getRevenueSummary(filters: RevenueSummaryFilters) {
    const { fromDate, toDate, groupBy } = filters;

    const startDate = dayjs(fromDate).startOf('day');
    const endDate = dayjs(toDate).endOf('day');

    // Get all completed transactions in date range
    const transactions = await this.prisma.transaction.findMany({
      where: {
        occurredAt: {
          gte: startDate.toDate(),
          lte: endDate.toDate()
        },
        status: TransactionStatus.COMPLETED
      },
      include: {
        booking: {
          include: {
            bookingRooms: true
          }
        },
        details: {
          include: {
            bookingRoom: {
              include: {
                roomType: true
              }
            },
            serviceUsage: {
              include: {
                service: true
              }
            }
          }
        }
      }
    });

    // Calculate total revenue
    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Separate room and service revenue
    let roomRevenue = 0;
    let serviceRevenue = 0;

    transactions.forEach((transaction) => {
      transaction.details.forEach((detail) => {
        if (detail.bookingRoomId) {
          roomRevenue += Number(detail.amount);
        } else if (detail.serviceUsageId) {
          serviceRevenue += Number(detail.amount);
        }
      });
    });

    // Get booking stats
    const bookings = await this.prisma.booking.findMany({
      where: {
        checkInDate: {
          gte: startDate.toDate(),
          lte: endDate.toDate()
        },
        status: {
          in: [BookingStatus.CHECKED_OUT, BookingStatus.CHECKED_IN]
        }
      },
      include: {
        bookingRooms: true
      }
    });

    const totalBookings = bookings.length;
    const totalRoomNights = bookings.reduce((sum, booking) => {
      return (
        sum +
        booking.bookingRooms.reduce((rSum, br) => {
          const nights = dayjs(br.checkOutDate).diff(dayjs(br.checkInDate), 'day');
          return rSum + nights;
        }, 0)
      );
    }, 0);

    // Get total available room nights
    const totalRooms = await this.prisma.room.count();
    const totalDays = endDate.diff(startDate, 'day') + 1;
    const totalAvailableRoomNights = totalRooms * totalDays;

    // Calculate key metrics
    const occupancyRate =
      totalAvailableRoomNights > 0 ? (totalRoomNights / totalAvailableRoomNights) * 100 : 0;

    const averageDailyRate = totalRoomNights > 0 ? roomRevenue / totalRoomNights : 0;

    const revenuePerAvailableRoom =
      totalAvailableRoomNights > 0 ? roomRevenue / totalAvailableRoomNights : 0;

    // Group by time period
    const breakdown = this.groupRevenueByPeriod(transactions, startDate, endDate, groupBy);

    return {
      period: {
        fromDate: startDate.format('YYYY-MM-DD'),
        toDate: endDate.format('YYYY-MM-DD'),
        groupBy
      },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        roomRevenue: Math.round(roomRevenue * 100) / 100,
        serviceRevenue: Math.round(serviceRevenue * 100) / 100,
        totalBookings,
        totalRoomNights,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        averageDailyRate: Math.round(averageDailyRate * 100) / 100,
        revenuePerAvailableRoom: Math.round(revenuePerAvailableRoom * 100) / 100
      },
      breakdown
    };
  }

  /**
   * Helper: Group revenue by time period
   */
  private groupRevenueByPeriod(
    transactions: any[],
    startDate: dayjs.Dayjs,
    endDate: dayjs.Dayjs,
    groupBy: string
  ) {
    const periods: Record<string, any> = {};
    let current = startDate.clone();

    // Initialize periods
    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      let periodKey: string;
      let nextPeriod: dayjs.Dayjs;

      switch (groupBy) {
        case 'week':
          periodKey = current.format('YYYY-[W]WW');
          nextPeriod = current.add(1, 'week');
          break;
        case 'month':
          periodKey = current.format('YYYY-MM');
          nextPeriod = current.add(1, 'month');
          break;
        case 'quarter':
          periodKey = `${current.year()}-Q${current.quarter()}`;
          nextPeriod = current.add(1, 'quarter');
          break;
        case 'year':
          periodKey = current.format('YYYY');
          nextPeriod = current.add(1, 'year');
          break;
        default: // day
          periodKey = current.format('YYYY-MM-DD');
          nextPeriod = current.add(1, 'day');
      }

      periods[periodKey] = {
        date: current.format('YYYY-MM-DD'),
        period: periodKey,
        revenue: 0,
        bookings: 0
      };

      current = nextPeriod;
    }

    // Populate with actual data
    transactions.forEach((transaction) => {
      const transactionDate = dayjs(transaction.occurredAt);
      let periodKey: string;

      switch (groupBy) {
        case 'week':
          periodKey = transactionDate.format('YYYY-[W]WW');
          break;
        case 'month':
          periodKey = transactionDate.format('YYYY-MM');
          break;
        case 'quarter':
          periodKey = `${transactionDate.year()}-Q${transactionDate.quarter()}`;
          break;
        case 'year':
          periodKey = transactionDate.format('YYYY');
          break;
        default:
          periodKey = transactionDate.format('YYYY-MM-DD');
      }

      if (periods[periodKey]) {
        periods[periodKey].revenue += Number(transaction.amount);
        if (transaction.bookingId) {
          periods[periodKey].bookings++;
        }
      }
    });

    return Object.values(periods).map((p: any) => ({
      ...p,
      revenue: Math.round(p.revenue * 100) / 100
    }));
  }

  /**
   * API 5.2: Revenue by Room Type
   * Returns revenue breakdown by room type
   */
  async getRevenueByRoomType(filters: RevenueByRoomTypeFilters) {
    const { fromDate, toDate } = filters;

    const startDate = dayjs(fromDate).startOf('day').toDate();
    const endDate = dayjs(toDate).endOf('day').toDate();

    const bookingRooms = await this.prisma.bookingRoom.findMany({
      where: {
        checkInDate: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: [BookingStatus.CHECKED_OUT, BookingStatus.CHECKED_IN]
        }
      },
      include: {
        roomType: true,
        transactionDetails: {
          include: {
            transaction: true
          }
        }
      }
    });

    // Group by room type
    const roomTypeStats: Record<string, any> = {};

    bookingRooms.forEach((br) => {
      const rtId = br.roomType.id;
      if (!roomTypeStats[rtId]) {
        roomTypeStats[rtId] = {
          roomTypeId: rtId,
          roomTypeName: br.roomType.name,
          capacity: br.roomType.capacity,
          basePrice: Number(br.roomType.basePrice),
          totalBookings: 0,
          totalRoomNights: 0,
          totalRevenue: 0
        };
      }

      roomTypeStats[rtId].totalBookings++;
      const nights = dayjs(br.checkOutDate).diff(dayjs(br.checkInDate), 'day');
      roomTypeStats[rtId].totalRoomNights += nights;

      // Calculate revenue from this booking room
      const brRevenue = br.transactionDetails.reduce((sum, detail) => {
        if (detail.transaction && detail.transaction.status === TransactionStatus.COMPLETED) {
          return sum + Number(detail.amount);
        }
        return sum;
      }, 0);

      roomTypeStats[rtId].totalRevenue += brRevenue;
    });

    const roomTypes = Object.values(roomTypeStats).map((rt: any) => ({
      ...rt,
      totalRevenue: Math.round(rt.totalRevenue * 100) / 100,
      averageRevenue:
        rt.totalBookings > 0 ? Math.round((rt.totalRevenue / rt.totalBookings) * 100) / 100 : 0,
      averageRevenuePerNight:
        rt.totalRoomNights > 0 ? Math.round((rt.totalRevenue / rt.totalRoomNights) * 100) / 100 : 0
    }));

    // Sort by total revenue
    roomTypes.sort((a, b) => b.totalRevenue - a.totalRevenue);

    const totalRevenue = roomTypes.reduce((sum, rt) => sum + rt.totalRevenue, 0);

    // Add percentage
    roomTypes.forEach((rt) => {
      rt.percentageOfTotal =
        totalRevenue > 0 ? Math.round((rt.totalRevenue / totalRevenue) * 10000) / 100 : 0;
    });

    return {
      fromDate,
      toDate,
      roomTypes,
      summary: {
        totalRoomTypes: roomTypes.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings: roomTypes.reduce((sum, rt) => sum + rt.totalBookings, 0)
      }
    };
  }

  /**
   * API 5.3: Payment Method Distribution
   * Returns distribution of payment methods
   */
  async getPaymentMethodDistribution(filters: { fromDate: string; toDate: string }) {
    const { fromDate, toDate } = filters;

    const startDate = dayjs(fromDate).startOf('day').toDate();
    const endDate = dayjs(toDate).endOf('day').toDate();

    const transactions = await this.prisma.transaction.findMany({
      where: {
        occurredAt: {
          gte: startDate,
          lte: endDate
        },
        status: TransactionStatus.COMPLETED,
        method: {
          not: null
        }
      }
    });

    // Group by payment method
    const methodStats: Record<string, any> = {};

    transactions.forEach((transaction) => {
      const method = transaction.method || 'UNKNOWN';
      if (!methodStats[method]) {
        methodStats[method] = {
          method,
          count: 0,
          totalAmount: 0
        };
      }

      methodStats[method].count++;
      methodStats[method].totalAmount += Number(transaction.amount);
    });

    const distribution = Object.values(methodStats).map((m: any) => ({
      method: m.method,
      count: m.count,
      totalAmount: Math.round(m.totalAmount * 100) / 100,
      averageAmount: Math.round((m.totalAmount / m.count) * 100) / 100,
      percentageByAmount: 0,
      percentageByCount: 0
    }));

    // Sort by total amount
    distribution.sort((a, b) => b.totalAmount - a.totalAmount);

    const totalAmount = distribution.reduce((sum, m) => sum + m.totalAmount, 0);
    const totalCount = distribution.reduce((sum, m) => sum + m.count, 0);

    // Add percentages
    distribution.forEach((m) => {
      m.percentageByAmount =
        totalAmount > 0 ? Math.round((m.totalAmount / totalAmount) * 10000) / 100 : 0;
      m.percentageByCount = totalCount > 0 ? Math.round((m.count / totalCount) * 10000) / 100 : 0;
    });

    return {
      fromDate,
      toDate,
      distribution,
      summary: {
        totalTransactions: totalCount,
        totalAmount: Math.round(totalAmount * 100) / 100
      }
    };
  }

  /**
   * API 5.4: Promotion Effectiveness
   * Returns analysis of promotion usage and effectiveness
   */
  async getPromotionEffectiveness(filters: { fromDate: string; toDate: string }) {
    const { fromDate, toDate } = filters;

    const startDate = dayjs(fromDate).startOf('day').toDate();
    const endDate = dayjs(toDate).endOf('day').toDate();

    // Get used promotions in the date range
    const usedPromotions = await this.prisma.usedPromotion.findMany({
      where: {
        transaction: {
          occurredAt: {
            gte: startDate,
            lte: endDate
          },
          status: TransactionStatus.COMPLETED
        }
      },
      include: {
        promotion: true,
        transaction: {
          include: {
            booking: true
          }
        }
      }
    });

    // Group by promotion
    const promotionStats: Record<string, any> = {};

    usedPromotions.forEach((up) => {
      const pId = up.promotion.id;
      if (!promotionStats[pId]) {
        promotionStats[pId] = {
          promotionId: pId,
          promotionCode: up.promotion.code,
          description: up.promotion.description,
          type: up.promotion.type,
          value: Number(up.promotion.value),
          timesUsed: 0,
          totalDiscountGiven: 0,
          totalRevenueInfluenced: 0,
          bookingsInfluenced: new Set()
        };
      }

      promotionStats[pId].timesUsed++;
      promotionStats[pId].totalDiscountGiven += Number(up.discountAmount);

      if (up.transaction) {
        promotionStats[pId].totalRevenueInfluenced += Number(up.transaction.amount);

        if (up.transaction.bookingId) {
          promotionStats[pId].bookingsInfluenced.add(up.transaction.bookingId);
        }
      }
    });

    const promotions = Object.values(promotionStats).map((p: any) => ({
      promotionId: p.promotionId,
      promotionCode: p.promotionCode,
      description: p.description,
      type: p.type,
      value: p.value,
      timesUsed: p.timesUsed,
      totalDiscountGiven: Math.round(p.totalDiscountGiven * 100) / 100,
      totalRevenueInfluenced: Math.round(p.totalRevenueInfluenced * 100) / 100,
      bookingsInfluenced: p.bookingsInfluenced.size,
      averageDiscountPerUse:
        p.timesUsed > 0 ? Math.round((p.totalDiscountGiven / p.timesUsed) * 100) / 100 : 0,
      roi:
        p.totalDiscountGiven > 0
          ? Math.round((p.totalRevenueInfluenced / p.totalDiscountGiven) * 100) / 100
          : 0
    }));

    // Sort by total revenue influenced
    promotions.sort((a, b) => b.totalRevenueInfluenced - a.totalRevenueInfluenced);

    const totalDiscountGiven = promotions.reduce((sum, p) => sum + p.totalDiscountGiven, 0);
    const totalRevenueInfluenced = promotions.reduce((sum, p) => sum + p.totalRevenueInfluenced, 0);

    return {
      fromDate,
      toDate,
      promotions,
      summary: {
        totalPromotionsUsed: promotions.length,
        totalDiscountGiven: Math.round(totalDiscountGiven * 100) / 100,
        totalRevenueInfluenced: Math.round(totalRevenueInfluenced * 100) / 100,
        overallROI:
          totalDiscountGiven > 0
            ? Math.round((totalRevenueInfluenced / totalDiscountGiven) * 100) / 100
            : 0
      }
    };
  }
}
