import express from 'express';
import createEmployeeRoutes from './employee';
import createCustomerRoutes from './customer';

export default function createV1Routes(): express.Router {
  const router = express.Router();

  // Call factory functions to create routers
  router.use('/employee', createEmployeeRoutes());
  router.use('/customer', createCustomerRoutes());

  return router;
}
