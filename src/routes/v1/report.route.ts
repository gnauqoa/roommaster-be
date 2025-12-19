import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { reportValidation } from '../../validations';
import { getReportController } from '../../core/bootstrap';
import { PERMISSIONS } from '../../config/roles';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Reports
 *     description: Business reporting and analytics
 */

/**
 * @swagger
 * /reports/daily-snapshot:
 *   get:
 *     summary: Get daily snapshot report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       "200":
 *         description: Daily snapshot data
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.get(
  '/daily-snapshot',
  auth(PERMISSIONS.REPORT_READ),
  validate(reportValidation.getSnapshot),
  getReportController().getDailySnapshot
);

/**
 * @swagger
 * /reports/snapshots:
 *   get:
 *     summary: Get daily snapshots
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
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
 *         description: List of daily snapshots
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.get(
  '/snapshots',
  auth(PERMISSIONS.REPORT_READ),
  validate(reportValidation.getSnapshots),
  getReportController().getSnapshots
);

/**
 * @swagger
 * /reports/occupancy:
 *   get:
 *     summary: Get occupancy report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: roomTypeId
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Occupancy report data
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.get(
  '/occupancy',
  auth(PERMISSIONS.REPORT_READ),
  validate(reportValidation.getOccupancyReport),
  getReportController().getOccupancyReport
);

/**
 * @swagger
 * /reports/revenue:
 *   get:
 *     summary: Get revenue report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       "200":
 *         description: Revenue report data
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.get(
  '/revenue',
  auth(PERMISSIONS.REPORT_READ),
  validate(reportValidation.getRevenueReport),
  getReportController().getRevenueReport
);

/**
 * @swagger
 * /reports/revenue-by-room-type:
 *   get:
 *     summary: Get revenue by room type report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       "200":
 *         description: Revenue breakdown by room type
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.get(
  '/revenue-by-room-type',
  auth(PERMISSIONS.REPORT_READ),
  validate(reportValidation.getRevenueByRoomType),
  getReportController().getRevenueByRoomType
);

/**
 * @swagger
 * /reports/bookings:
 *   get:
 *     summary: Get booking report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       "200":
 *         description: Booking report data
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.get(
  '/bookings',
  auth(PERMISSIONS.REPORT_READ),
  validate(reportValidation.getBookingReport),
  getReportController().getBookingReport
);

/**
 * @swagger
 * /reports/dashboard:
 *   get:
 *     summary: Get dashboard data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Dashboard data with key metrics
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.get('/dashboard', auth(PERMISSIONS.REPORT_READ), getReportController().getDashboard);

export default router;
