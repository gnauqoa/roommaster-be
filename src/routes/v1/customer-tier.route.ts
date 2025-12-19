import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { customerTierValidation } from '../../validations';
import { getCustomerTierController } from '../../core/bootstrap';
import { PERMISSIONS } from '../../config/roles';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Customer Tiers
 *     description: Customer tier management and upgrades
 */

/**
 * @swagger
 * /customer-tiers:
 *   post:
 *     summary: Create a new customer tier
 *     tags: [Customer Tiers]
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
 *               - roomDiscountFactor
 *             properties:
 *               code:
 *                 type: string
 *                 example: "GOLD"
 *               name:
 *                 type: string
 *                 example: "Gold Member"
 *               pointsRequired:
 *                 type: integer
 *                 example: 500
 *               roomDiscountFactor:
 *                 type: number
 *                 format: decimal
 *                 example: 0.10
 *     responses:
 *       "201":
 *         description: Customer tier created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get all customer tiers
 *     tags: [Customer Tiers]
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
 *     responses:
 *       "200":
 *         description: List of customer tiers
 *       "401":
 *         description: Unauthorized
 */
router
  .route('/')
  .post(
    auth(PERMISSIONS.CUSTOMER_TIER_CREATE),
    validate(customerTierValidation.createCustomerTier),
    getCustomerTierController().createCustomerTier
  )
  .get(
    auth(PERMISSIONS.CUSTOMER_TIER_READ),
    validate(customerTierValidation.getCustomerTiers),
    getCustomerTierController().getCustomerTiers
  );

/**
 * @swagger
 * /customer-tiers/{tierId}:
 *   get:
 *     summary: Get customer tier by ID
 *     tags: [Customer Tiers]
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
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Customer tier not found
 *   patch:
 *     summary: Update customer tier
 *     tags: [Customer Tiers]
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
 *                 format: decimal
 *     responses:
 *       "200":
 *         description: Customer tier updated successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Customer tier not found
 *   delete:
 *     summary: Delete customer tier
 *     tags: [Customer Tiers]
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
 *         description: Customer tier deleted successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Customer tier not found
 */
router
  .route('/:tierId')
  .get(
    auth(PERMISSIONS.CUSTOMER_TIER_READ),
    validate(customerTierValidation.getCustomerTier),
    getCustomerTierController().getCustomerTier
  )
  .patch(
    auth(PERMISSIONS.CUSTOMER_TIER_UPDATE),
    validate(customerTierValidation.updateCustomerTier),
    getCustomerTierController().updateCustomerTier
  )
  .delete(
    auth(PERMISSIONS.CUSTOMER_TIER_DELETE),
    validate(customerTierValidation.deleteCustomerTier),
    getCustomerTierController().deleteCustomerTier
  );

/**
 * @swagger
 * /customer-tiers/upgrade/{customerId}:
 *   post:
 *     summary: Check and upgrade customer tier
 *     tags: [Customer Tiers]
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
 *     responses:
 *       "200":
 *         description: Tier upgrade result
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/upgrade/:customerId',
  auth(PERMISSIONS.CUSTOMER_TIER_UPDATE),
  validate(customerTierValidation.checkUpgrade),
  getCustomerTierController().checkUpgrade
);

/**
 * @swagger
 * /customer-tiers/batch-upgrade:
 *   post:
 *     summary: Batch upgrade customers
 *     tags: [Customer Tiers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       "200":
 *         description: Batch upgrade completed
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/batch-upgrade',
  auth(PERMISSIONS.CUSTOMER_TIER_UPDATE),
  getCustomerTierController().batchUpgrade
);

export default router;
