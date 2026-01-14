import { PrismaClient, ServiceUsageStatus } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import dayjs from 'dayjs';

export interface ServiceUsageStatisticsFilters {
  fromDate: string;
  toDate: string;
  serviceId?: string;
  status?: ServiceUsageStatus;
}

export interface ServiceTrendFilters {
  fromDate: string;
  toDate: string;
  serviceId?: string;
  groupBy?: 'day' | 'week' | 'month';
}

/**
 * Service Report Service
 * Handles service usage reports and analytics
 */
@Injectable()
export class ServiceReportService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * API 4.1: Service Usage Statistics
   * Returns statistics about service usage
   */
  async getServiceUsageStatistics(filters: ServiceUsageStatisticsFilters) {
    const { fromDate, toDate, serviceId, status } = filters;

    const startDate = dayjs(fromDate).startOf('day').toDate();
    const endDate = dayjs(toDate).endOf('day').toDate();

    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (serviceId) {
      whereClause.serviceId = serviceId;
    }

    if (status) {
      whereClause.status = status;
    }

    const serviceUsages = await this.prisma.serviceUsage.findMany({
      where: whereClause,
      include: {
        service: true
      }
    });

    // Group by service
    const serviceStats: Record<string, any> = {};

    serviceUsages.forEach((usage) => {
      const sId = usage.service.id;
      if (!serviceStats[sId]) {
        serviceStats[sId] = {
          serviceId: sId,
          serviceName: usage.service.name,
          unit: usage.service.unit,
          basePrice: Number(usage.service.price),
          totalUsageCount: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          totalPaid: 0,
          averagePrice: 0,
          statusBreakdown: {
            PENDING: 0,
            TRANSFERRED: 0,
            COMPLETED: 0,
            CANCELLED: 0
          }
        };
      }

      serviceStats[sId].totalUsageCount++;
      serviceStats[sId].totalQuantity += usage.quantity;
      serviceStats[sId].totalRevenue += Number(usage.totalPrice);
      serviceStats[sId].totalPaid += Number(usage.totalPaid);
      serviceStats[sId].statusBreakdown[usage.status]++;
    });

    // Calculate averages and sort by revenue
    const services = Object.values(serviceStats).map((s: any) => ({
      ...s,
      totalRevenue: Math.round(s.totalRevenue * 100) / 100,
      totalPaid: Math.round(s.totalPaid * 100) / 100,
      averagePrice:
        s.totalUsageCount > 0 ? Math.round((s.totalRevenue / s.totalUsageCount) * 100) / 100 : 0,
      averageQuantity:
        s.totalUsageCount > 0 ? Math.round((s.totalQuantity / s.totalUsageCount) * 100) / 100 : 0
    }));

    // Add popularity rank
    services.sort((a, b) => b.totalRevenue - a.totalRevenue);
    services.forEach((service, index) => {
      service.popularityRank = index + 1;
    });

    const totalServiceRevenue = services.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalServiceCount = services.reduce((sum, s) => sum + s.totalUsageCount, 0);

    return {
      fromDate,
      toDate,
      services,
      summary: {
        totalServices: services.length,
        totalServiceCount,
        totalServiceRevenue: Math.round(totalServiceRevenue * 100) / 100,
        averageRevenuePerService:
          services.length > 0 ? Math.round((totalServiceRevenue / services.length) * 100) / 100 : 0
      }
    };
  }

  /**
   * API 4.2: Top Services by Revenue
   * Returns top performing services sorted by revenue
   */
  async getTopServicesByRevenue(filters: { fromDate: string; toDate: string; limit?: number }) {
    const { fromDate, toDate, limit = 10 } = filters;

    const statistics = await this.getServiceUsageStatistics({
      fromDate,
      toDate
    });

    const topServices = statistics.services.slice(0, limit).map((service, index) => ({
      rank: index + 1,
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      totalUsageCount: service.totalUsageCount,
      totalQuantity: service.totalQuantity,
      totalRevenue: service.totalRevenue,
      averagePrice: service.averagePrice,
      percentageOfTotal:
        statistics.summary.totalServiceRevenue > 0
          ? Math.round((service.totalRevenue / statistics.summary.totalServiceRevenue) * 10000) /
            100
          : 0
    }));

    return {
      fromDate,
      toDate,
      topServices,
      totalRevenue: statistics.summary.totalServiceRevenue
    };
  }

  /**
   * API 4.3: Service Performance Trend
   * Returns service usage trends over time
   */
  async getServicePerformanceTrend(filters: ServiceTrendFilters) {
    const { fromDate, toDate, serviceId, groupBy = 'day' } = filters;

    const startDate = dayjs(fromDate).startOf('day');
    const endDate = dayjs(toDate).endOf('day');

    const whereClause: any = {
      createdAt: {
        gte: startDate.toDate(),
        lte: endDate.toDate()
      }
    };

    if (serviceId) {
      whereClause.serviceId = serviceId;
    }

    const serviceUsages = await this.prisma.serviceUsage.findMany({
      where: whereClause,
      include: {
        service: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group by time period
    const trendData: Record<string, any> = {};
    let current = startDate.clone();

    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      let periodKey: string;
      let nextPeriod: dayjs.Dayjs;

      if (groupBy === 'week') {
        periodKey = current.format('YYYY-[W]WW');
        nextPeriod = current.add(1, 'week');
      } else if (groupBy === 'month') {
        periodKey = current.format('YYYY-MM');
        nextPeriod = current.add(1, 'month');
      } else {
        periodKey = current.format('YYYY-MM-DD');
        nextPeriod = current.add(1, 'day');
      }

      trendData[periodKey] = {
        period: periodKey,
        date: current.format('YYYY-MM-DD'),
        totalUsageCount: 0,
        totalQuantity: 0,
        totalRevenue: 0,
        services: {} as Record<string, any>
      };

      current = nextPeriod;
    }

    // Populate trend data
    serviceUsages.forEach((usage) => {
      const usageDate = dayjs(usage.createdAt);
      let periodKey: string;

      if (groupBy === 'week') {
        periodKey = usageDate.format('YYYY-[W]WW');
      } else if (groupBy === 'month') {
        periodKey = usageDate.format('YYYY-MM');
      } else {
        periodKey = usageDate.format('YYYY-MM-DD');
      }

      if (trendData[periodKey]) {
        trendData[periodKey].totalUsageCount++;
        trendData[periodKey].totalQuantity += usage.quantity;
        trendData[periodKey].totalRevenue += Number(usage.totalPrice);

        const sId = usage.service.id;
        if (!trendData[periodKey].services[sId]) {
          trendData[periodKey].services[sId] = {
            serviceId: sId,
            serviceName: usage.service.name,
            count: 0,
            quantity: 0,
            revenue: 0
          };
        }

        trendData[periodKey].services[sId].count++;
        trendData[periodKey].services[sId].quantity += usage.quantity;
        trendData[periodKey].services[sId].revenue += Number(usage.totalPrice);
      }
    });

    // Format result
    const trend = Object.values(trendData).map((period: any) => ({
      period: period.period,
      date: period.date,
      totalUsageCount: period.totalUsageCount,
      totalQuantity: period.totalQuantity,
      totalRevenue: Math.round(period.totalRevenue * 100) / 100,
      services: Object.values(period.services).map((s: any) => ({
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        count: s.count,
        quantity: s.quantity,
        revenue: Math.round(s.revenue * 100) / 100
      }))
    }));

    // Calculate growth rates
    const trendWithGrowth = trend.map((item, index) => {
      if (index === 0) {
        return { ...item, growthRate: null };
      }

      const previousRevenue = trend[index - 1].totalRevenue;
      const growthRate =
        previousRevenue > 0
          ? Math.round(((item.totalRevenue - previousRevenue) / previousRevenue) * 10000) / 100
          : null;

      return { ...item, growthRate };
    });

    return {
      fromDate,
      toDate,
      groupBy,
      trend: trendWithGrowth
    };
  }
}
