import express from 'express';
import createAuthRoute from './auth.route';
import createProfileRoute from './profile.route';
import createBookingRoute from './booking.route';
import createRoomTypeRoute from './roomType.route';
import createRoomRoute from './room.route';
import createServiceRoute from './service.route';
import createEmployeeManagementRoute from './employeeManagement.route';
import createCustomerManagementRoute from './customerManagement.route';
import createUsageServiceRoute from './usage-service.route';
import createTransactionRoute from './transaction.route';
import createTransactionDetailsRoute from './transaction-details.route';
import createPromotionRoute from './promotion.route';
import createActivityRoute from './activity.route';
import createRoomTagRoute from './roomTag.route';
import createAppSettingRoute from './app-setting.route';
import createPricingRuleRoutes from './pricing-rule.route';
import createCalendarEventRoutes from './calendar-event.route';

export default function createEmployeeRoutes(): express.Router {
  const router = express.Router();

  router.use('/auth', createAuthRoute());
  router.use('/profile', createProfileRoute());
  router.use('/bookings', createBookingRoute());
  router.use('/room-types', createRoomTypeRoute());
  router.use('/rooms', createRoomRoute());
  router.use('/services', createServiceRoute());
  router.use('/employees', createEmployeeManagementRoute());
  router.use('/customers', createCustomerManagementRoute());
  router.use('/service', createUsageServiceRoute());
  router.use('/transactions', createTransactionRoute());
  router.use('/transaction-details', createTransactionDetailsRoute());
  router.use('/promotions', createPromotionRoute());
  router.use('/activities', createActivityRoute());
  router.use('/room-tags', createRoomTagRoute());
  router.use('/app-settings', createAppSettingRoute());
  router.use('/pricing-rules', createPricingRuleRoutes());
  router.use('/calendar-events', createCalendarEventRoutes());

  return router;
}
