import express from 'express';
import { authEmployee } from 'middlewares/auth';
import validate from 'middlewares/validate';
import { roomValidation } from 'validations';
import { container, TOKENS } from 'core/container';
import { RoomService } from 'services';
import { RoomController } from 'controllers/employee/employee.room.controller';

const roomRoute = express.Router();

// Manually instantiate controller with dependencies
const roomService = container.resolve<RoomService>(TOKENS.RoomService);
const roomController = new RoomController(roomService);

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: Room management endpoints
 */

/**
 * @swagger
 * /employee/rooms:
 *   post:
 *     summary: Create a new room
 *     description: Create a new room assigned to a room type
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
 *               - floor
 *               - roomTypeId
 *             properties:
 *               roomNumber:
 *                 type: string
 *                 maxLength: 50
 *                 description: Unique room number
 *               floor:
 *                 type: integer
 *                 description: Floor number
 *               roomTypeId:
 *                 type: string
 *                 description: ID of the room type
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, RESERVED, OCCUPIED, CLEANING, MAINTENANCE, OUT_OF_SERVICE]
 *                 default: AVAILABLE
 *                 description: Room status
 *             example:
 *               roomNumber: "101"
 *               floor: 1
 *               roomTypeId: "clq1234567890abcdef"
 *               status: "AVAILABLE"
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "clq1234567890abcdef"
 *                     roomNumber:
 *                       type: string
 *                       example: "101"
 *                     floor:
 *                       type: integer
 *                       example: 1
 *                     status:
 *                       type: string
 *                       example: "AVAILABLE"
 *                     roomTypeId:
 *                       type: string
 *                     roomType:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         capacity:
 *                           type: integer
 *                         pricePerNight:
 *                           type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Room number already exists or room type not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Room type not found
 *
 *   get:
 *     summary: Get all rooms
 *     description: Retrieve a paginated list of rooms with optional filters
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by room number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, RESERVED, OCCUPIED, CLEANING, MAINTENANCE, OUT_OF_SERVICE]
 *         description: Filter by status
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
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [roomNumber, floor, status, createdAt, updatedAt]
 *           default: roomNumber
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Rooms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           roomNumber:
 *                             type: string
 *                           floor:
 *                             type: integer
 *                           status:
 *                             type: string
 *                           roomTypeId:
 *                             type: string
 *                           roomType:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               capacity:
 *                                 type: integer
 *                               pricePerNight:
 *                                 type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           _count:
 *                             type: object
 *                             properties:
 *                               bookingRooms:
 *                                 type: integer
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
roomRoute
  .route('/')
  .post(authEmployee, validate(roomValidation.createRoom), roomController.createRoom)
  .get(authEmployee, validate(roomValidation.getRooms), roomController.getRooms);

/**
 * @swagger
 * /employee/rooms/{roomId}:
 *   get:
 *     summary: Get room by ID
 *     description: Retrieve a specific room's details
 *     tags: [Rooms]
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
 *         description: Room retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "clq1234567890abcdef"
 *                     roomNumber:
 *                       type: string
 *                       example: "101"
 *                     floor:
 *                       type: integer
 *                       example: 1
 *                     status:
 *                       type: string
 *                       example: "AVAILABLE"
 *                     roomTypeId:
 *                       type: string
 *                     roomType:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         capacity:
 *                           type: integer
 *                         pricePerNight:
 *                           type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     _count:
 *                       type: object
 *                       properties:
 *                         bookingRooms:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Update room
 *     description: Update a room's information
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               roomNumber:
 *                 type: string
 *                 maxLength: 50
 *                 description: Unique room number
 *               floor:
 *                 type: integer
 *                 description: Floor number
 *               roomTypeId:
 *                 type: string
 *                 description: ID of the room type
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, RESERVED, OCCUPIED, CLEANING, MAINTENANCE, OUT_OF_SERVICE]
 *                 description: Room status
 *             example:
 *               status: "MAINTENANCE"
 *               floor: 2
 *     responses:
 *       200:
 *         description: Room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     roomNumber:
 *                       type: string
 *                     floor:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     roomTypeId:
 *                       type: string
 *                     roomType:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Room number already exists or room type not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete room
 *     description: Delete a room from the system
 *     tags: [Rooms]
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
 *       204:
 *         description: Room deleted successfully
 *       400:
 *         description: Cannot delete room with booking history
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
roomRoute
  .route('/:roomId')
  .get(authEmployee, validate(roomValidation.getRoom), roomController.getRoom)
  .put(authEmployee, validate(roomValidation.updateRoom), roomController.updateRoom)
  .delete(authEmployee, validate(roomValidation.deleteRoom), roomController.deleteRoom);

export default roomRoute;
