import express from 'express';
import createAuthRoute from './auth.route';
import createProfileRoute from './profile.route';
import createBookingRoute from './booking.route';
import createUsageServiceRoute from './usage-service.route';
import createPromotionRoute from './promotion.route';
import createRoomRoute from './room.route';

export default function createCustomerRoutes(): express.Router {
  const router = express.Router();

  router.use('/auth', createAuthRoute());
  router.use('/profile', createProfileRoute());
  router.use('/bookings', createBookingRoute());
  router.use('/service', createUsageServiceRoute());
  router.use('/promotions', createPromotionRoute());
  router.use('/rooms', createRoomRoute());

  return router;
}
