import express from 'express';
import { authEmployee } from '@/middlewares/auth';
import validate from '@/middlewares/validate';
import { roomValidation } from '@/validations';
import { container, TOKENS } from '@/core/container';
import { RoomService, ImageService } from '@/services';
import { RoomController } from '@/controllers/employee/employee.room.controller';
import { ImageController } from '@/controllers/employee/employee.image.controller';
import { uploadRoomImage } from '@/middlewares/upload.middleware';

export default function createRoomRoutes(): express.Router {
  const roomRoute = express.Router();

  // Manually instantiate controller with dependencies
  const roomService = container.resolve<RoomService>(TOKENS.RoomService);
  const roomController = new RoomController(roomService);

  // Image controller for image management endpoints
  const imageService = container.resolve<ImageService>(TOKENS.ImageService);
  const imageController = new ImageController(imageService);

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
   *               code:
   *                 type: string
   *                 maxLength: 50
   *                 description: Room code (optional)
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
   *           enum: [roomNumber, status, createdAt, updatedAt]
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
   * /employee/rooms/available:
   *   get:
   *     summary: Search rooms available for date range
   *     description: Search for rooms that are available for booking in a specific date range. This is the primary endpoint for employees to find rooms when creating bookings.
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
   *         description: Check-in date (YYYY-MM-DD)
   *       - in: query
   *         name: checkOutDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Check-out date (YYYY-MM-DD)
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by room number or code
   *       - in: query
   *         name: roomTypeId
   *         schema:
   *           type: string
   *         description: Filter by room type ID
   *       - in: query
   *         name: minCapacity
   *         schema:
   *           type: integer
   *         description: Minimum room capacity
   *       - in: query
   *         name: maxCapacity
   *         schema:
   *           type: integer
   *         description: Maximum room capacity
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
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: Available rooms grouped by room type
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       roomType:
   *                         type: object
   *                       availableCount:
   *                         type: integer
   *                       rooms:
   *                         type: array
   *                 total:
   *                   type: integer
   *                 checkInDate:
   *                   type: string
   *                 checkOutDate:
   *                   type: string
   *       400:
   *         description: Invalid date range
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  roomRoute.get(
    '/available',
    authEmployee,
    validate(roomValidation.searchAvailableRoomsByDate),
    roomController.searchAvailableRoomsByDate
  );

  /**
   * @swagger
   * /employee/rooms/check-availability:
   *   post:
   *     summary: Bulk check room availability
   *     description: Check if multiple rooms are available for a date range. Use before creating a booking.
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
   *               - roomIds
   *               - checkInDate
   *               - checkOutDate
   *             properties:
   *               roomIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of room IDs to check
   *               checkInDate:
   *                 type: string
   *                 format: date
   *                 description: Check-in date (YYYY-MM-DD)
   *               checkOutDate:
   *                 type: string
   *                 format: date
   *                 description: Check-out date (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: Availability status for each room
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 allAvailable:
   *                   type: boolean
   *                 results:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       roomId:
   *                         type: string
   *                       available:
   *                         type: boolean
   *                       room:
   *                         type: object
   *                       conflictingBookings:
   *                         type: array
   *       400:
   *         description: Validation error
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   */
  roomRoute.post(
    '/check-availability',
    authEmployee,
    validate(roomValidation.checkMultipleRoomsAvailability),
    roomController.checkMultipleRoomsAvailability
  );

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
   *               code:
   *                 type: string
   *                 maxLength: 50
   *                 description: Room code
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

  // ==================== ROOM IMAGE ROUTES ====================

  /**
   * @swagger
   * /employee/rooms/{roomId}/images:
   *   post:
   *     summary: Upload single image for room
   *     tags: [Rooms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - image
   *             properties:
   *               image:
   *                 type: string
   *                 format: binary
   *               isDefault:
   *                 type: string
   *                 enum: ["true", "false"]
   *               sortOrder:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Image uploaded successfully
   */
  roomRoute
    .route('/:roomId/images')
    .post(authEmployee, uploadRoomImage.single('image'), imageController.uploadRoomImage)
    .get(authEmployee, imageController.getRoomImages);

  /**
   * @swagger
   * /employee/rooms/{roomId}/images/reorder:
   *   put:
   *     summary: Reorder room images
   *     tags: [Rooms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - imageIds
   *             properties:
   *               imageIds:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Images reordered successfully
   */
  roomRoute.put('/:roomId/images/reorder', authEmployee, imageController.reorderRoomImages);

  /**
   * @swagger
   * /employee/rooms/images/{imageId}:
   *   delete:
   *     summary: Delete room image
   *     tags: [Rooms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: imageId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Image deleted successfully
   */
  roomRoute.delete('/images/:imageId', authEmployee, imageController.deleteRoomImage);

  /**
   * @swagger
   * /employee/rooms/images/{imageId}/default:
   *   put:
   *     summary: Set image as default for room
   *     tags: [Rooms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: imageId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Default image set successfully
   */
  roomRoute.put('/images/:imageId/default', authEmployee, imageController.setDefaultRoomImage);

  /**
   * @swagger
   * /employee/rooms/{roomId}/availability:
   *   get:
   *     summary: Check single room availability
   *     description: Check if a specific room is available for a date range. Returns conflicting bookings if any.
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
   *       - in: query
   *         name: checkInDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Check-in date (YYYY-MM-DD)
   *       - in: query
   *         name: checkOutDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Check-out date (YYYY-MM-DD)
   *     responses:
   *       200:
   *         description: Room availability status
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 available:
   *                   type: boolean
   *                 room:
   *                   type: object
   *                 conflictingBookings:
   *                   type: array
   *       400:
   *         description: Validation error
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         description: Room not found
   */
  roomRoute.get(
    '/:roomId/availability',
    authEmployee,
    validate(roomValidation.checkRoomAvailability),
    roomController.checkRoomAvailability
  );

  return roomRoute;
}
