import express from 'express';
import authRoute from './auth.route';
import profileRoute from './profile.route';
import bookingRoute from './booking.route';
import usageServiceRoute from './usage-service.route';

const employeeRoute = express.Router();

employeeRoute.use('/auth', authRoute);
employeeRoute.use('/profile', profileRoute);
employeeRoute.use('/bookings', bookingRoute);
employeeRoute.use('/service', usageServiceRoute);

export default employeeRoute;
