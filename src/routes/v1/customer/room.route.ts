import express from 'express';
import validate from '@/middlewares/validate';
import { roomValidation } from '@/validations';
import CustomerRoomController from '@/controllers/customer/customer.room.controller';
import { container, TOKENS } from '@/core/container';
import { RoomService } from '@/services/room.service';
import { authCustomer } from '@/middlewares/auth';

export default function createRoomRoutes(): express.Router {
  const router = express.Router();

  // Resolve dependencies from container
  const roomService = container.resolve<RoomService>(TOKENS.RoomService);
  const customerRoomController = new CustomerRoomController(roomService);

  /**
   * @swagger
   * tags:
   *   name: Customer Rooms
   *   description: Customer room search and availability endpoints
   */

  /**
   * @swagger
   * /customer/rooms:
   *   get:
   *     summary: Search rooms by current status
   *     description: Search rooms by current physical status. For booking, use /available endpoint instead.
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
   *         name: roomTypeId
   *         schema:
   *           type: string
   *         description: Filter by room type ID
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *     responses:
   *       200:
   *         description: List of rooms
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
   * /customer/rooms/available:
   *   get:
   *     summary: Search rooms available for booking dates
   *     description: |
   *       **Primary endpoint for room search before booking.**
   *       Returns rooms that have no overlapping bookings for the specified date range.
   *       Results are grouped by room type for easy display.
   *       **Includes images:** Each room and room type includes associated images with full metadata.
   *     tags: [Customer Rooms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: checkInDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Check-in date (ISO format, e.g., 2026-01-15)
   *       - in: query
   *         name: checkOutDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Check-out date (must be after checkInDate)
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
   *         description: Unauthorized
   */
  router.get(
    '/available',
    authCustomer,
    validate(roomValidation.searchAvailableRoomsByDate),
    customerRoomController.searchAvailableRoomsByDate
  );

  /**
   * @swagger
   * /customer/rooms/check-availability:
   *   post:
   *     summary: Bulk check room availability
   *     description: Check if multiple rooms are available for a date range. Use before creating a booking.
   *     tags: [Customer Rooms]
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
   *                 format: date-time
   *               checkOutDate:
   *                 type: string
   *                 format: date-time
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
   *                       roomNumber:
   *                         type: string
   *                       available:
   *                         type: boolean
   *                       reason:
   *                         type: string
   *       400:
   *         description: Invalid request
   *       401:
   *         description: Unauthorized
   */
  router.post(
    '/check-availability',
    authCustomer,
    validate(roomValidation.checkMultipleRoomsAvailability),
    customerRoomController.checkMultipleRoomsAvailability
  );

  /**
   * @swagger
   * /customer/rooms/{roomId}/availability:
   *   get:
   *     summary: Check single room availability
   *     description: Check if a specific room is available for a date range
   *     tags: [Customer Rooms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: checkInDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: checkOutDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date-time
   *     responses:
   *       200:
   *         description: Room availability with conflict details
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
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Room not found
   */
  router.get(
    '/:roomId/availability',
    authCustomer,
    validate(roomValidation.checkRoomAvailability),
    customerRoomController.checkRoomAvailability
  );

  /**
   * @swagger
   * /customer/rooms/{roomId}:
   *   get:
   *     summary: Get room details
   *     description: Get detailed information about a specific room including images for both the room and its room type
   *     tags: [Customer Rooms]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: roomId
   *         required: true
   *         schema:
   *           type: string
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

  return router;
}
