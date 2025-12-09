import express from 'express';
import validate from 'middlewares/validate';
import stayRecordValidation from 'validations/stay-record.validation';
import { stayRecordController } from 'controllers';
import auth from 'middlewares/auth';
import { PERMISSIONS } from 'config/roles';

const router = express.Router();

// Walk-in check-in
router
  .route('/')
  .post(
    auth(PERMISSIONS.STAY_RECORD_CREATE),
    validate(stayRecordValidation.createStayRecord),
    stayRecordController.createStayRecord
  )
  .get(
    auth(PERMISSIONS.STAY_RECORD_READ),
    validate(stayRecordValidation.getStayRecords),
    stayRecordController.getStayRecords
  );

router.get('/guests', auth(PERMISSIONS.STAY_RECORD_READ), stayRecordController.getCurrentGuests);

router
  .route('/:stayRecordId')
  .get(
    auth(PERMISSIONS.STAY_RECORD_READ),
    validate(stayRecordValidation.getStayRecord),
    stayRecordController.getStayRecord
  );

router.post(
  '/:stayRecordId/check-out',
  auth(PERMISSIONS.STAY_RECORD_UPDATE),
  validate(stayRecordValidation.checkOut),
  stayRecordController.checkOut
);

router.post(
  '/details/:stayDetailId/check-out',
  auth(PERMISSIONS.STAY_RECORD_UPDATE),
  validate(stayRecordValidation.checkOutRoom),
  stayRecordController.checkOutRoom
);

router.post(
  '/details/:stayDetailId/move',
  auth(PERMISSIONS.STAY_RECORD_UPDATE),
  validate(stayRecordValidation.moveRoom),
  stayRecordController.moveRoom
);

router.post(
  '/details/:stayDetailId/extend',
  auth(PERMISSIONS.STAY_RECORD_UPDATE),
  validate(stayRecordValidation.extendStay),
  stayRecordController.extendStay
);

router.post(
  '/details/:stayDetailId/guests',
  auth(PERMISSIONS.STAY_RECORD_UPDATE),
  validate(stayRecordValidation.addGuestToRoom),
  stayRecordController.addGuest
);

export default router;

/**
 * @swagger
 * tags:
 *   name: StayRecords
 *   description: Stay record and check-in/out management
 */

/**
 * @swagger
 * /stay-records:
 *   post:
 *     summary: Create a walk-in stay record (direct check-in without reservation)
 *     tags: [StayRecords]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStayRecord'
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Get all stay records
 *     tags: [StayRecords]
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
 * /stay-records/guests:
 *   get:
 *     summary: Get current guests in residence
 *     tags: [StayRecords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roomId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: floor
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
 * /stay-records/{stayRecordId}/check-out:
 *   post:
 *     summary: Check out a stay record (all rooms)
 *     tags: [StayRecords]
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
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /stay-records/details/{stayDetailId}/move:
 *   post:
 *     summary: Move guest to a different room
 *     tags: [StayRecords]
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
 *               reason:
 *                 type: string
 *     responses:
 *       "200":
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
