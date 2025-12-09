import express from 'express';
import auth from '../../middlewares/auth';
import validate from '../../middlewares/validate';
import { reportValidation } from '../../validations';
import { reportController } from '../../controllers';
import { PERMISSIONS } from '../../config/roles';

const router = express.Router();

router.get(
  '/daily-snapshot',
  auth(PERMISSIONS.REPORT_READ),
  validate(reportValidation.getSnapshot),
  reportController.getDailySnapshot
);

router.get(
  '/snapshots',
  auth(PERMISSIONS.REPORT_READ),
  validate(reportValidation.getSnapshots),
  reportController.getSnapshots
);

router.get(
  '/occupancy',
  auth(PERMISSIONS.REPORT_READ),
  validate(reportValidation.getOccupancyReport),
  reportController.getOccupancyReport
);

router.get(
  '/revenue',
  auth(PERMISSIONS.REPORT_READ),
  validate(reportValidation.getRevenueReport),
  reportController.getRevenueReport
);

router.get(
  '/revenue-by-room-type',
  auth(PERMISSIONS.REPORT_READ),
  validate(reportValidation.getRevenueByRoomType),
  reportController.getRevenueByRoomType
);

router.get(
  '/bookings',
  auth(PERMISSIONS.REPORT_READ),
  validate(reportValidation.getBookingReport),
  reportController.getBookingReport
);

router.get('/dashboard', auth(PERMISSIONS.REPORT_READ), reportController.getDashboard);

export default router;

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Reports and analytics endpoints
 */

/**
 * @swagger
 * /reports/daily-snapshot:
 *   get:
 *     summary: Get daily snapshot for a specific date
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
 *         description: The date to get snapshot for (YYYY-MM-DD)
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         description: Snapshot not found for the given date
 */

/**
 * @swagger
 * /reports/occupancy:
 *   get:
 *     summary: Get occupancy report for a date range
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
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                     endDate:
 *                       type: string
 *                 averageOccupancyRate:
 *                   type: number
 *                 totalRoomNights:
 *                   type: integer
 *                 occupiedRoomNights:
 *                   type: integer
 *                 dailyData:
 *                   type: array
 */

/**
 * @swagger
 * /reports/revenue:
 *   get:
 *     summary: Get revenue report for a date range
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
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: object
 *                 totalRevenue:
 *                   type: number
 *                 roomRevenue:
 *                   type: number
 *                 serviceRevenue:
 *                   type: number
 *                 revPAR:
 *                   type: number
 *                   description: Revenue Per Available Room
 *                 dailyData:
 *                   type: array
 */

/**
 * @swagger
 * /reports/dashboard:
 *   get:
 *     summary: Get operational dashboard with real-time metrics
 *     tags: [Reports]
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
 *                 todayOccupancy:
 *                   type: object
 *                 roomStatus:
 *                   type: object
 *                 arrivalsAndDepartures:
 *                   type: object
 *                 todayRevenue:
 *                   type: object
 */
