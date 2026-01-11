import express from 'express';
import createEmployeeRoutes from './employee';
import createCustomerRoutes from './customer';
import config from '@/config/env';

export default function createV1Routes(): express.Router {
  const router = express.Router();

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     description: Returns the current health status of the API server
   *     tags:
   *       - Health
   *     responses:
   *       200:
   *         description: API is healthy and running
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   *                   description: Health status of the API
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: 2026-01-10T03:14:05.575Z
   *                   description: Current server timestamp
   *                 uptime:
   *                   type: number
   *                   example: 588.595360349
   *                   description: Server uptime in seconds
   *                 environment:
   *                   type: string
   *                   example: development
   *                   enum: [development, production, test]
   *                   description: Current environment
   */
  router.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env
    });
  });

  router.use('/employee', createEmployeeRoutes());
  router.use('/customer', createCustomerRoutes());

  return router;
}
