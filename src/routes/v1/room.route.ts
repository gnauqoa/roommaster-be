import express from 'express';
import validate from 'middlewares/validate';
import roomValidation from 'validations/room.validation';
import { roomController } from 'controllers';
import auth from 'middlewares/auth';
import { PERMISSIONS } from 'config/roles';

const router = express.Router();

// Room Types
router
  .route('/types')
  .post(
    auth(PERMISSIONS.ROOM_TYPE_CREATE),
    validate(roomValidation.createRoomType),
    roomController.createRoomType
  )
  .get(
    auth(PERMISSIONS.ROOM_TYPE_READ),
    validate(roomValidation.getRoomTypes),
    roomController.getRoomTypes
  );

router
  .route('/types/:roomTypeId')
  .get(
    auth(PERMISSIONS.ROOM_TYPE_READ),
    validate(roomValidation.getRoomType),
    roomController.getRoomType
  )
  .patch(
    auth(PERMISSIONS.ROOM_TYPE_UPDATE),
    validate(roomValidation.updateRoomType),
    roomController.updateRoomType
  )
  .delete(
    auth(PERMISSIONS.ROOM_TYPE_DELETE),
    validate(roomValidation.deleteRoomType),
    roomController.deleteRoomType
  );

// Rooms
router
  .route('/')
  .post(
    auth(PERMISSIONS.ROOM_CREATE),
    validate(roomValidation.createRoom),
    roomController.createRoom
  )
  .get(auth(PERMISSIONS.ROOM_READ), validate(roomValidation.getRooms), roomController.getRooms);

router.get(
  '/available',
  auth(PERMISSIONS.ROOM_READ),
  validate(roomValidation.getAvailableRooms),
  roomController.getAvailableRooms
);
router.get(
  '/availability',
  auth(PERMISSIONS.ROOM_READ),
  validate(roomValidation.getAvailableRooms),
  roomController.checkAvailability
);

router
  .route('/:roomId')
  .get(auth(PERMISSIONS.ROOM_READ), validate(roomValidation.getRoom), roomController.getRoom)
  .patch(
    auth(PERMISSIONS.ROOM_UPDATE),
    validate(roomValidation.updateRoom),
    roomController.updateRoom
  )
  .delete(
    auth(PERMISSIONS.ROOM_DELETE),
    validate(roomValidation.deleteRoom),
    roomController.deleteRoom
  );

router.patch(
  '/:roomId/status',
  auth(PERMISSIONS.ROOM_UPDATE),
  validate(roomValidation.updateRoomStatus),
  roomController.updateRoomStatus
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: Room and Room Type management
 */

/**
 * @swagger
 * /rooms/types:
 *   post:
 *     summary: Create a room type
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoomType'
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Get all room types
 *     tags: [Rooms]
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
 * /rooms:
 *   post:
 *     summary: Create a room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoom'
 *     responses:
 *       "201":
 *         description: Created
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
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
 * /rooms/available:
 *   get:
 *     summary: Get available rooms for a date range
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: checkInDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: checkOutDate
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
 *         description: OK
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
