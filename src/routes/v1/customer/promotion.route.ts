import express from 'express';
import validate from 'middlewares/validate';
import { promotionValidation, commonValidation } from 'validations';
import CustomerPromotionController from 'controllers/customer/customer.promotion.controller';
import { container, TOKENS } from 'core/container';
import { PromotionService } from 'services/promotion.service';
import { authCustomer } from 'middlewares/auth';

const router = express.Router();

// Resolve dependencies from container
const promotionService = container.resolve<PromotionService>(TOKENS.PromotionService);
const customerPromotionController = new CustomerPromotionController(promotionService);

/**
 * @swagger
 * tags:
 *   name: Customer Promotions
 *   description: Customer promotion endpoints
 */

/**
 * @swagger
 * /customer/promotions/available:
 *   get:
 *     summary: Get all available promotions (public listing)
 *     tags: [Customer Promotions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/available',
  authCustomer,
  validate(commonValidation.getPromotions),
  customerPromotionController.getAvailablePromotions
);

/**
 * @swagger
 * /customer/promotions/my-promotions:
 *   get:
 *     summary: Get customer's claimed promotions
 *     tags: [Customer Promotions]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/my-promotions',
  authCustomer,
  validate(commonValidation.getPromotions),
  customerPromotionController.getMyPromotions
);

/**
 * @swagger
 * /customer/promotions/claim:
 *   post:
 *     summary: Claim a promotion by code
 *     tags: [Customer Promotions]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/claim',
  authCustomer,
  validate(promotionValidation.claimPromotion),
  customerPromotionController.claimPromotion
);

export default router;
