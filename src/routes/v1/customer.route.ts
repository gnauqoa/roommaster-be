import express from 'express';
import validate from 'middlewares/validate';
import customerValidation from 'validations/customer.validation';
import { customerController } from 'controllers';
import auth from 'middlewares/auth';
import { PERMISSIONS } from 'config/roles';

const router = express.Router();

// Customer Tiers
router
  .route('/tiers')
  .post(
    auth(PERMISSIONS.CUSTOMER_TIER_CREATE),
    validate(customerValidation.createCustomerTier),
    customerController.createCustomerTier
  )
  .get(
    auth(PERMISSIONS.CUSTOMER_TIER_READ),
    validate(customerValidation.getCustomerTiers),
    customerController.getCustomerTiers
  );

router
  .route('/tiers/:tierId')
  .get(
    auth(PERMISSIONS.CUSTOMER_TIER_READ),
    validate(customerValidation.getCustomerTier),
    customerController.getCustomerTier
  )
  .patch(
    auth(PERMISSIONS.CUSTOMER_TIER_UPDATE),
    validate(customerValidation.updateCustomerTier),
    customerController.updateCustomerTier
  )
  .delete(
    auth(PERMISSIONS.CUSTOMER_TIER_DELETE),
    validate(customerValidation.deleteCustomerTier),
    customerController.deleteCustomerTier
  );

// Customers
router
  .route('/')
  .post(
    auth(PERMISSIONS.CUSTOMER_CREATE),
    validate(customerValidation.createCustomer),
    customerController.createCustomer
  )
  .get(
    auth(PERMISSIONS.CUSTOMER_READ),
    validate(customerValidation.getCustomers),
    customerController.getCustomers
  );

router.get(
  '/search',
  auth(PERMISSIONS.CUSTOMER_READ),
  validate(customerValidation.searchCustomers),
  customerController.searchCustomers
);

router
  .route('/:customerId')
  .get(
    auth(PERMISSIONS.CUSTOMER_READ),
    validate(customerValidation.getCustomer),
    customerController.getCustomer
  )
  .patch(
    auth(PERMISSIONS.CUSTOMER_UPDATE),
    validate(customerValidation.updateCustomer),
    customerController.updateCustomer
  )
  .delete(
    auth(PERMISSIONS.CUSTOMER_DELETE),
    validate(customerValidation.deleteCustomer),
    customerController.deleteCustomer
  );

export default router;

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management
 */

/**
 * @swagger
 * /customers/tiers:
 *   post:
 *     summary: Create a customer tier
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomerTier'
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Get all customer tiers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomer'
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

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
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search by name, email, phone, or ID number
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
