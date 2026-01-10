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
   * @route   POST /api/v1/employee/pricing-rules
   * @desc    Create a new pricing rule
   * @access  Private (Employee)
   */
  router.post('/', authEmployee, pricingRuleController.createRule);

  /**
   * @route   GET /api/v1/employee/pricing-rules
   * @desc    Get all pricing rules
   * @access  Private (Employee)
   */
  router.get('/', authEmployee, pricingRuleController.getRules);

  /**
   * @route   GET /api/v1/employee/pricing-rules/:id
   * @desc    Get a pricing rule by ID
   * @access  Private (Employee)
   */
  router.get('/:id', authEmployee, pricingRuleController.getRuleById);

  /**
   * @route   PUT /api/v1/employee/pricing-rules/:id
   * @desc    Update a pricing rule
   * @access  Private (Employee)
   */
  router.put('/:id', authEmployee, pricingRuleController.updateRule);

  /**
   * @route   DELETE /api/v1/employee/pricing-rules/:id
   * @desc    Delete a pricing rule (soft delete)
   * @access  Private (Employee)
   */
  router.delete('/:id', authEmployee, pricingRuleController.deleteRule);

  /**
   * @route   POST /api/v1/employee/pricing-rules/:id/reorder
   * @desc    Reorder a pricing rule (drag and drop)
   * @access  Private (Employee)
   */
  router.post('/:id/reorder', authEmployee, pricingRuleController.reorderRule);

  return router;
}
