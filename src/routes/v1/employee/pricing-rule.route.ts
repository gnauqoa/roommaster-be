import express from 'express';
import { authEmployee } from '@/middlewares/auth';
import { container, TOKENS } from '@/core/container';
import EmployeePricingRuleController from '@/controllers/employee/employee.pricing-rule.controller';
import PricingRuleService from '@/services/pricing-rule.service';

export default function createPricingRuleRoutes(): express.Router {
  const router = express.Router();

  // Manually instantiate controller with dependencies
  const pricingRuleService = container.resolve<PricingRuleService>(TOKENS.PricingRuleService);
  const pricingRuleController = new EmployeePricingRuleController(pricingRuleService);

  /**
   * @swagger
   * tags:
   *   name: Employee Pricing Rules
   *   description: Employee pricing rule management endpoints
   */

  /**
   * @swagger
   * /employee/pricing-rules:
   *   post:
   *     summary: Create a new pricing rule
   *     description: Create a new pricing rule for room types with custom pricing conditions
   *     tags: [Employee Pricing Rules]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - roomTypeId
   *               - adjustmentType
   *               - adjustmentValue
   *             properties:
   *               name:
   *                 type: string
   *               roomTypeId:
   *                 type: string
   *               adjustmentType:
   *                 type: string
   *                 enum: [PERCENTAGE, FIXED]
   *               adjustmentValue:
   *                 type: number
   *     responses:
   *       201:
   *         description: Pricing rule created successfully
   *       400:
   *         description: Validation error
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *   get:
   *     summary: Get all pricing rules
   *     description: Retrieve a list of all pricing rules with pagination
   *     tags: [Employee Pricing Rules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: List of pricing rules retrieved successfully
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router
    .route('/')
    .post(authEmployee, pricingRuleController.createRule)
    .get(authEmployee, pricingRuleController.getRules);

  /**
   * @swagger
   * /employee/pricing-rules/{id}:
   *   get:
   *     summary: Get a pricing rule by ID
   *     description: Retrieve detailed information about a specific pricing rule
   *     tags: [Employee Pricing Rules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Pricing rule retrieved successfully
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *   put:
   *     summary: Update a pricing rule
   *     description: Update an existing pricing rule
   *     tags: [Employee Pricing Rules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               adjustmentType:
   *                 type: string
   *                 enum: [PERCENTAGE, FIXED]
   *               adjustmentValue:
   *                 type: number
   *     responses:
   *       200:
   *         description: Pricing rule updated successfully
   *       400:
   *         description: Validation error
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *   delete:
   *     summary: Delete a pricing rule
   *     description: Soft delete a pricing rule (mark as inactive)
   *     tags: [Employee Pricing Rules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Pricing rule deleted successfully
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router
    .route('/:id')
    .get(authEmployee, pricingRuleController.getRuleById)
    .put(authEmployee, pricingRuleController.updateRule)
    .delete(authEmployee, pricingRuleController.deleteRule);

  /**
   * @swagger
   * /employee/pricing-rules/{id}/reorder:
   *   post:
   *     summary: Reorder a pricing rule
   *     description: Change the priority order of a pricing rule (for drag and drop UI)
   *     tags: [Employee Pricing Rules]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newPosition
   *             properties:
   *               newPosition:
   *                 type: integer
   *                 minimum: 0
   *     responses:
   *       200:
   *         description: Pricing rule reordered successfully
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.post('/:id/reorder', authEmployee, pricingRuleController.reorderRule);

  return router;
}
