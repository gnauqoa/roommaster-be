import express from 'express';
import validate from 'middlewares/validate';
import serviceValidation from 'validations/service.validation';
import { getServiceController } from '../../core/bootstrap';
import auth from 'middlewares/auth';
import { PERMISSIONS } from 'config/roles';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Services
 *     description: Service and payment method management
 */

// ===== SERVICES =====

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Create a new service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - price
 *               - category
 *             properties:
 *               code:
 *                 type: string
 *                 example: "BREAKFAST"
 *               name:
 *                 type: string
 *                 example: "Breakfast"
 *               price:
 *                 type: number
 *                 format: decimal
 *                 example: 15.00
 *               category:
 *                 type: string
 *                 example: "FOOD"
 *               description:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Service created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get all services
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: List of services
 *       "401":
 *         description: Unauthorized
 */
router
  .route('/')
  .post(
    auth(PERMISSIONS.SERVICE_CREATE),
    validate(serviceValidation.createService),
    getServiceController().createService
  )
  .get(
    auth(PERMISSIONS.SERVICE_READ),
    validate(serviceValidation.getServices),
    getServiceController().getServices
  );

/**
 * @swagger
 * /services/{serviceId}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Service details
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Service not found
 *   patch:
 *     summary: Update service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: decimal
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Service updated successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Service not found
 *   delete:
 *     summary: Delete service
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "204":
 *         description: Service deleted successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Service not found
 */
router
  .route('/:serviceId')
  .get(
    auth(PERMISSIONS.SERVICE_READ),
    validate(serviceValidation.getService),
    getServiceController().getService
  )
  .patch(
    auth(PERMISSIONS.SERVICE_UPDATE),
    validate(serviceValidation.updateService),
    getServiceController().updateService
  )
  .delete(
    auth(PERMISSIONS.SERVICE_DELETE),
    validate(serviceValidation.deleteService),
    getServiceController().deleteService
  );

// ===== PAYMENT METHODS =====

/**
 * @swagger
 * /services/payment-methods:
 *   post:
 *     summary: Create a new payment method
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 example: "CASH"
 *               name:
 *                 type: string
 *                 example: "Cash"
 *               description:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Payment method created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get all payment methods
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: List of payment methods
 *       "401":
 *         description: Unauthorized
 */
router
  .route('/payment-methods')
  .post(
    auth(PERMISSIONS.SERVICE_CREATE),
    validate(serviceValidation.createPaymentMethod),
    getServiceController().createPaymentMethod
  )
  .get(
    auth(PERMISSIONS.SERVICE_READ),
    validate(serviceValidation.getPaymentMethods),
    getServiceController().getPaymentMethods
  );

/**
 * @swagger
 * /services/payment-methods/{methodId}:
 *   get:
 *     summary: Get payment method by ID
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: methodId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Payment method details
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Payment method not found
 *   patch:
 *     summary: Update payment method
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: methodId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Payment method updated successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Payment method not found
 *   delete:
 *     summary: Delete payment method
 *     tags: [Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: methodId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "204":
 *         description: Payment method deleted successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Payment method not found
 */
router
  .route('/payment-methods/:methodId')
  .get(
    auth(PERMISSIONS.SERVICE_READ),
    validate(serviceValidation.getPaymentMethod),
    getServiceController().getPaymentMethod
  )
  .patch(
    auth(PERMISSIONS.SERVICE_UPDATE),
    validate(serviceValidation.updatePaymentMethod),
    getServiceController().updatePaymentMethod
  )
  .delete(
    auth(PERMISSIONS.SERVICE_DELETE),
    validate(serviceValidation.deletePaymentMethod),
    getServiceController().deletePaymentMethod
  );

export default router;
