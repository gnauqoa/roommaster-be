import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { reportValidation } from '../../validations';
import { nightlyController } from '../../controllers';
import { PERMISSIONS } from '../../config/roles';

const router = express.Router();

/**
 * Manual trigger for nightly jobs (for admin/testing purposes)
 * In production, this should be triggered by a cron job
 */
router.post('/run-all', auth(PERMISSIONS.NIGHTLY_JOB_RUN), nightlyController.runNightlyJobs);

router.post('/room-charges', auth(PERMISSIONS.NIGHTLY_JOB_RUN), nightlyController.postRoomCharges);

router.post(
  '/extra-person-charges',
  auth(PERMISSIONS.NIGHTLY_JOB_RUN),
  nightlyController.postExtraPersonCharges
);

router.post('/no-show', auth(PERMISSIONS.NIGHTLY_JOB_RUN), nightlyController.markNoShows);

router.post(
  '/daily-snapshot',
  auth(PERMISSIONS.NIGHTLY_JOB_RUN),
  validate(reportValidation.createSnapshot),
  nightlyController.createSnapshot
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Nightly
 *   description: Nightly job endpoints (manual triggers)
 */

/**
 * @swagger
 * /nightly/run-all:
 *   post:
 *     summary: Run all nightly jobs
 *     description: |
 *       Runs all nightly jobs in sequence:
 *       1. Post room charges for all in-house guests
 *       2. Post extra person charges if applicable
 *       3. Process no-show reservations
 *       4. Create daily snapshot for reports
 *     tags: [Nightly]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 roomChargesPosted:
 *                   type: integer
 *                 extraPersonChargesPosted:
 *                   type: integer
 *                 noShowsProcessed:
 *                   type: integer
 *                 snapshotCreated:
 *                   type: boolean
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /nightly/room-charges:
 *   post:
 *     summary: Post room charges for in-house guests
 *     tags: [Nightly]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 */

/**
 * @swagger
 * /nightly/extra-person-charges:
 *   post:
 *     summary: Post extra person charges
 *     tags: [Nightly]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 */

/**
 * @swagger
 * /nightly/no-show:
 *   post:
 *     summary: Process no-show reservations
 *     tags: [Nightly]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 */

/**
 * @swagger
 * /nightly/daily-snapshot:
 *   post:
 *     summary: Create daily snapshot for reports
 *     tags: [Nightly]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 */
