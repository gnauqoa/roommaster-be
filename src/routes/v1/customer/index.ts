import express from 'express';
import authRoute from './auth.route';
import profileRoute from './profile.route';
import bookingRoute from './booking.route';
import usageServiceRoute from './usage-service.route';

const customerRoute = express.Router();

customerRoute.use('/auth', authRoute);
customerRoute.use('/profile', profileRoute);
customerRoute.use('/bookings', bookingRoute);
customerRoute.use('/service', usageServiceRoute);

export default customerRoute;
