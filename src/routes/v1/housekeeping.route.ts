import express from 'express';
import validate from '../../middlewares/validate';
import housekeepingValidation from '../../validations/housekeeping.validation';
import { getHousekeepingController } from '../../core/bootstrap';
import auth from '../../middlewares/auth';
import { PERMISSIONS } from '../../config/roles';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Housekeeping
 *     description: Housekeeping tasks and room cleaning management
 */

/**
 * @swagger
 * /housekeeping:
 *   post:
 *     summary: Create a new housekeeping log
 *     tags: [Housekeeping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *             properties:
 *               roomId:
 *                 type: integer
 *               assignedToId:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Housekeeping log created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get all housekeeping logs
 *     tags: [Housekeeping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, INSPECTED]
 *     responses:
 *       "200":
 *         description: List of housekeeping logs
 *       "401":
 *         description: Unauthorized
 */
router
  .route('/')
  .post(
    auth(PERMISSIONS.HOUSEKEEPING_CREATE),
    validate(housekeepingValidation.createHousekeepingLog),
    getHousekeepingController().createHousekeepingLog
  )
  .get(
    auth(PERMISSIONS.HOUSEKEEPING_READ),
    validate(housekeepingValidation.getHousekeepingLogs),
    getHousekeepingController().getHousekeepingLogs
  );

/**
 * @swagger
 * /housekeeping/pending:
 *   get:
 *     summary: Get pending rooms that need cleaning
 *     tags: [Housekeeping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: List of pending rooms
 *       "401":
 *         description: Unauthorized
 */
router.get(
  '/pending',
  auth(PERMISSIONS.HOUSEKEEPING_READ),
  validate(housekeepingValidation.getPendingRooms),
  getHousekeepingController().getPendingRooms
);

/**
 * @swagger
 * /housekeeping/my-tasks:
 *   get:
 *     summary: Get current user's housekeeping tasks
 *     tags: [Housekeeping]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: List of assigned tasks
 *       "401":
 *         description: Unauthorized
 */
router.get(
  '/my-tasks',
  auth(PERMISSIONS.HOUSEKEEPING_READ),
  getHousekeepingController().getMyTasks
);

/**
 * @swagger
 * /housekeeping/{logId}:
 *   get:
 *     summary: Get housekeeping log by ID
 *     tags: [Housekeeping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Housekeeping log details
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Log not found
 */
router
  .route('/:logId')
  .get(
    auth(PERMISSIONS.HOUSEKEEPING_READ),
    validate(housekeepingValidation.getHousekeepingLog),
    getHousekeepingController().getHousekeepingLog
  );

/**
 * @swagger
 * /housekeeping/{logId}/start:
 *   post:
 *     summary: Start cleaning a room
 *     tags: [Housekeeping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       "200":
 *         description: Cleaning started successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:logId/start',
  auth(PERMISSIONS.HOUSEKEEPING_UPDATE),
  validate(housekeepingValidation.startCleaning),
  getHousekeepingController().startCleaning
);

/**
 * @swagger
 * /housekeeping/{logId}/complete:
 *   post:
 *     summary: Mark cleaning as complete
 *     tags: [Housekeeping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       "200":
 *         description: Cleaning marked as complete
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:logId/complete',
  auth(PERMISSIONS.HOUSEKEEPING_UPDATE),
  validate(housekeepingValidation.completeCleaning),
  getHousekeepingController().completeCleaning
);

/**
 * @swagger
 * /housekeeping/{logId}/inspect:
 *   post:
 *     summary: Inspect a cleaned room
 *     tags: [Housekeeping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isApproved:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Room inspection completed
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:logId/inspect',
  auth(PERMISSIONS.HOUSEKEEPING_UPDATE),
  validate(housekeepingValidation.inspectRoom),
  getHousekeepingController().inspectRoom
);

/**
 * @swagger
 * /housekeeping/{logId}/assign:
 *   post:
 *     summary: Assign room to housekeeper
 *     tags: [Housekeeping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *             properties:
 *               employeeId:
 *                 type: integer
 *     responses:
 *       "200":
 *         description: Room assigned successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:logId/assign',
  auth(PERMISSIONS.HOUSEKEEPING_UPDATE),
  validate(housekeepingValidation.assignHousekeeper),
  getHousekeepingController().assignHousekeeper
);

/**
 * @swagger
 * /housekeeping/bulk-assign:
 *   post:
 *     summary: Bulk assign rooms to housekeepers
 *     tags: [Housekeeping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignments
 *             properties:
 *               assignments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     logId:
 *                       type: integer
 *                     employeeId:
 *                       type: integer
 *     responses:
 *       "200":
 *         description: Bulk assignment completed
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/bulk-assign',
  auth(PERMISSIONS.HOUSEKEEPING_UPDATE),
  validate(housekeepingValidation.bulkAssign),
  getHousekeepingController().bulkAssign
);

export default router;
