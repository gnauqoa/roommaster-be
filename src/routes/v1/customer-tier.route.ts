import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { customerTierValidation } from '../../validations';
import { customerTierController } from '../../controllers';
import { PERMISSIONS } from '../../config/roles';

const router = express.Router();

router
  .route('/')
  .post(
    auth(PERMISSIONS.CUSTOMER_TIER_CREATE),
    validate(customerTierValidation.createCustomerTier),
    customerTierController.createCustomerTier
  )
  .get(
    auth(PERMISSIONS.CUSTOMER_TIER_READ),
    validate(customerTierValidation.getCustomerTiers),
    customerTierController.getCustomerTiers
  );

router
  .route('/:tierId')
  .get(
    auth(PERMISSIONS.CUSTOMER_TIER_READ),
    validate(customerTierValidation.getCustomerTier),
    customerTierController.getCustomerTier
  )
  .patch(
    auth(PERMISSIONS.CUSTOMER_TIER_UPDATE),
    validate(customerTierValidation.updateCustomerTier),
    customerTierController.updateCustomerTier
  )
  .delete(
    auth(PERMISSIONS.CUSTOMER_TIER_DELETE),
    validate(customerTierValidation.deleteCustomerTier),
    customerTierController.deleteCustomerTier
  );

router.post(
  '/upgrade/:customerId',
  auth(PERMISSIONS.CUSTOMER_TIER_UPDATE),
  validate(customerTierValidation.checkUpgrade),
  customerTierController.checkUpgrade
);

router.post(
  '/batch-upgrade',
  auth(PERMISSIONS.CUSTOMER_TIER_UPDATE),
  customerTierController.batchUpgrade
);

export default router;

/**
 * @swagger
 * tags:
 *   name: CustomerTiers
 *   description: Customer tier/loyalty management
 */

/**
 * @swagger
 * /customer-tiers:
 *   post:
 *     summary: Create a customer tier
 *     tags: [CustomerTiers]
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
 *                 maxLength: 20
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               pointsRequired:
 *                 type: integer
 *                 minimum: 0
 *               roomDiscountFactor:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               serviceDiscountFactor:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Get all customer tiers
 *     tags: [CustomerTiers]
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
 * /customer-tiers/{tierId}:
 *   get:
 *     summary: Get customer tier by ID
 *     tags: [CustomerTiers]
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
 *         description: OK
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     summary: Update customer tier
 *     tags: [CustomerTiers]
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
 *             properties:
 *               name:
 *                 type: string
 *               pointsRequired:
 *                 type: integer
 *               roomDiscountFactor:
 *                 type: number
 *               serviceDiscountFactor:
 *                 type: number
 *     responses:
 *       "200":
 *         description: OK
 *   delete:
 *     summary: Delete customer tier
 *     tags: [CustomerTiers]
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
 *         description: No Content
 *       "400":
 *         description: Cannot delete tier with customers
 */

/**
 * @swagger
 * /customer-tiers/upgrade/{customerId}:
 *   post:
 *     summary: Check and upgrade customer tier
 *     tags: [CustomerTiers]
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
 *         description: OK
 */

/**
 * @swagger
 * /customer-tiers/batch-upgrade:
 *   post:
 *     summary: Batch upgrade all customer tiers
 *     tags: [CustomerTiers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 */
