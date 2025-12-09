import express from 'express';
import validate from 'middlewares/validate';
import serviceValidation from 'validations/service.validation';
import { serviceController } from 'controllers';
import auth from 'middlewares/auth';
import { PERMISSIONS } from 'config/roles';

const router = express.Router();

// Services
router
  .route('/')
  .post(
    auth(PERMISSIONS.SERVICE_CREATE),
    validate(serviceValidation.createService),
    serviceController.createService
  )
  .get(
    auth(PERMISSIONS.SERVICE_READ),
    validate(serviceValidation.getServices),
    serviceController.getServices
  );

router
  .route('/:serviceId')
  .get(
    auth(PERMISSIONS.SERVICE_READ),
    validate(serviceValidation.getService),
    serviceController.getService
  )
  .patch(
    auth(PERMISSIONS.SERVICE_UPDATE),
    validate(serviceValidation.updateService),
    serviceController.updateService
  )
  .delete(
    auth(PERMISSIONS.SERVICE_DELETE),
    validate(serviceValidation.deleteService),
    serviceController.deleteService
  );

// Payment Methods
router
  .route('/payment-methods')
  .post(
    auth(PERMISSIONS.SERVICE_CREATE),
    validate(serviceValidation.createPaymentMethod),
    serviceController.createPaymentMethod
  )
  .get(
    auth(PERMISSIONS.SERVICE_READ),
    validate(serviceValidation.getPaymentMethods),
    serviceController.getPaymentMethods
  );

router
  .route('/payment-methods/:methodId')
  .get(
    auth(PERMISSIONS.SERVICE_READ),
    validate(serviceValidation.getPaymentMethod),
    serviceController.getPaymentMethod
  )
  .patch(
    auth(PERMISSIONS.SERVICE_UPDATE),
    validate(serviceValidation.updatePaymentMethod),
    serviceController.updatePaymentMethod
  )
  .delete(
    auth(PERMISSIONS.SERVICE_DELETE),
    validate(serviceValidation.deletePaymentMethod),
    serviceController.deletePaymentMethod
  );

export default router;

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Service and payment method management
 */

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Create a service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateService'
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Get all services
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: serviceGroup
 *         schema:
 *           type: string
 *           enum: [ROOM, FNBV, LAUNDRY, MINIBAR, FACILITY, OTHER]
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /services/payment-methods:
 *   post:
 *     summary: Create a payment method
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentMethod'
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Get all payment methods
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
