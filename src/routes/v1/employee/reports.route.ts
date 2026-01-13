import express from 'express';
import { container, TOKENS } from '@/core/container';
import { ReportController } from '@/controllers/employee/reports';
import { authEmployee } from '@/middlewares/auth';
import { attachAbilities, canAccessScreen } from '@/middlewares/casl.middleware';
import validate from '@/middlewares/validate';
import { reportValidation } from '@/validations';

export default function createReportRoutes(): express.Router {
  const router = express.Router();
  const reportController = container.resolve<ReportController>(TOKENS.ReportController);

  // Apply auth and CASL abilities to all report routes
  router.use(authEmployee, attachAbilities, canAccessScreen('Reports'));

  /**
   * @swagger
   * tags:
   *   name: Employee Reports
   *   description: Hotel management reports for employees
   */

  // ==================== ROOM AVAILABILITY REPORTS ====================

  /**
   * @swagger
   * /employee/reports/rooms/availability:
   *   get:
   *     summary: Check room availability at specific time
   *     description: Get current room status breakdown (available, occupied, reserved) for a date range
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for availability check (ISO format)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for availability check (ISO format)
   *       - in: query
   *         name: roomTypeId
   *         schema:
   *           type: string
   *         description: Filter by specific room type
   *     responses:
   *       200:
   *         description: Room availability breakdown
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/rooms/availability',
    validate(reportValidation.checkRoomAvailability),
    reportController.checkRoomAvailability
  );

  /**
   * @swagger
   * /employee/reports/rooms/occupancy-forecast:
   *   get:
   *     summary: Get room occupancy forecast
   *     description: Calculate occupancy rate forecast by day, week, or month with detailed breakdown
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for forecast period
   *       - in: query
   *         name: endDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for forecast period
   *       - in: query
   *         name: groupBy
   *         schema:
   *           type: string
   *           enum: [day, week, month]
   *           default: day
   *         description: Grouping interval for forecast
   *     responses:
   *       200:
   *         description: Occupancy forecast with rates and counts
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/rooms/occupancy-forecast',
    validate(reportValidation.getOccupancyForecast),
    reportController.getOccupancyForecast
  );

  // ==================== CUSTOMER REPORTS ====================

  /**
   * @swagger
   * /employee/reports/customers/stay-history:
   *   get:
   *     summary: Get customer stay history
   *     description: List all customers with their booking history, total nights, and spending
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter bookings from this date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter bookings until this date
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *         description: Records per page
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [totalSpent, totalNights, lastStayDate]
   *           default: totalSpent
   *         description: Sort field
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Sort direction
   *     responses:
   *       200:
   *         description: Paginated customer stay history
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/customers/stay-history',
    validate(reportValidation.getCustomerStayHistory),
    reportController.getCustomerStayHistory
  );

  /**
   * @swagger
   * /employee/reports/customers/first-time-guests:
   *   get:
   *     summary: Get first-time guests
   *     description: List customers who made their first booking in the specified period
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Period start date
   *       - in: query
   *         name: endDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Period end date
   *     responses:
   *       200:
   *         description: List of first-time guests with booking details
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/customers/first-time-guests',
    validate(reportValidation.getFirstTimeGuests),
    reportController.getFirstTimeGuests
  );

  /**
   * @swagger
   * /employee/reports/customers/lifetime-value:
   *   get:
   *     summary: Get customer lifetime value (CLV)
   *     description: Calculate CLV for customers with scoring based on spending, frequency, and recency
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: minSpent
   *         schema:
   *           type: number
   *         description: Minimum total spending filter
   *       - in: query
   *         name: minBookings
   *         schema:
   *           type: integer
   *         description: Minimum number of bookings filter
   *     responses:
   *       200:
   *         description: Customer lifetime value analytics with CLV scores
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/customers/lifetime-value',
    validate(reportValidation.getCustomerLifetimeValue),
    reportController.getCustomerLifetimeValue
  );

  /**
   * @swagger
   * /employee/reports/customers/rank-distribution:
   *   get:
   *     summary: Get customer rank distribution
   *     description: Show customer count and revenue breakdown by loyalty rank
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Customer rank distribution with counts and revenue
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/customers/rank-distribution',
    validate(reportValidation.getCustomerRankDistribution),
    reportController.getCustomerRankDistribution
  );

  // ==================== EMPLOYEE REPORTS ====================

  /**
   * @swagger
   * /employee/reports/employees/booking-performance:
   *   get:
   *     summary: Get employee booking performance
   *     description: Track employee performance in check-ins, checkouts, and booking revenue
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period start date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period end date
   *       - in: query
   *         name: employeeId
   *         schema:
   *           type: string
   *         description: Filter by specific employee
   *     responses:
   *       200:
   *         description: Employee booking performance metrics
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/employees/booking-performance',
    validate(reportValidation.getEmployeeBookingPerformance),
    reportController.getEmployeeBookingPerformance
  );

  /**
   * @swagger
   * /employee/reports/employees/service-performance:
   *   get:
   *     summary: Get employee service performance
   *     description: Track employee performance in service delivery and service revenue
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period start date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period end date
   *       - in: query
   *         name: employeeId
   *         schema:
   *           type: string
   *         description: Filter by specific employee
   *     responses:
   *       200:
   *         description: Employee service performance metrics
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/employees/service-performance',
    validate(reportValidation.getEmployeeServicePerformance),
    reportController.getEmployeeServicePerformance
  );

  /**
   * @swagger
   * /employee/reports/employees/activity-summary:
   *   get:
   *     summary: Get employee activity summary
   *     description: Aggregate employee activities by type (check-in, checkout, service, etc.)
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period start date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period end date
   *       - in: query
   *         name: employeeId
   *         schema:
   *           type: string
   *         description: Filter by specific employee
   *       - in: query
   *         name: activityTypes
   *         schema:
   *           type: string
   *         description: Comma-separated activity types (CHECK_IN, CHECK_OUT, SERVICE, etc.)
   *     responses:
   *       200:
   *         description: Employee activity summary by type
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/employees/activity-summary',
    validate(reportValidation.getEmployeeActivitySummary),
    reportController.getEmployeeActivitySummary
  );

  // ==================== SERVICE REPORTS ====================

  /**
   * @swagger
   * /employee/reports/services/usage-statistics:
   *   get:
   *     summary: Get service usage statistics
   *     description: Show service usage count and status breakdown (completed, pending, cancelled)
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period start date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period end date
   *       - in: query
   *         name: serviceId
   *         schema:
   *           type: string
   *         description: Filter by specific service
   *     responses:
   *       200:
   *         description: Service usage statistics with status breakdown
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/services/usage-statistics',
    validate(reportValidation.getServiceUsageStatistics),
    reportController.getServiceUsageStatistics
  );

  /**
   * @swagger
   * /employee/reports/services/top-by-revenue:
   *   get:
   *     summary: Get top services by revenue
   *     description: List highest revenue-generating services with usage count and total revenue
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period start date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period end date
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of top services to return
   *     responses:
   *       200:
   *         description: Top services ranked by revenue
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/services/top-by-revenue',
    validate(reportValidation.getTopServicesByRevenue),
    reportController.getTopServicesByRevenue
  );

  /**
   * @swagger
   * /employee/reports/services/trend:
   *   get:
   *     summary: Get service performance trend
   *     description: Analyze service usage trends over time with growth rate calculations
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Trend period start date
   *       - in: query
   *         name: endDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Trend period end date
   *       - in: query
   *         name: groupBy
   *         schema:
   *           type: string
   *           enum: [day, week, month]
   *           default: month
   *         description: Grouping interval for trend analysis
   *       - in: query
   *         name: serviceId
   *         schema:
   *           type: string
   *         description: Filter by specific service
   *     responses:
   *       200:
   *         description: Service trend data with growth rates
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/services/trend',
    validate(reportValidation.getServicePerformanceTrend),
    reportController.getServicePerformanceTrend
  );

  // ==================== REVENUE REPORTS ====================

  /**
   * @swagger
   * /employee/reports/revenue/summary:
   *   get:
   *     summary: Get revenue summary
   *     description: Calculate key hotel KPIs including ADR (Average Daily Rate), RevPAR (Revenue Per Available Room), and occupancy rate
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period start date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period end date
   *       - in: query
   *         name: groupBy
   *         schema:
   *           type: string
   *           enum: [day, week, month, quarter, year]
   *           default: month
   *         description: Grouping interval for summary
   *     responses:
   *       200:
   *         description: Revenue summary with ADR, RevPAR, occupancy metrics
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/revenue/summary',
    validate(reportValidation.getRevenueSummary),
    reportController.getRevenueSummary
  );

  /**
   * @swagger
   * /employee/reports/revenue/by-room-type:
   *   get:
   *     summary: Get revenue by room type
   *     description: Break down revenue and occupancy metrics by room type
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period start date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period end date
   *     responses:
   *       200:
   *         description: Revenue breakdown by room type with occupancy stats
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/revenue/by-room-type',
    validate(reportValidation.getRevenueByRoomType),
    reportController.getRevenueByRoomType
  );

  /**
   * @swagger
   * /employee/reports/revenue/payment-methods:
   *   get:
   *     summary: Get payment method distribution
   *     description: Show transaction count and total amount by payment method (cash, card, transfer, etc.)
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period start date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period end date
   *     responses:
   *       200:
   *         description: Payment method distribution with percentages
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/revenue/payment-methods',
    validate(reportValidation.getPaymentMethodDistribution),
    reportController.getPaymentMethodDistribution
  );

  /**
   * @swagger
   * /employee/reports/revenue/promotions:
   *   get:
   *     summary: Get promotion effectiveness
   *     description: Analyze promotion ROI, usage count, and revenue impact
   *     tags: [Employee Reports]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period start date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Period end date
   *       - in: query
   *         name: promotionId
   *         schema:
   *           type: string
   *         description: Filter by specific promotion
   *     responses:
   *       200:
   *         description: Promotion effectiveness metrics with ROI calculations
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Requires Reports access
   */
  router.get(
    '/revenue/promotions',
    validate(reportValidation.getPromotionEffectiveness),
    reportController.getPromotionEffectiveness
  );

  return router;
}
