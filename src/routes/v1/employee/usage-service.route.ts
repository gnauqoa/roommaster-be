import express from 'express';
import validate from '@/middlewares/validate';
import { usageServiceValidation } from '@/validations';
import EmployeeUsageServiceController from '@/controllers/employee/employee.usage-service.controller';
import { container, TOKENS } from '@/core/container';
import { UsageServiceService } from '@/services/usage-service.service';
import { authEmployee } from '@/middlewares/auth';

export default function createUsageServiceRoutes(): express.Router {
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
   *   get:
   *     summary: Get service usages
   *     description: Retrieve a paginated list of service usages with filters
   *     tags: [Employee Services]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Items per page
   *       - in: query
   *         name: bookingId
   *         schema:
   *           type: string
   *         description: Filter by booking ID
   *       - in: query
   *         name: bookingRoomId
   *         schema:
   *           type: string
   *         description: Filter by booking room ID
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter by date start
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter by date end
   *     responses:
   *       200:
   *         description: List of service usages
   *       401:
   *         description: Unauthorized
   */
  router.get(
    '/service-usage',
    authEmployee,
    validate(usageServiceValidation.getServiceUsages),
    employeeUsageServiceController.getServiceUsages
  );

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
   *               note:
   *                 type: string
   *                 maxLength: 500
   *                 description: Optional note for service usage
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

  /**
   * @swagger
   * /employee/service/service-usage/{id}:
   *   delete:
   *     summary: Delete service usage
   *     description: Delete a service usage record (if not paid/audited)
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
   *     responses:
   *       200:
   *         description: Service usage deleted successfully
   *       400:
   *         description: Cannot delete paid/audited service usage
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Service usage not found
   */
  router.delete(
    '/service-usage/:id',
    authEmployee,
    validate(usageServiceValidation.deleteServiceUsage),
    employeeUsageServiceController.deleteServiceUsage
  );

  /**
   * @swagger
   * /employee/service/penalty:
   *   post:
   *     summary: Create a penalty charge
   *     description: Apply a penalty charge with custom price to a booking or guest
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
   *               - customPrice
   *               - reason
   *             properties:
   *               bookingId:
   *                 type: string
   *                 description: Optional booking ID
   *               bookingRoomId:
   *                 type: string
   *                 description: Optional booking room ID
   *               customPrice:
   *                 type: number
   *                 description: Custom penalty amount
   *                 example: 100000
   *               quantity:
   *                 type: integer
   *                 default: 1
   *                 description: Number of penalty units
   *               reason:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 500
   *                 description: Reason for penalty
   *                 example: "Hư hỏng tài sản phòng"
   *     responses:
   *       201:
   *         description: Penalty created successfully
   *       400:
   *         description: Invalid input
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Booking or room not found
   */
  router.post(
    '/penalty',
    authEmployee,
    validate(usageServiceValidation.createPenalty),
    employeeUsageServiceController.createPenalty
  );

  /**
   * @swagger
   * /employee/service/surcharge:
   *   post:
   *     summary: Create a surcharge fee
   *     description: Apply a surcharge fee with custom price to a booking or guest
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
   *               - customPrice
   *               - reason
   *             properties:
   *               bookingId:
   *                 type: string
   *                 description: Optional booking ID
   *               bookingRoomId:
   *                 type: string
   *                 description: Optional booking room ID
   *               customPrice:
   *                 type: number
   *                 description: Custom surcharge amount
   *                 example: 50000
   *               quantity:
   *                 type: integer
   *                 default: 1
   *                 description: Number of surcharge units
   *               reason:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 500
   *                 description: Reason for surcharge
   *                 example: "Phụ thu giờ cao điểm"
   *     responses:
   *       201:
   *         description: Surcharge created successfully
   *       400:
   *         description: Invalid input
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Booking or room not found
   */
  router.post(
    '/surcharge',
    authEmployee,
    validate(usageServiceValidation.createSurcharge),
    employeeUsageServiceController.createSurcharge
  );

  return router;
}
