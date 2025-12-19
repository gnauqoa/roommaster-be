import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { reportValidation } from '../../validations';
import { getNightlyController } from '../../core/bootstrap';
import { PERMISSIONS } from '../../config/roles';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Nightly Jobs
 *     description: Nightly job operations and automated tasks
 */

/**
 * @swagger
 * /nightly/run-all:
 *   post:
 *     summary: Run all nightly jobs
 *     tags: [Nightly Jobs]
 *     security:
 *       - bearerAuth: []
 *     description: Manual trigger for all nightly jobs (for admin/testing purposes). In production, this should be triggered by a cron job.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       "200":
 *         description: All nightly jobs completed successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden - insufficient permissions
 */
router.post('/run-all', auth(PERMISSIONS.NIGHTLY_JOB_RUN), getNightlyController().runNightlyJobs);

/**
 * @swagger
 * /nightly/room-charges:
 *   post:
 *     summary: Post room charges
 *     tags: [Nightly Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       "200":
 *         description: Room charges posted successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/room-charges',
  auth(PERMISSIONS.NIGHTLY_JOB_RUN),
  getNightlyController().postRoomCharges
);

/**
 * @swagger
 * /nightly/extra-person-charges:
 *   post:
 *     summary: Post extra person charges
 *     tags: [Nightly Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       "200":
 *         description: Extra person charges posted successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/extra-person-charges',
  auth(PERMISSIONS.NIGHTLY_JOB_RUN),
  getNightlyController().postExtraPersonCharges
);

/**
 * @swagger
 * /nightly/no-show:
 *   post:
 *     summary: Mark no-shows
 *     tags: [Nightly Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       "200":
 *         description: No-shows marked successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post('/no-show', auth(PERMISSIONS.NIGHTLY_JOB_RUN), getNightlyController().markNoShows);

/**
 * @swagger
 * /nightly/daily-snapshot:
 *   post:
 *     summary: Create daily snapshot
 *     tags: [Nightly Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       "200":
 *         description: Daily snapshot created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/daily-snapshot',
  auth(PERMISSIONS.NIGHTLY_JOB_RUN),
  validate(reportValidation.createSnapshot),
  getNightlyController().createSnapshot
);

export default router;
