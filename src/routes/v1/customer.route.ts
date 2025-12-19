import express from 'express';
import validate from 'middlewares/validate';
import customerValidation from 'validations/customer.validation';
import { getCustomerController } from '../../core/bootstrap';
import auth from 'middlewares/auth';
import { PERMISSIONS } from 'config/roles';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customers
 *     description: Customer management endpoints
 */

// ===== CUSTOMER TIERS =====

/**
 * @swagger
 * /customers/tiers:
 *   post:
 *     summary: Create a new customer tier
 *     tags: [Customers]
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
 *               - pointsRequired
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SILVER"
 *               name:
 *                 type: string
 *                 example: "Silver Member"
 *               pointsRequired:
 *                 type: integer
 *                 example: 250
 *     responses:
 *       "201":
 *         description: Customer tier created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get all customer tiers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: List of customer tiers
 *       "401":
 *         description: Unauthorized
 */
router
  .route('/tiers')
  .post(
    auth(PERMISSIONS.CUSTOMER_TIER_CREATE),
    validate(customerValidation.createCustomerTier),
    getCustomerController().createCustomerTier
  )
  .get(
    auth(PERMISSIONS.CUSTOMER_TIER_READ),
    validate(customerValidation.getCustomerTiers),
    getCustomerController().getCustomerTiers
  );

/**
 * @swagger
 * /customers/tiers/{tierId}:
 *   get:
 *     summary: Get customer tier by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tierId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Customer tier details
 *       "404":
 *         description: Tier not found
 *   patch:
 *     summary: Update customer tier
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tierId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       "200":
 *         description: Tier updated successfully
 *       "403":
 *         description: Forbidden
 *   delete:
 *     summary: Delete customer tier
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tierId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "204":
 *         description: Tier deleted successfully
 *       "403":
 *         description: Forbidden
 */
router
  .route('/tiers/:tierId')
  .get(
    auth(PERMISSIONS.CUSTOMER_TIER_READ),
    validate(customerValidation.getCustomerTier),
    getCustomerController().getCustomerTier
  )
  .patch(
    auth(PERMISSIONS.CUSTOMER_TIER_UPDATE),
    validate(customerValidation.updateCustomerTier),
    getCustomerController().updateCustomerTier
  )
  .delete(
    auth(PERMISSIONS.CUSTOMER_TIER_DELETE),
    validate(customerValidation.deleteCustomerTier),
    getCustomerController().deleteCustomerTier
  );

// ===== CUSTOMERS =====

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Customer created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
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
 *         name: tierId
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: List of customers
 *       "401":
 *         description: Unauthorized
 */
router
  .route('/')
  .post(
    auth(PERMISSIONS.CUSTOMER_CREATE),
    validate(customerValidation.createCustomer),
    getCustomerController().createCustomer
  )
  .get(
    auth(PERMISSIONS.CUSTOMER_READ),
    validate(customerValidation.getCustomers),
    getCustomerController().getCustomers
  );

/**
 * @swagger
 * /customers/search:
 *   get:
 *     summary: Search customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword (name, email, phone)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Search results
 *       "401":
 *         description: Unauthorized
 */
router.get(
  '/search',
  auth(PERMISSIONS.CUSTOMER_READ),
  validate(customerValidation.searchCustomers),
  getCustomerController().searchCustomers
);

/**
 * @swagger
 * /customers/{customerId}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Customer details
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Customer not found
 *   patch:
 *     summary: Update customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Customer updated successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Customer not found
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "204":
 *         description: Customer deleted successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Customer not found
 */
router
  .route('/:customerId')
  .get(
    auth(PERMISSIONS.CUSTOMER_READ),
    validate(customerValidation.getCustomer),
    getCustomerController().getCustomer
  )
  .patch(
    auth(PERMISSIONS.CUSTOMER_UPDATE),
    validate(customerValidation.updateCustomer),
    getCustomerController().updateCustomer
  )
  .delete(
    auth(PERMISSIONS.CUSTOMER_DELETE),
    validate(customerValidation.deleteCustomer),
    getCustomerController().deleteCustomer
  );

export default router;
