import express from 'express';
import validate from 'middlewares/validate';
import { usageServiceValidation } from 'validations';
import CustomerUsageServiceController from 'controllers/customer/customer.usage-service.controller';
import { container, TOKENS } from 'core/container';
import { UsageServiceService } from 'services/usage-service.service';
import { authCustomer } from 'middlewares/auth';

const router = express.Router();

// Resolve dependencies from container
const usageServiceService = container.resolve<UsageServiceService>(TOKENS.UsageServiceService);
const customerUsageServiceController = new CustomerUsageServiceController(usageServiceService);

/**
 * @swagger
 * tags:
 *   name: Customer Services
 *   description: Customer service usage management endpoints (DEPRECATED - Employee only)
 */

/**
 * @swagger
 * /customer/service/service-usage:
 *   post:
 *     summary: Create a service usage record (DEPRECATED)
 *     description: Service usage creation is now employee-only. Customers should contact staff.
 *     deprecated: true
 *     tags: [Customer Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       501:
 *         description: Service usage is now employee-only
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
 *     description: Service usage updates are now employee-only. Customers should contact staff.
 *     deprecated: true
 *     tags: [Customer Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       501:
 *         description: Service usage updates are now employee-only
 */
router.patch(
  '/service-usage/:id',
  authCustomer,
  validate(usageServiceValidation.updateServiceUsage),
  customerUsageServiceController.updateServiceUsage
);

export default router;
