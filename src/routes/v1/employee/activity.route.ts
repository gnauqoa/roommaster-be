import express from 'express';
import validate from 'middlewares/validate';
import { activityValidation } from 'validations';
import EmployeeActivityController from 'controllers/employee/employee.activity.controller';
import { container, TOKENS } from 'core/container';
import { ActivityService } from 'services/activity.service';
import { authEmployee } from 'middlewares/auth';

const router = express.Router();

// Resolve dependencies from container
const activityService = container.resolve<ActivityService>(TOKENS.ActivityService);
const employeeActivityController = new EmployeeActivityController(activityService);

/**
 * @swagger
 * tags:
 *   name: Employee Activities
 *   description: Employee activity log endpoints
 */

/**
 * @swagger
 * /employee/activities:
 *   get:
 *     summary: Get all activities
 *     description: Retrieve activity logs with filtering and pagination
 *     tags: [Employee Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CREATE_BOOKING, UPDATE_BOOKING, CREATE_BOOKING_ROOM, UPDATE_BOOKING_ROOM, CREATE_SERVICE_USAGE, UPDATE_SERVICE_USAGE, CREATE_TRANSACTION, UPDATE_TRANSACTION, CREATE_CUSTOMER, CHECKED_IN, CHECKED_OUT, CREATE_PROMOTION, UPDATE_PROMOTION, CLAIM_PROMOTION]
 *         description: Filter by activity type
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *         description: Filter by employee ID
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter activities from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter activities until this date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in activity description
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, type, updatedAt]
 *           default: createdAt
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of activities
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authEmployee,
  validate(activityValidation.getActivities),
  employeeActivityController.getActivities
);

/**
 * @swagger
 * /employee/activities/{activityId}:
 *   get:
 *     summary: Get activity by ID
 *     description: Get detailed information about a specific activity
 *     tags: [Employee Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Activity not found
 */
router.get(
  '/:activityId',
  authEmployee,
  validate(activityValidation.getActivity),
  employeeActivityController.getActivityById
);

export default router;
