import express from 'express';
import EmployeeCustomerRankController from '@/controllers/employee/employee.customer-rank.controller';
import validate from '@/middlewares/validate';
import Joi from 'joi';
import { authEmployee } from '@/middlewares/auth';
import { container, TOKENS } from '@/core/container';
import CustomerRankService from '@/services/customer-rank.service';

// Inline validation schemas
const customerRankValidation = {
  createRank: {
    body: Joi.object().keys({
      name: Joi.string().required(),
      displayName: Joi.string().required(),
      description: Joi.string().optional(),
      minSpending: Joi.number().min(0).required(),
      maxSpending: Joi.number().min(0).optional(),
      benefits: Joi.string().optional(),
      color: Joi.string().optional()
    })
  },
  updateRank: {
    body: Joi.object().keys({
      name: Joi.string().optional(),
      displayName: Joi.string().optional(),
      description: Joi.string().optional(),
      minSpending: Joi.number().min(0).optional(),
      maxSpending: Joi.number().min(0).optional(),
      benefits: Joi.string().optional(),
      color: Joi.string().optional()
    })
  }
};

/**
 * @swagger
 * tags:
 *   name: Employee Customer Rank
 *   description: Customer rank management endpoints for employees
 */

export default function createEmployeeCustomerRankRoutes(): express.Router {
  const router = express.Router();

  // Resolve service from container
  const customerRankService = container.resolve<CustomerRankService>(TOKENS.CustomerRankService);
  const controller = new EmployeeCustomerRankController(customerRankService);

  // All routes require authentication
  router.use(authEmployee);

  /**
   * @swagger
   * /employee/customer-rank/statistics:
   *   get:
   *     summary: Get customer rank statistics
   *     description: Retrieve statistics about customer distribution across different ranks
   *     tags: [Employee Customer Rank]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   description: Rank statistics data
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.get('/statistics', controller.getRankStatistics);

  /**
   * @swagger
   * /employee/customer-rank:
   *   get:
   *     summary: Get all customer ranks
   *     description: Retrieve a list of all customer ranks
   *     tags: [Employee Customer Rank]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Customer ranks retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                         example: "1"
   *                       name:
   *                         type: string
   *                         example: "gold"
   *                       displayName:
   *                         type: string
   *                         example: "Gold Member"
   *                       description:
   *                         type: string
   *                         example: "Premium membership tier"
   *                       minSpending:
   *                         type: number
   *                         example: 5000000
   *                       maxSpending:
   *                         type: number
   *                         example: 10000000
   *                       benefits:
   *                         type: string
   *                         example: "10% discount, priority booking"
   *                       color:
   *                         type: string
   *                         example: "#FFD700"
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                       updatedAt:
   *                         type: string
   *                         format: date-time
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.get('/', controller.getRanks);

  /**
   * @swagger
   * /employee/customer-rank:
   *   post:
   *     summary: Create a new customer rank
   *     description: Create a new customer rank tier with spending thresholds and benefits
   *     tags: [Employee Customer Rank]
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
   *               - displayName
   *               - minSpending
   *             properties:
   *               name:
   *                 type: string
   *                 description: Unique identifier name for the rank
   *                 example: "platinum"
   *               displayName:
   *                 type: string
   *                 description: Display name for the rank
   *                 example: "Platinum Member"
   *               description:
   *                 type: string
   *                 description: Description of the rank
   *                 example: "Elite membership tier with exclusive benefits"
   *               minSpending:
   *                 type: number
   *                 minimum: 0
   *                 description: Minimum spending amount to achieve this rank
   *                 example: 10000000
   *               maxSpending:
   *                 type: number
   *                 minimum: 0
   *                 description: Maximum spending amount for this rank (optional)
   *                 example: 20000000
   *               benefits:
   *                 type: string
   *                 description: Benefits description for this rank
   *                 example: "20% discount, free upgrades, priority support"
   *               color:
   *                 type: string
   *                 description: Color code for UI display
   *                 example: "#E5E4E2"
   *     responses:
   *       201:
   *         description: Customer rank created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     name:
   *                       type: string
   *                     displayName:
   *                       type: string
   *                     description:
   *                       type: string
   *                     minSpending:
   *                       type: number
   *                     maxSpending:
   *                       type: number
   *                     benefits:
   *                       type: string
   *                     color:
   *                       type: string
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  router.post('/', validate(customerRankValidation.createRank), controller.createRank);

  /**
   * @swagger
   * /employee/customer-rank/{id}:
   *   get:
   *     summary: Get customer rank by ID
   *     description: Retrieve detailed information about a specific customer rank
   *     tags: [Employee Customer Rank]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Customer rank ID
   *         example: "1"
   *     responses:
   *       200:
   *         description: Customer rank retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     name:
   *                       type: string
   *                     displayName:
   *                       type: string
   *                     description:
   *                       type: string
   *                     minSpending:
   *                       type: number
   *                     maxSpending:
   *                       type: number
   *                     benefits:
   *                       type: string
   *                     color:
   *                       type: string
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.get('/:id', controller.getRankById);

  /**
   * @swagger
   * /employee/customer-rank/{id}:
   *   put:
   *     summary: Update customer rank
   *     description: Update an existing customer rank's information
   *     tags: [Employee Customer Rank]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Customer rank ID
   *         example: "1"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Unique identifier name for the rank
   *                 example: "gold"
   *               displayName:
   *                 type: string
   *                 description: Display name for the rank
   *                 example: "Gold Member"
   *               description:
   *                 type: string
   *                 description: Description of the rank
   *                 example: "Premium membership tier"
   *               minSpending:
   *                 type: number
   *                 minimum: 0
   *                 description: Minimum spending amount to achieve this rank
   *                 example: 5000000
   *               maxSpending:
   *                 type: number
   *                 minimum: 0
   *                 description: Maximum spending amount for this rank
   *                 example: 10000000
   *               benefits:
   *                 type: string
   *                 description: Benefits description for this rank
   *                 example: "15% discount, priority booking"
   *               color:
   *                 type: string
   *                 description: Color code for UI display
   *                 example: "#FFD700"
   *     responses:
   *       200:
   *         description: Customer rank updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     name:
   *                       type: string
   *                     displayName:
   *                       type: string
   *                     description:
   *                       type: string
   *                     minSpending:
   *                       type: number
   *                     maxSpending:
   *                       type: number
   *                     benefits:
   *                       type: string
   *                     color:
   *                       type: string
   *                     updatedAt:
   *                       type: string
   *                       format: date-time
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.put('/:id', validate(customerRankValidation.updateRank), controller.updateRank);

  /**
   * @swagger
   * /employee/customer-rank/{id}:
   *   delete:
   *     summary: Delete customer rank
   *     description: Delete an existing customer rank
   *     tags: [Employee Customer Rank]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Customer rank ID
   *         example: "1"
   *     responses:
   *       204:
   *         description: Customer rank deleted successfully
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  router.delete('/:id', controller.deleteRank);

  return router;
}
