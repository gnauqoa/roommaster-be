import { Request, Response } from 'express';
import { Injectable } from '@/core/decorators';
import PricingRuleService from '@/services/pricing-rule.service';
import httpStatus from 'http-status';
import catchAsync from '@/utils/catchAsync';

@Injectable()
export class EmployeePricingRuleController {
  constructor(private readonly pricingRuleService: PricingRuleService) {}

  /**
   * @swagger
   * /employee/pricing-rules:
   *   post:
   *     summary: Create a new pricing rule
   *     tags: [Employee - Pricing Rules]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - adjustmentType
   *               - adjustmentValue
   *             properties:
   *               name:
   *                 type: string
   *               roomTypeIds:
   *                 type: array
   *                 items:
   *                   type: string
   *               calendarEventId:
   *                 type: string
   *               startDate:
   *                 type: string
   *                 format: date-time
   *               endDate:
   *                 type: string
   *                 format: date-time
   *               recurrenceRule:
   *                 type: string
   *               adjustmentType:
   *                 type: string
   *                 enum: [PERCENTAGE, FIXED_AMOUNT]
   *               adjustmentValue:
   *                 type: number
   *     responses:
   *       201:
   *         description: Pricing rule created successfully
   */
  createRule = catchAsync(async (req: Request, res: Response) => {
    const rule = await this.pricingRuleService.createRule(req.body);
    res.status(httpStatus.CREATED).json(rule);
  });

  /**
   * @swagger
   * /employee/pricing-rules:
   *   get:
   *     summary: Get all pricing rules
   *     tags: [Employee - Pricing Rules]
   *     parameters:
   *       - in: query
   *         name: includeInactive
   *         schema:
   *           type: boolean
   *         description: Include inactive rules
   *     responses:
   *       200:
   *         description: List of pricing rules
   */
  getRules = catchAsync(async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true';
    const rules = await this.pricingRuleService.getRules(includeInactive);
    res.status(httpStatus.OK).json(rules);
  });

  /**
   * @swagger
   * /employee/pricing-rules/{id}:
   *   get:
   *     summary: Get a pricing rule by ID
   *     tags: [Employee - Pricing Rules]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Pricing rule details
   *       404:
   *         description: Pricing rule not found
   */
  getRuleById = catchAsync(async (req: Request, res: Response) => {
    const rule = await this.pricingRuleService.getRuleById(req.params.id);
    res.status(httpStatus.OK).json(rule);
  });

  /**
   * @swagger
   * /employee/pricing-rules/{id}:
   *   put:
   *     summary: Update a pricing rule
   *     tags: [Employee - Pricing Rules]
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
   *     responses:
   *       200:
   *         description: Pricing rule updated successfully
   */
  updateRule = catchAsync(async (req: Request, res: Response) => {
    const rule = await this.pricingRuleService.updateRule(req.params.id, req.body);
    res.status(httpStatus.OK).json(rule);
  });

  /**
   * @swagger
   * /employee/pricing-rules/{id}:
   *   delete:
   *     summary: Delete a pricing rule (soft delete)
   *     tags: [Employee - Pricing Rules]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Pricing rule deleted successfully
   */
  deleteRule = catchAsync(async (req: Request, res: Response) => {
    const rule = await this.pricingRuleService.deleteRule(req.params.id);
    res.status(httpStatus.OK).json(rule);
  });

  /**
   * @swagger
   * /employee/pricing-rules/{id}/reorder:
   *   post:
   *     summary: Reorder a pricing rule
   *     tags: [Employee - Pricing Rules]
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
   *               prevRank:
   *                 type: string
   *                 nullable: true
   *               nextRank:
   *                 type: string
   *                 nullable: true
   *     responses:
   *       200:
   *         description: Pricing rule reordered successfully
   */
  reorderRule = catchAsync(async (req: Request, res: Response) => {
    const rule = await this.pricingRuleService.reorderRule(req.params.id, req.body);
    res.status(httpStatus.OK).json(rule);
  });
}

export default EmployeePricingRuleController;
