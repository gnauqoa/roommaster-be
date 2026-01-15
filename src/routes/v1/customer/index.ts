import express from 'express';
import createAuthRoute from './auth.route';
import createProfileRoute from './profile.route';
import createBookingRoute from './booking.route';
import createUsageServiceRoute from './usage-service.route';
import createPromotionRoute from './promotion.route';
import createRoomRoute from './room.route';
import createCustomerRankRoutes from './rank.route';
import createCustomerImageRoutes from './image.route';
import createCustomerAppSettingRoutes from './app-setting.route';
import createAIChatRoutes from './ai-chat.route';

export default function createCustomerRoutes(): express.Router {
  const router = express.Router();

  router.use('/auth', createAuthRoute());
  router.use('/profile', createProfileRoute());
  router.use('/bookings', createBookingRoute());
  router.use('/service', createUsageServiceRoute());
  router.use('/promotions', createPromotionRoute());
  router.use('/rooms', createRoomRoute());
  router.use('/ranks', createCustomerRankRoutes());
  router.use('/app-settings', createCustomerAppSettingRoutes());
  router.use('/ai', createAIChatRoutes()); // AI chat routes
  router.use('/', createCustomerImageRoutes()); // Images are nested under /rooms/:roomId/images and /room-types/:roomTypeId/images

  return router;
}
