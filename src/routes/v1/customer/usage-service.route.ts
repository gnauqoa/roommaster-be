import express from 'express';
import validate from '@/middlewares/validate';
import { usageServiceValidation } from '@/validations';
import CustomerUsageServiceController from '@/controllers/customer/customer.usage-service.controller';
import { container, TOKENS } from '@/core/container';
import { UsageServiceService } from '@/services/usage-service.service';
import { authCustomer } from '@/middlewares/auth';

export default function createUsageServiceRoutes(): express.Router {
  const router = express.Router();

  // Resolve dependencies from container
  const usageServiceService = container.resolve<UsageServiceService>(TOKENS.UsageServiceService);
  const customerUsageServiceController = new CustomerUsageServiceController(usageServiceService);

  /**
   * @swagger
   * tags:
   *   name: Customer Services
   *   description: Customer service usage endpoints (DEPRECATED - Employee only operations)
   */

  /**
   * @swagger
   * /customer/service/service-usage:
   *   post:
   *     summary: Create a service usage record (DEPRECATED)
   *     description: |-
   *       **This endpoint is deprecated and no longer available for customers.**
   *       
   *       Service usage creation is now employee-only for better inventory control.
   *       Customers should contact staff to request services.
   *     deprecated: true
   *     tags: [Customer Services]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       501:
   *         description: Not Implemented - Service usage is now employee-only
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 501
   *                 message:
   *                   type: string
   *                   example: Service usage creation is now employee-only. Please contact staff.
   */
  router.post(
    '/service-usage',
    authCustomer,
    validate(usageServiceValidation.createServiceUsage),
    customerUsageServiceController.createServiceUsage
  );

  /**
   * @swagger
   * /customer/service/service-usage/{id}:
   *   patch:
   *     summary: Update own service usage (DEPRECATED)
   *     description: |-
   *       **This endpoint is deprecated and no longer available for customers.**
   *       
   *       Service usage updates are now employee-only.
   *       Customers should contact staff to modify service requests.
   *     deprecated: true
   *     tags: [Customer Services]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       501:
   *         description: Not Implemented - Service usage updates are now employee-only
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 501
   *                 message:
   *                   type: string
   *                   example: Service usage updates are now employee-only. Please contact staff.
   */
  router.patch(
    '/service-usage/:id',
    authCustomer,
    validate(usageServiceValidation.updateServiceUsage),
    customerUsageServiceController.updateServiceUsage
  );

  return router;
}
