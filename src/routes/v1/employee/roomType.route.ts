import express from 'express';
import { authEmployee } from 'middlewares/auth';
import validate from 'middlewares/validate';
import { roomTypeValidation } from 'validations';
import { container, TOKENS } from 'core/container';
import { RoomTypeService } from 'services';
import { RoomTypeController } from 'controllers/employee/employee.roomType.controller';

const roomTypeRoute = express.Router();

// Manually instantiate controller with dependencies
const roomTypeService = container.resolve<RoomTypeService>(TOKENS.RoomTypeService);
const roomTypeController = new RoomTypeController(roomTypeService);

/**
 * @swagger
 * tags:
 *   name: Room Types
 *   description: Room type management endpoints
 */

/**
 * @swagger
 * /employee/room-types:
 *   post:
 *     summary: Create a new room type
 *     description: Create a new room type with pricing and amenities
 *     tags: [Room Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - capacity
 *               - pricePerNight
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Room type name
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Maximum number of guests
 *               pricePerNight:
 *                 type: number
 *                 minimum: 0
 *                 description: Price per night (VND)
 *               amenities:
 *                 type: object
 *                 description: Room amenities (JSON object)
 *             example:
 *               name: "Phòng Deluxe"
 *               capacity: 2
 *               pricePerNight: 1500000
 *               amenities:
 *                 wifi: true
 *                 airConditioner: true
 *                 minibar: true
 *                 balcony: false
 *     responses:
 *       201:
 *         description: Room type created successfully
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
 *                     name:
 *                       type: string
 *                       example: "Phòng Deluxe"
 *                     capacity:
 *                       type: integer
 *                       example: 2
 *                     pricePerNight:
 *                       type: string
 *                       example: "1500000"
 *                     amenities:
 *                       type: object
 *                       example:
 *                         wifi: true
 *                         airConditioner: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Room type with this name already exists
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   get:
 *     summary: Get all room types
 *     description: Retrieve a paginated list of room types with optional filters
 *     tags: [Room Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by room type name
 *       - in: query
 *         name: minCapacity
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Minimum capacity filter
 *       - in: query
 *         name: maxCapacity
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum capacity filter
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
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
 *           enum: [name, capacity, pricePerNight, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Room types retrieved successfully
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
 *                           name:
 *                             type: string
 *                           capacity:
 *                             type: integer
 *                           pricePerNight:
 *                             type: string
 *                           amenities:
 *                             type: object
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           _count:
 *                             type: object
 *                             properties:
 *                               rooms:
 *                                 type: integer
 *                               bookingRooms:
 *                                 type: integer
 *                     total:
 *                       type: integer
 *                       example: 5
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
roomTypeRoute
  .route('/')
  .post(
    authEmployee,
    validate(roomTypeValidation.createRoomType),
    roomTypeController.createRoomType
  )
  .get(authEmployee, validate(roomTypeValidation.getRoomTypes), roomTypeController.getRoomTypes);

/**
 * @swagger
 * /employee/room-types/{roomTypeId}:
 *   get:
 *     summary: Get room type by ID
 *     description: Retrieve a specific room type's details
 *     tags: [Room Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomTypeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room type ID
 *     responses:
 *       200:
 *         description: Room type retrieved successfully
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
 *                     name:
 *                       type: string
 *                       example: "Phòng Deluxe"
 *                     capacity:
 *                       type: integer
 *                       example: 2
 *                     pricePerNight:
 *                       type: string
 *                       example: "1500000"
 *                     amenities:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     _count:
 *                       type: object
 *                       properties:
 *                         rooms:
 *                           type: integer
 *                         bookingRooms:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     summary: Update room type
 *     description: Update a room type's information
 *     tags: [Room Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomTypeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Room type name
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Maximum number of guests
 *               pricePerNight:
 *                 type: number
 *                 minimum: 0
 *                 description: Price per night (VND)
 *               amenities:
 *                 type: object
 *                 description: Room amenities
 *             example:
 *               name: "Phòng Superior"
 *               pricePerNight: 1800000
 *     responses:
 *       200:
 *         description: Room type updated successfully
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
 *                     name:
 *                       type: string
 *                     capacity:
 *                       type: integer
 *                     pricePerNight:
 *                       type: string
 *                     amenities:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Room type with this name already exists
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete room type
 *     description: Delete a room type from the system
 *     tags: [Room Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomTypeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Room type ID
 *     responses:
 *       204:
 *         description: Room type deleted successfully
 *       400:
 *         description: Cannot delete room type with associated rooms
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
roomTypeRoute
  .route('/:roomTypeId')
  .get(authEmployee, validate(roomTypeValidation.getRoomType), roomTypeController.getRoomType)
  .put(authEmployee, validate(roomTypeValidation.updateRoomType), roomTypeController.updateRoomType)
  .delete(
    authEmployee,
    validate(roomTypeValidation.deleteRoomType),
    roomTypeController.deleteRoomType
  );

export default roomTypeRoute;
