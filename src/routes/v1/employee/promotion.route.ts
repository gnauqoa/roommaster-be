import express from 'express';
import validate from 'middlewares/validate';
import { promotionValidation, commonValidation } from 'validations';
import EmployeePromotionController from 'controllers/employee/employee.promotion.controller';
import { container, TOKENS } from 'core/container';
import { PromotionService } from 'services/promotion.service';
import { authEmployee } from 'middlewares/auth';

const router = express.Router();

// Resolve dependencies from container
const promotionService = container.resolve<PromotionService>(TOKENS.PromotionService);
const employeePromotionController = new EmployeePromotionController(promotionService);

/**
 * @swagger
 * tags:
 *   name: Employee Promotions
 *   description: Employee promotion management endpoints
 */

/**
 * @swagger
 * /employee/promotions:
 *   post:
 *     summary: Create a new promotion
 *     tags: [Employee Promotions]
 *     security:
 *       - bearerAuth: []
 *   get:
 *     summary: Get all promotions
 *     tags: [Employee Promotions]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authEmployee,
  validate(promotionValidation.createPromotion),
  employeePromotionController.createPromotion
);

router.get(
  '/',
  authEmployee,
  validate(commonValidation.getPromotions),
  employeePromotionController.getPromotions
);

/**
 * @swagger
 * /employee/promotions/{id}:
 *   patch:
 *     summary: Update a promotion
 *     tags: [Employee Promotions]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id',
  authEmployee,
  validate(promotionValidation.updatePromotion),
  employeePromotionController.updatePromotion
);

export default router;
