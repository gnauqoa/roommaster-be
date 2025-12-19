import express from 'express';
import validate from 'middlewares/validate';
import reservationValidation from 'validations/reservation.validation';
import { getReservationController } from '../../core/bootstrap';
import auth from 'middlewares/auth';
import { PERMISSIONS } from 'config/roles';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Reservations
 *     description: Reservation management endpoints
 */

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - roomTypeId
 *               - checkInDate
 *               - checkOutDate
 *               - numberOfGuests
 *             properties:
 *               customerId:
 *                 type: integer
 *               roomTypeId:
 *                 type: integer
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *               numberOfGuests:
 *                 type: integer
 *               specialRequests:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Reservation created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get all reservations
 *     tags: [Reservations]
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
 *           enum: [PENDING, CONFIRMED, CANCELLED, CHECKED_IN, CHECKED_OUT]
 *     responses:
 *       "200":
 *         description: List of reservations
 *       "401":
 *         description: Unauthorized
 */
router
  .route('/')
  .post(
    auth(PERMISSIONS.RESERVATION_CREATE),
    validate(reservationValidation.createReservation),
    getReservationController().createReservation
  )
  .get(
    auth(PERMISSIONS.RESERVATION_READ),
    validate(reservationValidation.getReservations),
    getReservationController().getReservations
  );

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
 *         description: List of arrivals for today
 *       "401":
 *         description: Unauthorized
 */
router.get(
  '/arrivals',
  auth(PERMISSIONS.RESERVATION_READ),
  getReservationController().getTodayArrivals
);

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
 *         description: List of departures for today
 *       "401":
 *         description: Unauthorized
 */
router.get(
  '/departures',
  auth(PERMISSIONS.RESERVATION_READ),
  getReservationController().getTodayDepartures
);

/**
 * @swagger
 * /reservations/{reservationId}:
 *   get:
 *     summary: Get reservation by ID
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Reservation details
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Reservation not found
 *   patch:
 *     summary: Update reservation
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
 *             properties:
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *               numberOfGuests:
 *                 type: integer
 *               specialRequests:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Reservation updated successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Reservation not found
 */
router
  .route('/:reservationId')
  .get(
    auth(PERMISSIONS.RESERVATION_READ),
    validate(reservationValidation.getReservation),
    getReservationController().getReservation
  )
  .patch(
    auth(PERMISSIONS.RESERVATION_UPDATE),
    validate(reservationValidation.updateReservation),
    getReservationController().updateReservation
  );

/**
 * @swagger
 * /reservations/{reservationId}/confirm:
 *   post:
 *     summary: Confirm reservation
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
 *     responses:
 *       "200":
 *         description: Reservation confirmed successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:reservationId/confirm',
  auth(PERMISSIONS.RESERVATION_UPDATE),
  validate(reservationValidation.confirmReservation),
  getReservationController().confirmReservation
);

/**
 * @swagger
 * /reservations/{reservationId}/cancel:
 *   post:
 *     summary: Cancel reservation
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
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Reservation cancelled successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:reservationId/cancel',
  auth(PERMISSIONS.RESERVATION_UPDATE),
  validate(reservationValidation.cancelReservation),
  getReservationController().cancelReservation
);

/**
 * @swagger
 * /reservations/{reservationId}/check-in:
 *   post:
 *     summary: Check in reservation
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
 *             properties:
 *               roomId:
 *                 type: integer
 *     responses:
 *       "200":
 *         description: Checked in successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/:reservationId/check-in',
  auth(PERMISSIONS.STAY_RECORD_CREATE),
  validate(reservationValidation.checkInReservation),
  getReservationController().checkInReservation
);

export default router;
