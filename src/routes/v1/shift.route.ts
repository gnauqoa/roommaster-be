import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { shiftValidation } from '../../validations';
import { getShiftController } from '../../core/bootstrap';
import { PERMISSIONS } from '../../config/roles';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Shifts
 *     description: Work shift management and shift sessions
 */

// ===== WORK SHIFTS =====

/**
 * @swagger
 * /shifts:
 *   post:
 *     summary: Create a new work shift
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
 *               - name
 *               - startTime
 *               - endTime
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Morning Shift"
 *               startTime:
 *                 type: string
 *                 format: time
 *                 example: "08:00"
 *               endTime:
 *                 type: string
 *                 format: time
 *                 example: "16:00"
 *     responses:
 *       "201":
 *         description: Work shift created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get all work shifts
 *     tags: [Shifts]
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
 *         description: List of work shifts
 *       "401":
 *         description: Unauthorized
 */
router
  .route('/')
  .post(
    auth(PERMISSIONS.SHIFT_CREATE),
    validate(shiftValidation.createWorkShift),
    getShiftController().createWorkShift
  )
  .get(
    auth(PERMISSIONS.SHIFT_READ),
    validate(shiftValidation.getWorkShifts),
    getShiftController().getWorkShifts
  );

/**
 * @swagger
 * /shifts/{shiftId}:
 *   get:
 *     summary: Get work shift by ID
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
 *         description: Work shift details
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Work shift not found
 *   patch:
 *     summary: Update work shift
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
 *             properties:
 *               name:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: time
 *               endTime:
 *                 type: string
 *                 format: time
 *     responses:
 *       "200":
 *         description: Work shift updated successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Work shift not found
 *   delete:
 *     summary: Delete work shift
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
 *         description: Work shift deleted successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Work shift not found
 */
router
  .route('/:shiftId')
  .get(
    auth(PERMISSIONS.SHIFT_READ),
    validate(shiftValidation.getWorkShift),
    getShiftController().getWorkShift
  )
  .patch(
    auth(PERMISSIONS.SHIFT_UPDATE),
    validate(shiftValidation.updateWorkShift),
    getShiftController().updateWorkShift
  )
  .delete(
    auth(PERMISSIONS.SHIFT_DELETE),
    validate(shiftValidation.deleteWorkShift),
    getShiftController().deleteWorkShift
  );

// ===== SHIFT SESSIONS =====

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
 *               - employeeId
 *             properties:
 *               shiftId:
 *                 type: integer
 *               employeeId:
 *                 type: integer
 *     responses:
 *       "201":
 *         description: Shift session opened successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/sessions/open',
  auth(PERMISSIONS.SHIFT_SESSION_MANAGE),
  validate(shiftValidation.openShiftSession),
  getShiftController().openSession
);

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
 *     responses:
 *       "200":
 *         description: Shift session closed successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/sessions/:sessionId/close',
  auth(PERMISSIONS.SHIFT_SESSION_MANAGE),
  validate(shiftValidation.closeShiftSession),
  getShiftController().closeSession
);

/**
 * @swagger
 * /shifts/sessions/{sessionId}/approve:
 *   post:
 *     summary: Approve a shift session
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
 *     responses:
 *       "200":
 *         description: Shift session approved successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/sessions/:sessionId/approve',
  auth(PERMISSIONS.SHIFT_SESSION_APPROVE),
  validate(shiftValidation.approveShiftSession),
  getShiftController().approveSession
);

/**
 * @swagger
 * /shifts/sessions:
 *   get:
 *     summary: Get all shift sessions
 *     tags: [Shifts]
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
 *         description: List of shift sessions
 *       "401":
 *         description: Unauthorized
 */
router.get(
  '/sessions',
  auth(PERMISSIONS.SHIFT_SESSION_READ),
  validate(shiftValidation.getShiftSessions),
  getShiftController().getSessions
);

/**
 * @swagger
 * /shifts/sessions/me:
 *   get:
 *     summary: Get current user's shift session
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Current shift session details
 *       "401":
 *         description: Unauthorized
 */
router.get(
  '/sessions/me',
  auth(PERMISSIONS.SHIFT_SESSION_MANAGE),
  validate(shiftValidation.getMyCurrentSession),
  getShiftController().getCurrentSession
);

export default router;
