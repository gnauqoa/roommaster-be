import express from 'express';
import validate from 'middlewares/validate';
import roomValidation from 'validations/room.validation';
import { getRoomController } from '../../core/bootstrap';
import auth from 'middlewares/auth';
import { PERMISSIONS } from 'config/roles';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Rooms
 *     description: Room and room type management
 */

// ===== ROOM TYPES =====

/**
 * @swagger
 * /rooms/types:
 *   post:
 *     summary: Create a new room type
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - basePrice
 *               - maxGuests
 *             properties:
 *               code:
 *                 type: string
 *                 example: "SINGLE"
 *               name:
 *                 type: string
 *                 example: "Single Room"
 *               basePrice:
 *                 type: number
 *                 format: decimal
 *                 example: 100.00
 *               maxGuests:
 *                 type: integer
 *                 example: 1
 *               description:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Room type created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden - insufficient permissions
 *   get:
 *     summary: Get all room types
 *     tags: [Rooms]
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
 *         description: List of room types
 *       "401":
 *         description: Unauthorized
 */
router
  .route('/types')
  .post(
    auth(PERMISSIONS.ROOM_TYPE_CREATE),
    validate(roomValidation.createRoomType),
    getRoomController().createRoomType
  )
  .get(
    auth(PERMISSIONS.ROOM_TYPE_READ),
    validate(roomValidation.getRoomTypes),
    getRoomController().getRoomTypes
  );

/**
 * @swagger
 * /rooms/types/{roomTypeId}:
 *   get:
 *     summary: Get room type by ID
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomTypeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Room type details
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Room type not found
 *   patch:
 *     summary: Update room type
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomTypeId
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
 *               basePrice:
 *                 type: number
 *                 format: decimal
 *               maxGuests:
 *                 type: integer
 *     responses:
 *       "200":
 *         description: Room type updated successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Room type not found
 *   delete:
 *     summary: Delete room type
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomTypeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "204":
 *         description: Room type deleted successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Room type not found
 */
router
  .route('/types/:roomTypeId')
  .get(
    auth(PERMISSIONS.ROOM_TYPE_READ),
    validate(roomValidation.getRoomType),
    getRoomController().getRoomType
  )
  .patch(
    auth(PERMISSIONS.ROOM_TYPE_UPDATE),
    validate(roomValidation.updateRoomType),
    getRoomController().updateRoomType
  )
  .delete(
    auth(PERMISSIONS.ROOM_TYPE_DELETE),
    validate(roomValidation.deleteRoomType),
    getRoomController().deleteRoomType
  );

// ===== ROOMS =====

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomNumber
 *               - roomTypeId
 *               - floor
 *             properties:
 *               roomNumber:
 *                 type: string
 *                 example: "101"
 *               roomTypeId:
 *                 type: integer
 *                 example: 1
 *               floor:
 *                 type: integer
 *                 example: 1
 *               notes:
 *                 type: string
 *     responses:
 *       "201":
 *         description: Room created successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
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
 *         name: roomTypeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, OCCUPIED, MAINTENANCE, DIRTY]
 *     responses:
 *       "200":
 *         description: List of rooms
 *       "401":
 *         description: Unauthorized
 */
router
  .route('/')
  .post(
    auth(PERMISSIONS.ROOM_CREATE),
    validate(roomValidation.createRoom),
    getRoomController().createRoom
  )
  .get(
    auth(PERMISSIONS.ROOM_READ),
    validate(roomValidation.getRooms),
    getRoomController().getRooms
  );

/**
 * @swagger
 * /rooms/available:
 *   get:
 *     summary: Get available rooms
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
 *         description: Check-in date
 *       - in: query
 *         name: checkOutDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-out date
 *       - in: query
 *         name: roomTypeId
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Available rooms
 *       "401":
 *         description: Unauthorized
 */
router.get(
  '/available',
  auth(PERMISSIONS.ROOM_READ),
  validate(roomValidation.getAvailableRooms),
  getRoomController().getAvailableRooms
);

/**
 * @swagger
 * /rooms/availability:
 *   get:
 *     summary: Check room availability
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
 *         description: Availability check result
 *       "401":
 *         description: Unauthorized
 */
router.get(
  '/availability',
  auth(PERMISSIONS.ROOM_READ),
  validate(roomValidation.getAvailableRooms),
  getRoomController().checkAvailability
);

/**
 * @swagger
 * /rooms/{roomId}:
 *   get:
 *     summary: Get room by ID
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Room details
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Room not found
 *   patch:
 *     summary: Update room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
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
 *               roomNumber:
 *                 type: string
 *               roomTypeId:
 *                 type: integer
 *               floor:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Room updated successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Room not found
 *   delete:
 *     summary: Delete room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "204":
 *         description: Room deleted successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Room not found
 */
router
  .route('/:roomId')
  .get(auth(PERMISSIONS.ROOM_READ), validate(roomValidation.getRoom), getRoomController().getRoom)
  .patch(
    auth(PERMISSIONS.ROOM_UPDATE),
    validate(roomValidation.updateRoom),
    getRoomController().updateRoom
  )
  .delete(
    auth(PERMISSIONS.ROOM_DELETE),
    validate(roomValidation.deleteRoom),
    getRoomController().deleteRoom
  );

/**
 * @swagger
 * /rooms/{roomId}/status:
 *   patch:
 *     summary: Update room status
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, OCCUPIED, MAINTENANCE, DIRTY]
 *                 example: "MAINTENANCE"
 *     responses:
 *       "200":
 *         description: Room status updated successfully
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden
 *       "404":
 *         description: Room not found
 */
router.patch(
  '/:roomId/status',
  auth(PERMISSIONS.ROOM_UPDATE),
  validate(roomValidation.updateRoomStatus),
  getRoomController().updateRoomStatus
);

export default router;
