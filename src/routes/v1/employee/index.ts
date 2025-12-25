import express from 'express';
import authRoute from './auth.route';
import profileRoute from './profile.route';
import bookingRoute from './booking.route';
import roomTypeRoute from './roomType.route';
import roomRoute from './room.route';
import hotelServiceRoute from './hotelService.route';
import employeeManagementRoute from './employeeManagement.route';
import customerManagementRoute from './customerManagement.route';

const employeeRoute = express.Router();

employeeRoute.use('/auth', authRoute);
employeeRoute.use('/profile', profileRoute);
employeeRoute.use('/bookings', bookingRoute);
employeeRoute.use('/room-types', roomTypeRoute);
employeeRoute.use('/rooms', roomRoute);
employeeRoute.use('/services', hotelServiceRoute);
employeeRoute.use('/employees', employeeManagementRoute);
employeeRoute.use('/customers', customerManagementRoute);

export default employeeRoute;
