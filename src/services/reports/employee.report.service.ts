import { PrismaClient, ActivityType } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import dayjs from 'dayjs';

export interface EmployeePerformanceFilters {
  employeeId?: string;
  fromDate: string;
  toDate: string;
  sortBy?: 'totalBookings' | 'totalRevenue' | 'totalTransactions';
  sortOrder?: 'asc' | 'desc';
}

export interface EmployeeServicePerformanceFilters {
  employeeId?: string;
  fromDate: string;
  toDate: string;
}

export interface EmployeeActivityFilters {
  employeeId?: string;
  fromDate?: string;
  toDate?: string;
  activityTypes?: ActivityType[];
}

/**
 * Employee Performance Report Service
 * Handles employee performance analytics and reports
 */
@Injectable()
export class EmployeeReportService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * API 3.1: Employee Booking Performance
   * Returns employee performance metrics based on booking operations
   */
  async getEmployeeBookingPerformance(filters: EmployeePerformanceFilters) {
    const { employeeId, fromDate, toDate, sortBy = 'totalRevenue', sortOrder = 'desc' } = filters;

    const startDate = dayjs(fromDate).startOf('day').toDate();
    const endDate = dayjs(toDate).endOf('day').toDate();

    const whereClause: any = {};
    if (employeeId) {
      whereClause.id = employeeId;
    }

    const employees = await this.prisma.employee.findMany({
      where: whereClause,
      include: {
        roleRef: true,
        transactions: {
          where: {
            occurredAt: {
              gte: startDate,
              lte: endDate
            },
            status: 'COMPLETED'
          },
          include: {
            booking: {
              include: {
                bookingRooms: {
                  where: {
                    actualCheckIn: {
                      gte: startDate,
                      lte: endDate
                    }
                  }
                }
              }
            }
          }
        },
        activities: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            },
            type: {
              in: [
                ActivityType.CHECKED_IN,
                ActivityType.CHECKED_OUT,
                ActivityType.CREATE_BOOKING,
                ActivityType.UPDATE_BOOKING
              ]
            }
          }
        }
      }
    });

    const performanceData = employees.map((employee) => {
      // Count check-ins and check-outs
      const checkIns = employee.activities.filter((a) => a.type === ActivityType.CHECKED_IN).length;

      const checkOuts = employee.activities.filter(
        (a) => a.type === ActivityType.CHECKED_OUT
      ).length;

      const bookingsCreated = employee.activities.filter(
        (a) => a.type === ActivityType.CREATE_BOOKING
      ).length;

      // Calculate total revenue processed
      const totalRevenue = employee.transactions.reduce(
        (sum, transaction) => sum + Number(transaction.amount),
        0
      );

      // Get unique bookings
      const uniqueBookingIds = new Set(
        employee.transactions.filter((t) => t.bookingId).map((t) => t.bookingId)
      );

      return {
        employeeId: employee.id,
        name: employee.name,
        username: employee.username,
        role: employee.roleRef?.name || 'N/A',
        totalBookingsProcessed: uniqueBookingIds.size,
        totalBookingsCreated: bookingsCreated,
        totalCheckIns: checkIns,
        totalCheckOuts: checkOuts,
        totalTransactions: employee.transactions.length,
        totalRevenueProcessed: Math.round(totalRevenue * 100) / 100,
        averageTransactionValue:
          employee.transactions.length > 0
            ? Math.round((totalRevenue / employee.transactions.length) * 100) / 100
            : 0
      };
    });

    // Sort
    performanceData.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'totalBookings':
          aVal = a.totalBookingsProcessed;
          bVal = b.totalBookingsProcessed;
          break;
        case 'totalTransactions':
          aVal = a.totalTransactions;
          bVal = b.totalTransactions;
          break;
        case 'totalRevenue':
        default:
          aVal = a.totalRevenueProcessed;
          bVal = b.totalRevenueProcessed;
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return {
      fromDate,
      toDate,
      employees: performanceData,
      summary: {
        totalEmployees: performanceData.length,
        totalBookingsProcessed: performanceData.reduce(
          (sum, e) => sum + e.totalBookingsProcessed,
          0
        ),
        totalRevenueProcessed:
          Math.round(performanceData.reduce((sum, e) => sum + e.totalRevenueProcessed, 0) * 100) /
          100,
        totalCheckIns: performanceData.reduce((sum, e) => sum + e.totalCheckIns, 0),
        totalCheckOuts: performanceData.reduce((sum, e) => sum + e.totalCheckOuts, 0)
      }
    };
  }

  /**
   * API 3.2: Employee Service Performance
   * Returns employee performance based on service usage handling
   */
  async getEmployeeServicePerformance(filters: EmployeeServicePerformanceFilters) {
    const { employeeId, fromDate, toDate } = filters;

    const startDate = dayjs(fromDate).startOf('day').toDate();
    const endDate = dayjs(toDate).endOf('day').toDate();

    const whereClause: any = {};
    if (employeeId) {
      whereClause.id = employeeId;
    }

    const employees = await this.prisma.employee.findMany({
      where: whereClause,
      include: {
        roleRef: true,
        serviceUsages: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            service: true
          }
        }
      }
    });

    const servicePerformance = employees.map((employee) => {
      const totalServices = employee.serviceUsages.length;

      const totalServiceRevenue = employee.serviceUsages.reduce(
        (sum, usage) => sum + Number(usage.totalPrice),
        0
      );

      const totalServicesPaid = employee.serviceUsages.reduce(
        (sum, usage) => sum + Number(usage.totalPaid),
        0
      );

      // Group by service type
      const serviceBreakdown: Record<string, any> = {};
      employee.serviceUsages.forEach((usage) => {
        const serviceName = usage.service.name;
        if (!serviceBreakdown[serviceName]) {
          serviceBreakdown[serviceName] = {
            serviceName,
            count: 0,
            totalRevenue: 0
          };
        }
        serviceBreakdown[serviceName].count += usage.quantity;
        serviceBreakdown[serviceName].totalRevenue += Number(usage.totalPrice);
      });

      const topServices = Object.values(serviceBreakdown)
        .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5)
        .map((s: any) => ({
          serviceName: s.serviceName,
          count: s.count,
          totalRevenue: Math.round(s.totalRevenue * 100) / 100
        }));

      return {
        employeeId: employee.id,
        name: employee.name,
        username: employee.username,
        role: employee.roleRef?.name || 'N/A',
        totalServicesProvided: totalServices,
        totalServiceRevenue: Math.round(totalServiceRevenue * 100) / 100,
        totalServicesPaid: Math.round(totalServicesPaid * 100) / 100,
        averageServiceValue:
          totalServices > 0 ? Math.round((totalServiceRevenue / totalServices) * 100) / 100 : 0,
        topServices
      };
    });

    // Sort by total service revenue
    servicePerformance.sort((a, b) => b.totalServiceRevenue - a.totalServiceRevenue);

    return {
      fromDate,
      toDate,
      employees: servicePerformance,
      summary: {
        totalEmployees: servicePerformance.length,
        totalServicesProvided: servicePerformance.reduce(
          (sum, e) => sum + e.totalServicesProvided,
          0
        ),
        totalServiceRevenue:
          Math.round(servicePerformance.reduce((sum, e) => sum + e.totalServiceRevenue, 0) * 100) /
          100
      }
    };
  }

  /**
   * API 3.3: Employee Activity Log Summary
   * Returns summary of employee activities by type
   */
  async getEmployeeActivitySummary(filters: EmployeeActivityFilters) {
    const { employeeId, fromDate, toDate, activityTypes } = filters;

    const whereClause: any = {};

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) {
        whereClause.createdAt.gte = dayjs(fromDate).startOf('day').toDate();
      }
      if (toDate) {
        whereClause.createdAt.lte = dayjs(toDate).endOf('day').toDate();
      }
    }

    if (activityTypes && activityTypes.length > 0) {
      whereClause.type = { in: activityTypes };
    }

    const activities = await this.prisma.activity.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            roleRef: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group by employee
    const employeeActivities: Record<string, any> = {};

    activities.forEach((activity) => {
      if (!activity.employee) return;

      const empId = activity.employee.id;
      if (!employeeActivities[empId]) {
        employeeActivities[empId] = {
          employeeId: empId,
          name: activity.employee.name,
          username: activity.employee.username,
          role: activity.employee.roleRef?.name || 'N/A',
          totalActivities: 0,
          activityBreakdown: {} as Record<string, number>
        };
      }

      employeeActivities[empId].totalActivities++;
      const activityType = activity.type;
      if (!employeeActivities[empId].activityBreakdown[activityType]) {
        employeeActivities[empId].activityBreakdown[activityType] = 0;
      }
      employeeActivities[empId].activityBreakdown[activityType]++;
    });

    const employeeList = Object.values(employeeActivities).sort(
      (a: any, b: any) => b.totalActivities - a.totalActivities
    );

    // Activity type summary
    const activityTypeSummary: Record<string, number> = {};
    activities.forEach((activity) => {
      if (!activityTypeSummary[activity.type]) {
        activityTypeSummary[activity.type] = 0;
      }
      activityTypeSummary[activity.type]++;
    });

    return {
      fromDate: fromDate || 'All time',
      toDate: toDate || 'Present',
      totalActivities: activities.length,
      employees: employeeList,
      activityTypeSummary: Object.entries(activityTypeSummary)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
    };
  }
}
