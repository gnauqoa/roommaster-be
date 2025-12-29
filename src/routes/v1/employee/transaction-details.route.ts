import express from 'express';
import validate from '@/middlewares/validate';
import { transactionDetailsValidation } from '@/validations';
import EmployeeTransactionDetailsController from '@/controllers/employee/employee.transaction-details.controller';
import { container, TOKENS } from '@/core/container';
import { TransactionDetailsService } from '@/services/transaction-details.service';
import { authEmployee } from '@/middlewares/auth';

const router = express.Router();

// Resolve dependencies from container
const transactionDetailsService = container.resolve<TransactionDetailsService>(
  TOKENS.TransactionDetailsService
);
const employeeTransactionDetailsController = new EmployeeTransactionDetailsController(
  transactionDetailsService
);

/**
 * @swagger
 * tags:
 *   name: Employee Transaction Details
 *   description: Employee transaction details search endpoints
 */

/**
 * @swagger
 * /employee/transaction-details:
 *   get:
 *     summary: Search transaction details
 *     description: Search and filter transaction details by various criteria including amounts, rooms, services, and dates
 *     tags: [Employee Transaction Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, baseAmount, amount, discountAmount]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: transactionId
 *         schema:
 *           type: string
 *         description: Filter by transaction ID
 *       - in: query
 *         name: bookingRoomId
 *         schema:
 *           type: string
 *         description: Filter by booking room ID
 *       - in: query
 *         name: serviceUsageId
 *         schema:
 *           type: string
 *         description: Filter by service usage ID
 *       - in: query
 *         name: minBaseAmount
 *         schema:
 *           type: number
 *         description: Minimum base amount
 *       - in: query
 *         name: maxBaseAmount
 *         schema:
 *           type: number
 *         description: Maximum base amount
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum final amount
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum final amount
 *       - in: query
 *         name: minDiscountAmount
 *         schema:
 *           type: number
 *         description: Minimum discount amount
 *       - in: query
 *         name: maxDiscountAmount
 *         schema:
 *           type: number
 *         description: Maximum discount amount
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter until this date
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       transactionId:
 *                         type: string
 *                       baseAmount:
 *                         type: number
 *                       discountAmount:
 *                         type: number
 *                       amount:
 *                         type: number
 *                       transaction:
 *                         type: object
 *                       bookingRoom:
 *                         type: object
 *                       serviceUsage:
 *                         type: object
 *                       usedPromotions:
 *                         type: array
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authEmployee,
  validate(transactionDetailsValidation.getTransactionDetails),
  employeeTransactionDetailsController.getTransactionDetails
);

export default router;
