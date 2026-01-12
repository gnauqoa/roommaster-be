import express from 'express';
import { container, TOKENS } from '@/core/container';
import { ReportController } from '@/controllers/employee/reports';
import { authEmployee } from '@/middlewares/auth';
import { attachAbilities, canAccessScreen } from '@/middlewares/casl.middleware';

export default function createReportRoutes(): express.Router {
  const router = express.Router();
  const reportController = container.resolve<ReportController>(TOKENS.ReportController);

  // Apply auth and CASL abilities to all report routes
  router.use(authEmployee, attachAbilities, canAccessScreen('Reports'));

  // ==================== ROOM AVAILABILITY REPORTS ====================

  /**
   * GET /api/v1/employee/reports/rooms/availability
   * Check room availability at specific time
   */
  router.get('/rooms/availability', reportController.checkRoomAvailability);

  /**
   * GET /api/v1/employee/reports/rooms/occupancy-forecast
   * Room occupancy forecast
   */
  router.get('/rooms/occupancy-forecast', reportController.getOccupancyForecast);

  // ==================== CUSTOMER REPORTS ====================

  /**
   * GET /api/v1/employee/reports/customers/stay-history
   * Get customer stay history
   */
  router.get('/customers/stay-history', reportController.getCustomerStayHistory);

  /**
   * GET /api/v1/employee/reports/customers/first-time-guests
   * Get first-time guests
   */
  router.get('/customers/first-time-guests', reportController.getFirstTimeGuests);

  /**
   * GET /api/v1/employee/reports/customers/lifetime-value
   * Get customer lifetime value
   */
  router.get('/customers/lifetime-value', reportController.getCustomerLifetimeValue);

  /**
   * GET /api/v1/employee/reports/customers/rank-distribution
   * Get customer rank distribution
   */
  router.get('/customers/rank-distribution', reportController.getCustomerRankDistribution);

  // ==================== EMPLOYEE REPORTS ====================

  /**
   * GET /api/v1/employee/reports/employees/booking-performance
   * Get employee booking performance
   */
  router.get('/employees/booking-performance', reportController.getEmployeeBookingPerformance);

  /**
   * GET /api/v1/employee/reports/employees/service-performance
   * Get employee service performance
   */
  router.get('/employees/service-performance', reportController.getEmployeeServicePerformance);

  /**
   * GET /api/v1/employee/reports/employees/activity-summary
   * Get employee activity summary
   */
  router.get('/employees/activity-summary', reportController.getEmployeeActivitySummary);

  // ==================== SERVICE REPORTS ====================

  /**
   * GET /api/v1/employee/reports/services/usage-statistics
   * Get service usage statistics
   */
  router.get('/services/usage-statistics', reportController.getServiceUsageStatistics);

  /**
   * GET /api/v1/employee/reports/services/top-by-revenue
   * Get top services by revenue
   */
  router.get('/services/top-by-revenue', reportController.getTopServicesByRevenue);

  /**
   * GET /api/v1/employee/reports/services/trend
   * Get service performance trend
   */
  router.get('/services/trend', reportController.getServicePerformanceTrend);

  // ==================== REVENUE REPORTS ====================

  /**
   * GET /api/v1/employee/reports/revenue/summary
   * Get revenue summary
   */
  router.get('/revenue/summary', reportController.getRevenueSummary);

  /**
   * GET /api/v1/employee/reports/revenue/by-room-type
   * Get revenue by room type
   */
  router.get('/revenue/by-room-type', reportController.getRevenueByRoomType);

  /**
   * GET /api/v1/employee/reports/revenue/payment-methods
   * Get payment method distribution
   */
  router.get('/revenue/payment-methods', reportController.getPaymentMethodDistribution);

  /**
   * GET /api/v1/employee/reports/revenue/promotions
   * Get promotion effectiveness
   */
  router.get('/revenue/promotions', reportController.getPromotionEffectiveness);

  return router;
}
