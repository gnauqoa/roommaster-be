import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import catchAsync from '@/utils/catchAsync';
import { sendData } from '@/utils/responseWrapper';
import {
  RoomAvailabilityReportService,
  CustomerReportService,
  EmployeeReportService,
  ServiceReportService,
  RevenueReportService
} from '@/services/reports';

/**
 * Report Controller for Employee endpoints
 * Handles all report-related API requests
 */
@Injectable()
export class ReportController {
  constructor(
    private readonly roomAvailabilityReportService: RoomAvailabilityReportService,
    private readonly customerReportService: CustomerReportService,
    private readonly employeeReportService: EmployeeReportService,
    private readonly serviceReportService: ServiceReportService,
    private readonly revenueReportService: RevenueReportService
  ) {}

  // ==================== ROOM AVAILABILITY REPORTS ====================

  /**
   * GET /api/v1/employee/reports/rooms/availability
   * Check room availability at specific time
   */
  checkRoomAvailability = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      checkInDate: req.query.checkInDate as string,
      checkOutDate: req.query.checkOutDate as string,
      roomTypeId: req.query.roomTypeId as string | undefined,
      capacity: req.query.capacity ? parseInt(req.query.capacity as string) : undefined,
      floor: req.query.floor ? parseInt(req.query.floor as string) : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined
    };

    const result = await this.roomAvailabilityReportService.checkRoomAvailability(filters);
    sendData(res, result);
  });

  /**
   * GET /api/v1/employee/reports/rooms/occupancy-forecast
   * Get room occupancy forecast
   */
  getOccupancyForecast = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      groupBy: (req.query.groupBy as 'day' | 'week' | 'month') || 'day'
    };

    const result = await this.roomAvailabilityReportService.getOccupancyForecast(filters);
    sendData(res, result);
  });

  // ==================== CUSTOMER REPORTS ====================

  /**
   * GET /api/v1/employee/reports/customers/stay-history
   * Get customer stay history
   */
  getCustomerStayHistory = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
      rankId: req.query.rankId as string | undefined,
      minStays: req.query.minStays ? parseInt(req.query.minStays as string) : undefined,
      minTotalSpent: req.query.minTotalSpent
        ? parseFloat(req.query.minTotalSpent as string)
        : undefined,
      sortBy: (req.query.sortBy as 'totalSpent' | 'totalStays' | 'lastVisit') || 'totalSpent',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    const result = await this.customerReportService.getCustomerStayHistory(filters);
    sendData(res, result);
  });

  /**
   * GET /api/v1/employee/reports/customers/first-time-guests
   * Get first-time guests
   */
  getFirstTimeGuests = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    const result = await this.customerReportService.getFirstTimeGuests(filters);
    sendData(res, result);
  });

  /**
   * GET /api/v1/employee/reports/customers/lifetime-value
   * Get customer lifetime value
   */
  getCustomerLifetimeValue = catchAsync(async (req: Request, res: Response) => {
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    };

    const result = await this.customerReportService.getCustomerLifetimeValue(options);
    sendData(res, result);
  });

  /**
   * GET /api/v1/employee/reports/customers/rank-distribution
   * Get customer rank distribution
   */
  getCustomerRankDistribution = catchAsync(async (req: Request, res: Response) => {
    const result = await this.customerReportService.getCustomerRankDistribution();
    sendData(res, result);
  });

  // ==================== EMPLOYEE REPORTS ====================

  /**
   * GET /api/v1/employee/reports/employees/booking-performance
   * Get employee booking performance
   */
  getEmployeeBookingPerformance = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      employeeId: req.query.employeeId as string | undefined,
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
      sortBy:
        (req.query.sortBy as 'totalBookings' | 'totalRevenue' | 'totalTransactions') ||
        'totalRevenue',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    };

    const result = await this.employeeReportService.getEmployeeBookingPerformance(filters);
    sendData(res, result);
  });

  /**
   * GET /api/v1/employee/reports/employees/service-performance
   * Get employee service performance
   */
  getEmployeeServicePerformance = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      employeeId: req.query.employeeId as string | undefined,
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string
    };

    const result = await this.employeeReportService.getEmployeeServicePerformance(filters);
    sendData(res, result);
  });

  /**
   * GET /api/v1/employee/reports/employees/activity-summary
   * Get employee activity summary
   */
  getEmployeeActivitySummary = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      employeeId: req.query.employeeId as string | undefined,
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
      activityTypes: req.query.activityTypes
        ? ((req.query.activityTypes as string).split(',') as any[])
        : undefined
    };

    const result = await this.employeeReportService.getEmployeeActivitySummary(filters);
    sendData(res, result);
  });

  // ==================== SERVICE REPORTS ====================

  /**
   * GET /api/v1/employee/reports/services/usage-statistics
   * Get service usage statistics
   */
  getServiceUsageStatistics = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
      serviceId: req.query.serviceId as string | undefined,
      status: req.query.status as any
    };

    const result = await this.serviceReportService.getServiceUsageStatistics(filters);
    sendData(res, result);
  });

  /**
   * GET /api/v1/employee/reports/services/top-by-revenue
   * Get top services by revenue
   */
  getTopServicesByRevenue = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    const result = await this.serviceReportService.getTopServicesByRevenue(filters);
    sendData(res, result);
  });

  /**
   * GET /api/v1/employee/reports/services/trend
   * Get service performance trend
   */
  getServicePerformanceTrend = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
      serviceId: req.query.serviceId as string | undefined,
      groupBy: (req.query.groupBy as 'day' | 'week' | 'month') || 'day'
    };

    const result = await this.serviceReportService.getServicePerformanceTrend(filters);
    sendData(res, result);
  });

  // ==================== REVENUE REPORTS ====================

  /**
   * GET /api/v1/employee/reports/revenue/summary
   * Get revenue summary
   */
  getRevenueSummary = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string,
      groupBy: (req.query.groupBy as 'day' | 'week' | 'month' | 'quarter' | 'year') || 'day'
    };

    const result = await this.revenueReportService.getRevenueSummary(filters);
    sendData(res, result);
  });

  /**
   * GET /api/v1/employee/reports/revenue/by-room-type
   * Get revenue by room type
   */
  getRevenueByRoomType = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string
    };

    const result = await this.revenueReportService.getRevenueByRoomType(filters);
    sendData(res, result);
  });

  /**
   * GET /api/v1/employee/reports/revenue/payment-methods
   * Get payment method distribution
   */
  getPaymentMethodDistribution = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string
    };

    const result = await this.revenueReportService.getPaymentMethodDistribution(filters);
    sendData(res, result);
  });

  /**
   * GET /api/v1/employee/reports/revenue/promotions
   * Get promotion effectiveness
   */
  getPromotionEffectiveness = catchAsync(async (req: Request, res: Response) => {
    const filters = {
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string
    };

    const result = await this.revenueReportService.getPromotionEffectiveness(filters);
    sendData(res, result);
  });
}

export default ReportController;
