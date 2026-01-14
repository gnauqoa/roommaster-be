import express from 'express';
import CustomerAppSettingController from '@/controllers/customer/customer.app-setting.controller';
import { container, TOKENS } from '@/core/container';
import { AppSettingService } from '@/services';
import { authCustomer } from '@/middlewares/auth';

export default function createCustomerAppSettingRoutes(): express.Router {
  const router = express.Router();

  const appSettingService = container.resolve<AppSettingService>(TOKENS.AppSettingService);
  const customerAppSettingController = new CustomerAppSettingController(appSettingService);

  /**
   * @swagger
   * tags:
   *   name: Customer App Settings
   *   description: App settings retrieval for customers
   */

  /**
   * @swagger
   * /customer/app-settings/payment-qr-code:
   *   get:
   *     summary: Get payment QR code
   *     description: Retrieve the payment QR code configuration
   *     tags: [Customer App Settings]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Payment QR code retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     base64:
   *                       type: string
   *                       description: Base64 encoded image of the QR code
   *       401:
   *         description: Unauthorized
   */
  router.get('/payment-qr-code', authCustomer, customerAppSettingController.getPaymentQrCode);

  return router;
}
