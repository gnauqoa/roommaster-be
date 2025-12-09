import express from 'express';
import validate from '../../middlewares/validate';
import housekeepingValidation from '../../validations/housekeeping.validation';
import { housekeepingController } from '../../controllers';
import auth from '../../middlewares/auth';
import { PERMISSIONS } from '../../config/roles';

const router = express.Router();

router
  .route('/')
  .post(
    auth(PERMISSIONS.HOUSEKEEPING_CREATE),
    validate(housekeepingValidation.createHousekeepingLog),
    housekeepingController.createHousekeepingLog
  )
  .get(
    auth(PERMISSIONS.HOUSEKEEPING_READ),
    validate(housekeepingValidation.getHousekeepingLogs),
    housekeepingController.getHousekeepingLogs
  );

router.get(
  '/pending',
  auth(PERMISSIONS.HOUSEKEEPING_READ),
  validate(housekeepingValidation.getPendingRooms),
  housekeepingController.getPendingRooms
);

router.get('/my-tasks', auth(PERMISSIONS.HOUSEKEEPING_READ), housekeepingController.getMyTasks);

router
  .route('/:logId')
  .get(
    auth(PERMISSIONS.HOUSEKEEPING_READ),
    validate(housekeepingValidation.getHousekeepingLog),
    housekeepingController.getHousekeepingLog
  );

router.post(
  '/:logId/start',
  auth(PERMISSIONS.HOUSEKEEPING_UPDATE),
  validate(housekeepingValidation.startCleaning),
  housekeepingController.startCleaning
);

router.post(
  '/:logId/complete',
  auth(PERMISSIONS.HOUSEKEEPING_UPDATE),
  validate(housekeepingValidation.completeCleaning),
  housekeepingController.completeCleaning
);

router.post(
  '/:logId/inspect',
  auth(PERMISSIONS.HOUSEKEEPING_UPDATE),
  validate(housekeepingValidation.inspectRoom),
  housekeepingController.inspectRoom
);

router.post(
  '/:logId/assign',
  auth(PERMISSIONS.HOUSEKEEPING_UPDATE),
  validate(housekeepingValidation.assignHousekeeper),
  housekeepingController.assignHousekeeper
);

router.post(
  '/bulk-assign',
  auth(PERMISSIONS.HOUSEKEEPING_UPDATE),
  validate(housekeepingValidation.bulkAssign),
  housekeepingController.bulkAssign
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Housekeeping
 *   description: Housekeeping management
 */

/**
 * @swagger
 * /housekeeping:
 *   post:
 *     summary: Create a housekeeping task
 *     tags: [Housekeeping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateHousekeepingLog'
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Get all housekeeping logs
 *     tags: [Housekeeping]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /housekeeping/my-tasks:
 *   get:
 *     summary: Get my assigned housekeeping tasks
 *     tags: [Housekeeping]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

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
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /housekeeping/{logId}/complete:
 *   post:
 *     summary: Complete cleaning a room
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
