import express from 'express';
import authRoute from './auth.route';
import profileRoute from './profile.route';
import bookingRoute from './booking.route';
import roomTypeRoute from './roomType.route';
import roomRoute from './room.route';
import serviceRoute from './service.route';
import employeeManagementRoute from './employeeManagement.route';
import customerManagementRoute from './customerManagement.route';
import usageServiceRoute from './usage-service.route';
import transactionRoute from './transaction.route';
import promotionRoute from './promotion.route';
import activityRoute from './activity.route';
import roomTagRoute from './roomTag.route';

const employeeRoute = express.Router();

employeeRoute.use('/auth', authRoute);
employeeRoute.use('/profile', profileRoute);
employeeRoute.use('/bookings', bookingRoute);
employeeRoute.use('/room-types', roomTypeRoute);
employeeRoute.use('/rooms', roomRoute);
employeeRoute.use('/services', serviceRoute);
employeeRoute.use('/employees', employeeManagementRoute);
employeeRoute.use('/customers', customerManagementRoute);
employeeRoute.use('/service', usageServiceRoute);
employeeRoute.use('/transactions', transactionRoute);
employeeRoute.use('/promotions', promotionRoute);
employeeRoute.use('/activities', activityRoute);
employeeRoute.use('/room-tags', roomTagRoute);

export default employeeRoute;
