import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { shiftValidation } from '../../validations';
import { shiftController } from '../../controllers';
import { PERMISSIONS } from '../../config/roles';

const router = express.Router();

// Work Shift CRUD
router
  .route('/')
  .post(
    auth(PERMISSIONS.SHIFT_CREATE),
    validate(shiftValidation.createWorkShift),
    shiftController.createWorkShift
  )
  .get(
    auth(PERMISSIONS.SHIFT_READ),
    validate(shiftValidation.getWorkShifts),
    shiftController.getWorkShifts
  );

router
  .route('/:shiftId')
  .get(
    auth(PERMISSIONS.SHIFT_READ),
    validate(shiftValidation.getWorkShift),
    shiftController.getWorkShift
  )
  .patch(
    auth(PERMISSIONS.SHIFT_UPDATE),
    validate(shiftValidation.updateWorkShift),
    shiftController.updateWorkShift
  )
  .delete(
    auth(PERMISSIONS.SHIFT_DELETE),
    validate(shiftValidation.deleteWorkShift),
    shiftController.deleteWorkShift
  );

// Shift session management
router.post(
  '/sessions/open',
  auth(PERMISSIONS.SHIFT_SESSION_MANAGE),
  validate(shiftValidation.openShiftSession),
  shiftController.openSession
);

router.post(
  '/sessions/:sessionId/close',
  auth(PERMISSIONS.SHIFT_SESSION_MANAGE),
  validate(shiftValidation.closeShiftSession),
  shiftController.closeSession
);

router.post(
  '/sessions/:sessionId/approve',
  auth(PERMISSIONS.SHIFT_SESSION_APPROVE),
  validate(shiftValidation.approveShiftSession),
  shiftController.approveSession
);

router.get(
  '/sessions',
  auth(PERMISSIONS.SHIFT_SESSION_READ),
  validate(shiftValidation.getShiftSessions),
  shiftController.getSessions
);

router.get(
  '/sessions/me',
  auth(PERMISSIONS.SHIFT_SESSION_MANAGE),
  validate(shiftValidation.getMyCurrentSession),
  shiftController.getCurrentSession
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Shifts
 *   description: Shift and shift session management
 */

/**
 * @swagger
 * /shifts:
 *   post:
 *     summary: Create a shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - startTime
 *               - endTime
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: time
 *                 description: HH:mm format
 *               endTime:
 *                 type: string
 *                 format: time
 *                 description: HH:mm format
 *               description:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Created
 *   get:
 *     summary: Get all shifts
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 */

/**
 * @swagger
 * /shifts/{shiftId}:
 *   get:
 *     summary: Get shift by ID
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: OK
 *   patch:
 *     summary: Update shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
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
 *         description: OK
 *   delete:
 *     summary: Delete shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shiftId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "204":
 *         description: No Content
 */

/**
 * @swagger
 * /shifts/sessions/open:
 *   post:
 *     summary: Open a new shift session
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shiftId
 *               - openingCash
 *             properties:
 *               shiftId:
 *                 type: integer
 *               openingCash:
 *                 type: number
 *     responses:
 *       "201":
 *         description: Created
 *       "400":
 *         description: Employee already has an open session
 */

/**
 * @swagger
 * /shifts/sessions/{sessionId}/close:
 *   post:
 *     summary: Close a shift session
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
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
 *               - closingCash
 *             properties:
 *               closingCash:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       "200":
 *         description: OK
 */

/**
 * @swagger
 * /shifts/sessions/{sessionId}/approve:
 *   post:
 *     summary: Approve a closed shift session
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: OK
 *       "400":
 *         description: Session must be closed first
 */

/**
 * @swagger
 * /shifts/sessions:
 *   get:
 *     summary: Get shift sessions
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shiftId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED, APPROVED]
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       "200":
 *         description: OK
 */
