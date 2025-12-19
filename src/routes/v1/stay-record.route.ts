import express from 'express';
import validate from 'middlewares/validate';
import stayRecordValidation from 'validations/stay-record.validation';
import { getStayRecordController } from '../../core/bootstrap';
import auth from 'middlewares/auth';
import { PERMISSIONS } from 'config/roles';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Stay Records
 *     description: Stay records and guest check-in/check-out management
 */

/**
 * @swagger
 * /stay-records:
 *   post:
 *     summary: Create a new stay record (walk-in check-in)
 *     tags: [Stay Records]
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
 *               - roomId
 *               - checkInDate
 *               - expectedCheckOutDate
 *             properties:
 *               customerId:
 *                 type: integer
 *               roomId:
 *                 type: integer
 *               checkInDate:
 *                 type: string
 *                 format: date-time
 *               expectedCheckOutDate:
 *                 type: string
 *                 format: date
 *               numberOfGuests:
 *                 type: integer
 *     responses:
 *       "201":
 *         description: Stay record created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get all stay records
 *     tags: [Stay Records]
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
 *           enum: [CHECKED_IN, CHECKED_OUT]
 *     responses:
 *       "200":
 *         description: List of stay records
 *       "401":
 *         description: Unauthorized
 */
router
  .route('/')
  .post(
    auth(PERMISSIONS.STAY_RECORD_CREATE),
    validate(stayRecordValidation.createStayRecord),
    getStayRecordController().createStayRecord
  )
  .get(
    auth(PERMISSIONS.STAY_RECORD_READ),
    validate(stayRecordValidation.getStayRecords),
    getStayRecordController().getStayRecords
  );

/**
 * @swagger
 * /stay-records/guests:
 *   get:
 *     summary: Get current guests
 *     tags: [Stay Records]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: List of current guests checked in
 *       "401":
 *         description: Unauthorized
 */
router.get(
  '/guests',
  auth(PERMISSIONS.STAY_RECORD_READ),
  getStayRecordController().getCurrentGuests
);

/**
 * @swagger
 * /stay-records/{stayRecordId}:
 *   get:
 *     summary: Get stay record by ID
 *     tags: [Stay Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stayRecordId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Stay record details
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Stay record not found
 */
router
  .route('/:stayRecordId')
  .get(
    auth(PERMISSIONS.STAY_RECORD_READ),
    validate(stayRecordValidation.getStayRecord),
    getStayRecordController().getStayRecord
  );

/**
 * @swagger
 * /stay-records/{stayRecordId}/check-out:
 *   post:
 *     summary: Check out a guest
 *     tags: [Stay Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stayRecordId
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
 *         description: Guest checked out successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Stay record not found
 */
router.post(
  '/:stayRecordId/check-out',
  auth(PERMISSIONS.STAY_RECORD_UPDATE),
  validate(stayRecordValidation.checkOut),
  getStayRecordController().checkOut
);

/**
 * @swagger
 * /stay-records/details/{stayDetailId}/check-out:
 *   post:
 *     summary: Check out a specific room in a stay
 *     tags: [Stay Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stayDetailId
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
 *         description: Room checked out successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/details/:stayDetailId/check-out',
  auth(PERMISSIONS.STAY_RECORD_UPDATE),
  validate(stayRecordValidation.checkOutRoom),
  getStayRecordController().checkOutRoom
);

/**
 * @swagger
 * /stay-records/details/{stayDetailId}/move:
 *   post:
 *     summary: Move guest to another room
 *     tags: [Stay Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stayDetailId
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
 *               - newRoomId
 *             properties:
 *               newRoomId:
 *                 type: integer
 *     responses:
 *       "200":
 *         description: Guest moved successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/details/:stayDetailId/move',
  auth(PERMISSIONS.STAY_RECORD_UPDATE),
  validate(stayRecordValidation.moveRoom),
  getStayRecordController().moveRoom
);

/**
 * @swagger
 * /stay-records/details/{stayDetailId}/extend:
 *   post:
 *     summary: Extend guest stay
 *     tags: [Stay Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stayDetailId
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
 *               - newCheckOutDate
 *             properties:
 *               newCheckOutDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       "200":
 *         description: Stay extended successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/details/:stayDetailId/extend',
  auth(PERMISSIONS.STAY_RECORD_UPDATE),
  validate(stayRecordValidation.extendStay),
  getStayRecordController().extendStay
);

/**
 * @swagger
 * /stay-records/details/{stayDetailId}/guests:
 *   post:
 *     summary: Add guest to a room
 *     tags: [Stay Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stayDetailId
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
 *               - guestName
 *             properties:
 *               guestName:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Guest added successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 */
router.post(
  '/details/:stayDetailId/guests',
  auth(PERMISSIONS.STAY_RECORD_UPDATE),
  validate(stayRecordValidation.addGuestToRoom),
  getStayRecordController().addGuest
);

export default router;
