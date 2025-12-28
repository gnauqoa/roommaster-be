import express from 'express';
import validate from 'middlewares/validate';
import { roomValidation } from 'validations';
import CustomerRoomController from 'controllers/customer/customer.room.controller';
import { container, TOKENS } from 'core/container';
import { RoomService } from 'services/room.service';
import { authCustomer } from 'middlewares/auth';

const router = express.Router();

// Resolve dependencies from container
const roomService = container.resolve<RoomService>(TOKENS.RoomService);
const customerRoomController = new CustomerRoomController(roomService);

/**
 * @swagger
 * tags:
 *   name: Customer Rooms
 *   description: Customer room search endpoints
 */

/**
 * @swagger
 * /customer/rooms:
 *   get:
 *     summary: Search available rooms
 *     description: Search and filter available rooms with pagination
 *     tags: [Customer Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by room number
 *       - in: query
 *         name: floor
 *         schema:
 *           type: integer
 *         description: Filter by floor number
 *       - in: query
 *         name: roomTypeId
 *         schema:
 *           type: string
 *         description: Filter by room type ID
 *       - in: query
 *         name: minCapacity
 *         schema:
 *           type: integer
 *         description: Minimum capacity
 *       - in: query
 *         name: maxCapacity
 *         schema:
 *           type: integer
 *         description: Maximum capacity
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per night
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per night
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of available rooms
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authCustomer,
  validate(roomValidation.searchRooms),
  customerRoomController.searchRooms
);

/**
 * @swagger
 * /customer/rooms/{roomId}:
 *   get:
 *     summary: Get room details
 *     description: Get detailed information about a specific room
 *     tags: [Customer Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 */
router.get(
  '/:roomId',
  authCustomer,
  validate(roomValidation.getRoom),
  customerRoomController.getRoomDetails
);

export default router;
