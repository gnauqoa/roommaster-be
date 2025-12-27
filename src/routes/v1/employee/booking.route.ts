import express from 'express';
import validate from 'middlewares/validate';
import { bookingValidation } from 'validations';
import EmployeeBookingController from 'controllers/employee/employee.booking.controller';
import { container, TOKENS } from 'core/container';
import { BookingService } from 'services/booking.service';
import { authEmployee } from 'middlewares/auth';

const router = express.Router();

// Resolve dependencies from container
const bookingService = container.resolve<BookingService>(TOKENS.BookingService);
const employeeBookingController = new EmployeeBookingController(bookingService);

/**
 * @swagger
 * tags:
 *   name: Employee Bookings
 *   description: Employee booking management endpoints
 */

/**
 * @swagger
 * /employee/bookings/check-in:
 *   post:
 *     summary: Check in specific booking rooms with customer assignments
 *     description: Check in one or more booking rooms and assign customers to each room
 *     tags: [Employee Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - checkInInfo
 *             properties:
 *               checkInInfo:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - bookingRoomId
 *                     - customerIds
 *                   properties:
 *                     bookingRoomId:
 *                       type: string
 *                       description: Booking room ID to check in
 *                     customerIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of customer IDs staying in this room
 *             example:
 *               checkInInfo:
 *                 - bookingRoomId: "booking_room_id_1"
 *                   customerIds: ["customer_id_1", "customer_id_2"]
 *                 - bookingRoomId: "booking_room_id_2"
 *                   customerIds: ["customer_id_3"]
 *     responses:
 *       200:
 *         description: Check-in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingRooms:
 *                       type: array
 *                       description: Updated booking rooms with customer assignments
 *       400:
 *         description: Invalid booking status or validation error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/check-in',
  authEmployee,
  validate(bookingValidation.checkInRooms),
  employeeBookingController.checkInRooms
);

/**
 * @swagger
 * /employee/bookings/check-out:
 *   post:
 *     summary: Check out specific booking rooms
 *     description: Check out one or more booking rooms and update room status to available
 *     tags: [Employee Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingRoomIds
 *             properties:
 *               bookingRoomIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of booking room IDs to check out
 *             example:
 *               bookingRoomIds: ["booking_room_id_1", "booking_room_id_2"]
 *     responses:
 *       200:
 *         description: Check-out successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingRooms:
 *                       type: array
 *                       description: Updated booking rooms after check-out
 *       400:
 *         description: Invalid booking status or validation error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/check-out',
  authEmployee,
  validate(bookingValidation.checkOutRooms),
  employeeBookingController.checkOutRooms
);

/**
 * @swagger
 * /employee/bookings/{id}:
 *   get:
 *     summary: Get booking details
 *     description: Retrieve detailed information about a specific booking
 *     tags: [Employee Bookings]
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
router.get('/:id', authEmployee, employeeBookingController.getBooking);

export default router;
