import express from 'express';
import validate from '@/middlewares/validate';
import { transactionValidation } from '@/validations';
import EmployeeTransactionController from '@/controllers/employee/employee.transaction.controller';
import { container, TOKENS } from '@/core/container';
import { TransactionService } from '@/services/transaction';
import { authEmployee } from '@/middlewares/auth';

const router = express.Router();

// Resolve dependencies from container
const transactionService = container.resolve<TransactionService>(TOKENS.TransactionService);
const employeeTransactionController = new EmployeeTransactionController(transactionService);

/**
 * @swagger
 * tags:
 *   name: Employee Transactions
 *   description: Employee transaction management endpoints
 */

/**
 * @swagger
 * /employee/transactions:
 *   get:
 *     summary: Get transactions with pagination
 *     description: Retrieve a paginated list of transactions with optional filters
 *     tags: [Employee Transactions]
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
 *           enum: [createdAt, occurredAt, amount]
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
 *         name: bookingId
 *         schema:
 *           type: string
 *         description: Filter by booking ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED, REFUNDED]
 *         description: Filter by transaction status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DEPOSIT, ROOM_CHARGE, SERVICE_CHARGE, REFUND, ADJUSTMENT]
 *         description: Filter by transaction type
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [CASH, CREDIT_CARD, BANK_TRANSFER, E_WALLET]
 *         description: Filter by payment method
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter transactions from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter transactions until this date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in transaction reference or description
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
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
  validate(transactionValidation.getTransactions),
  employeeTransactionController.getTransactions
);

/**
 * @swagger
 * /employee/transactions/{transactionId}:
 *   get:
 *     summary: Get transaction details by ID
 *     description: Retrieve detailed information about a specific transaction
 *     tags: [Employee Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 type:
 *                   type: string
 *                 status:
 *                   type: string
 *                 method:
 *                   type: string
 *                 baseAmount:
 *                   type: number
 *                 discountAmount:
 *                   type: number
 *                 amount:
 *                   type: number
 *                 booking:
 *                   type: object
 *                 processedBy:
 *                   type: object
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                 usedPromotions:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transaction not found
 */
router.get(
  '/:transactionId',
  authEmployee,
  validate(transactionValidation.getTransactionById),
  employeeTransactionController.getTransactionById
);

/**
 * @swagger
 * /employee/transactions:
 *   post:
 *     summary: Create a transaction
 *     description: Create a transaction for booking payment (full, split room, or service) with optional promotions
 *     tags: [Employee Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *               - transactionType
 *             properties:
 *               bookingId:
 *                 type: string
 *                 description: Booking ID (required for booking-related payments)
 *               bookingRoomIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific room IDs for split payment
 *               serviceUsageId:
 *                 type: string
 *                 description: Service usage ID for service payment
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, MOMO, ZALOPAY]
 *               transactionType:
 *                 type: string
 *                 enum: [DEPOSIT, ROOM_CHARGE, SERVICE_CHARGE, REFUND, ADJUSTMENT]
 *               transactionRef:
 *                 type: string
 *                 description: External transaction reference
 *               description:
 *                 type: string
 *                 description: Custom transaction description
 *               promotionApplications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - customerPromotionId
 *                   properties:
 *                     customerPromotionId:
 *                       type: string
 *                     bookingRoomId:
 *                       type: string
 *                       description: Apply promotion to specific room
 *                     serviceUsageId:
 *                       type: string
 *                       description: Apply promotion to specific service
 *           examples:
 *             fullBooking:
 *               summary: Full booking payment
 *               value:
 *                 bookingId: "booking_123"
 *                 paymentMethod: "CASH"
 *                 transactionType: "DEPOSIT"
 *             splitRoom:
 *               summary: Split room payment
 *               value:
 *                 bookingId: "booking_123"
 *                 bookingRoomIds: ["room_1", "room_2"]
 *                 paymentMethod: "CREDIT_CARD"
 *                 transactionType: "ROOM_CHARGE"
 *             withPromotion:
 *               summary: Payment with promotion
 *               value:
 *                 bookingId: "booking_123"
 *                 paymentMethod: "CASH"
 *                 transactionType: "DEPOSIT"
 *                 promotionApplications:
 *                   - customerPromotionId: "cp_123"
 *                     bookingRoomId: "room_1"
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking or service not found
 */
router.post(
  '/',
  authEmployee,
  validate(transactionValidation.createTransaction),
  employeeTransactionController.createTransaction
);

export default router;
