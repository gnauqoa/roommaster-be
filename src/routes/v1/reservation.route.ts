import express from 'express';
import validate from 'middlewares/validate';
import reservationValidation from 'validations/reservation.validation';
import { reservationController } from 'controllers';
import auth from 'middlewares/auth';
import { PERMISSIONS } from 'config/roles';

const router = express.Router();

router
  .route('/')
  .post(
    auth(PERMISSIONS.RESERVATION_CREATE),
    validate(reservationValidation.createReservation),
    reservationController.createReservation
  )
  .get(
    auth(PERMISSIONS.RESERVATION_READ),
    validate(reservationValidation.getReservations),
    reservationController.getReservations
  );

router.get('/arrivals', auth(PERMISSIONS.RESERVATION_READ), reservationController.getTodayArrivals);

router.get(
  '/departures',
  auth(PERMISSIONS.RESERVATION_READ),
  reservationController.getTodayDepartures
);

router
  .route('/:reservationId')
  .get(
    auth(PERMISSIONS.RESERVATION_READ),
    validate(reservationValidation.getReservation),
    reservationController.getReservation
  )
  .patch(
    auth(PERMISSIONS.RESERVATION_UPDATE),
    validate(reservationValidation.updateReservation),
    reservationController.updateReservation
  );

router.post(
  '/:reservationId/confirm',
  auth(PERMISSIONS.RESERVATION_UPDATE),
  validate(reservationValidation.confirmReservation),
  reservationController.confirmReservation
);

router.post(
  '/:reservationId/cancel',
  auth(PERMISSIONS.RESERVATION_UPDATE),
  validate(reservationValidation.cancelReservation),
  reservationController.cancelReservation
);

router.post(
  '/:reservationId/check-in',
  auth(PERMISSIONS.STAY_RECORD_CREATE),
  validate(reservationValidation.checkInReservation),
  reservationController.checkInReservation
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Reservation management
 */

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservation'
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Get all reservations
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, NO_SHOW]
 *       - in: query
 *         name: checkInDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: checkOutDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /reservations/arrivals:
 *   get:
 *     summary: Get today's arrivals
 *     tags: [Reservations]
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
 * /reservations/departures:
 *   get:
 *     summary: Get today's departures
 *     tags: [Reservations]
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
 * /reservations/{reservationId}/check-in:
 *   post:
 *     summary: Check in a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
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
 *               - roomAssignments
 *             properties:
 *               roomAssignments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     roomId:
 *                       type: integer
 *                     expectedCheckOut:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
