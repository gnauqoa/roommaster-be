import express from 'express';
import validate from 'middlewares/validate';
import { usageServiceValidation } from 'validations';
import EmployeeUsageServiceController from 'controllers/employee/employee.usage-service.controller';
import { container, TOKENS } from 'core/container';
import { UsageServiceService } from 'services/usage-service.service';
import { authEmployee } from 'middlewares/auth';

const router = express.Router();

// Resolve dependencies from container
const usageServiceService = container.resolve<UsageServiceService>(TOKENS.UsageServiceService);
const employeeUsageServiceController = new EmployeeUsageServiceController(usageServiceService);

/**
 * @swagger
 * tags:
 *   name: Employee Services
 *   description: Employee service usage management endpoints
 */

/**
 * @swagger
 * /employee/service/service-usage:
 *   post:
 *     summary: Create a service usage record
 *     description: Record service consumption for a booking or guest user. BookingId and bookingRoomId are optional for guest users.
 *     tags: [Employee Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - quantity
 *             properties:
 *               bookingId:
 *                 type: string
 *                 description: Booking ID (optional - omit for guest users)
 *               bookingRoomId:
 *                 type: string
 *                 description: Specific booking room ID (optional)
 *               serviceId:
 *                 type: string
 *                 description: Service ID
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity of service consumed
 *             example:
 *               bookingId: "booking_id_123"
 *               bookingRoomId: "booking_room_id_456"
 *               serviceId: "service_id_789"
 *               quantity: 2
 *     responses:
 *       201:
 *         description: Service usage created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   description: Created service usage record
 *       400:
 *         description: Invalid request or validation error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/service-usage',
  authEmployee,
  validate(usageServiceValidation.createServiceUsage),
  employeeUsageServiceController.createServiceUsage
);

/**
 * @swagger
 * /employee/service/service-usage/{id}:
 *   patch:
 *     summary: Update a service usage record
 *     description: Update quantity or status of a service usage
 *     tags: [Employee Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service usage ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: New quantity (optional)
 *               status:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, CANCELLED]
 *                 description: New status (optional)
 *             example:
 *               quantity: 3
 *     responses:
 *       200:
 *         description: Service usage updated successfully
 *       400:
 *         description: Cannot update paid service usage
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/service-usage/:id',
  authEmployee,
  validate(usageServiceValidation.updateServiceUsage),
  employeeUsageServiceController.updateServiceUsage
);

export default router;
