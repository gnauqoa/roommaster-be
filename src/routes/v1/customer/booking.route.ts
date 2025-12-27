import express from 'express';
import validate from 'middlewares/validate';
import { bookingValidation } from 'validations';
import CustomerBookingController from 'controllers/customer/customer.booking.controller';
import { container, TOKENS } from 'core/container';
import { BookingService } from 'services/booking.service';
import { authCustomer } from 'middlewares/auth';

const router = express.Router();

// Resolve dependencies from container
const bookingService = container.resolve<BookingService>(TOKENS.BookingService);
const customerBookingController = new CustomerBookingController(bookingService);

/**
 * @swagger
 * tags:
 *   name: Customer Bookings
 *   description: Customer booking management endpoints
 */

/**
 * @swagger
 * /customer/bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Create a booking with automatic room allocation based on room type and count
 *     tags: [Customer Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rooms
 *               - checkInDate
 *               - checkOutDate
 *               - totalGuests
 *             properties:
 *               rooms:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - roomTypeId
 *                     - count
 *                   properties:
 *                     roomTypeId:
 *                       type: string
 *                       description: ID of the room type
 *                     count:
 *                       type: integer
 *                       minimum: 1
 *                       description: Number of rooms of this type
 *                 description: Array of room type requests
 *               checkInDate:
 *                 type: string
 *                 format: date-time
 *                 description: Check-in date and time
 *               checkOutDate:
 *                 type: string
 *                 format: date-time
 *                 description: Check-out date and time
 *               totalGuests:
 *                 type: integer
 *                 minimum: 1
 *                 description: Total number of guests
 *             example:
 *               rooms:
 *                 - roomTypeId: "room_type_id_1"
 *                   count: 2
 *                 - roomTypeId: "room_type_id_2"
 *                   count: 1
 *               checkInDate: "2025-12-25T14:00:00Z"
 *               checkOutDate: "2025-12-27T12:00:00Z"
 *               totalGuests: 4
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingId:
 *                       type: string
 *                     bookingCode:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     totalAmount:
 *                       type: number
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         description: Not enough available rooms
 */
router.post(
  '/',
  authCustomer,
  validate(bookingValidation.createBooking),
  customerBookingController.createBooking
);

/**
 * @swagger
 * /customer/bookings/{id}:
 *   get:
 *     summary: Get booking details
 *     description: Retrieve detailed information about a specific booking
 *     tags: [Customer Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', authCustomer, customerBookingController.getBooking);

export default router;
