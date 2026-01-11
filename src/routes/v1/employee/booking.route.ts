import express from 'express';
import validate from '@/middlewares/validate';
import { bookingValidation } from '@/validations';
import EmployeeBookingController from '@/controllers/employee/employee.booking.controller';
import { container, TOKENS } from '@/core/container';
import { BookingService } from '@/services/booking.service';
import { authEmployee } from '@/middlewares/auth';
import { attachAbilities, authorize, canAccessScreen } from '@/middlewares/casl.middleware';

export default function createBookingRoutes(): express.Router {
  const router = express.Router();

  // Resolve dependencies from container
  const bookingService = container.resolve<BookingService>(TOKENS.BookingService);
  const employeeBookingController = new EmployeeBookingController(bookingService);

  // Apply auth and CASL abilities to all routes
  // All routes require: 1) employee authentication, 2) CASL abilities, 3) Booking screen access
  router.use(authEmployee, attachAbilities, canAccessScreen('Booking'));

  /**
   * @swagger
   * tags:
   *   name: Employee Bookings
   *   description: Employee booking management endpoints
   */

  /**
   * @swagger
   * /employee/bookings:
   *   get:
   *     summary: Get all bookings
   *     description: Retrieve a paginated list of bookings with filters
   *     tags: [Employee Bookings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
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
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search by booking code, customer name or phone
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED]
   *         description: Filter by status
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter by check-in date start
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Filter by check-in date end
   *     responses:
   *       200:
   *         description: List of bookings
   *       401:
   *         description: Unauthorized
   *   post:
   *     summary: Create a booking
   *     description: Create a booking for walk-in customers or phone reservations
   *     tags: [Employee Bookings]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               customerId:
   *                 type: string
   *                 description: Existing customer ID
   *               customer:
   *                 type: object
   *                 properties:
   *                   fullName:
   *                     type: string
   *                   phone:
   *                     type: string
   *                   email:
   *                     type: string
   *                   idNumber:
   *                     type: string
   *                   address:
   *                     type: string
   *                 description: New customer details (if customerId not provided)
   *               rooms:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required:
   *                     - roomId
   *                   properties:
   *                     roomId:
   *                       type: string
   *                       description: ID of the specific room to book
   *               checkInDate:
   *                 type: string
   *                 format: date-time
   *               checkOutDate:
   *                 type: string
   *                 format: date-time
   *               totalGuests:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Booking created successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   */
  router
    .route('/')
    .get(
      authorize('read', 'Booking'),
      validate(bookingValidation.getBookings),
      employeeBookingController.getBookings
    )
    .post(
      authorize('create', 'Booking'),
      validate(bookingValidation.createBookingEmployee),
      employeeBookingController.createBooking
    );

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
    authorize('checkIn', 'Booking'),
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
    authorize('checkOut', 'Booking'),
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
  router.get('/:id', authorize('read', 'Booking'), employeeBookingController.getBooking);

  /**
   * @swagger
   * /employee/bookings/{id}:
   *   put:
   *     summary: Update booking
   *     description: Update booking details
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
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               checkInDate:
   *                 type: string
   *                 format: date-time
   *               checkOutDate:
   *                 type: string
   *                 format: date-time
   *               totalGuests:
   *                 type: integer
   *               status:
   *                 type: string
   *                 enum: [PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED]
   *               rooms:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required:
   *                     - roomId
   *                   properties:
   *                     roomId:
   *                       type: string
   *                       description: ID of the specific room
   *     responses:
   *       200:
   *         description: Booking updated successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Booking not found
   */
  router.put(
    '/:id',
    authorize('update', 'Booking'),
    validate(bookingValidation.updateBooking),
    employeeBookingController.updateBooking
  );

  /**
   * @swagger
   * /employee/bookings/{id}/cancel:
   *   post:
   *     summary: Cancel booking
   *     description: Cancel a booking
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
   *         description: Booking cancelled successfully
   *       400:
   *         description: Cannot cancel booking
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Booking not found
   */
  router.post(
    '/:id/cancel',
    authorize('cancel', 'Booking'),
    validate(bookingValidation.cancelBooking),
    employeeBookingController.cancelBooking
  );

  /**
   * @swagger
   * /employee/bookings/rooms/{bookingRoomId}/change-room:
   *   post:
   *     summary: Change room for a checked-in booking
   *     description: Transfer a customer from their current room to a new available room. Only works for bookings that are currently checked in. The new room must be available for the remaining duration of the stay.
   *     tags: [Employee Bookings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: bookingRoomId
   *         required: true
   *         schema:
   *           type: string
   *         description: The booking room ID (not the room ID)
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
   *                 type: string
   *                 description: The ID of the new room to transfer to
   *               reason:
   *                 type: string
   *                 maxLength: 500
   *                 description: Optional reason for the room change
   *           example:
   *             newRoomId: "room-456"
   *             reason: "Customer requested quieter room"
   *     responses:
   *       200:
   *         description: Room changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: object
   *                   properties:
   *                     bookingRoom:
   *                       type: object
   *                       description: Updated booking room with new room details
   *                     priceAdjustment:
   *                       type: object
   *                       properties:
   *                         oldPricePerNight:
   *                           type: number
   *                         newPricePerNight:
   *                           type: number
   *                         remainingNights:
   *                           type: integer
   *                         priceDifference:
   *                           type: number
   *                           description: Positive for upgrade, negative for downgrade
   *       400:
   *         description: Invalid request - booking not checked in or same room
   *       404:
   *         description: Booking room or new room not found
   *       409:
   *         description: New room is not available for the remaining stay period
   */
  router.post(
    '/rooms/:bookingRoomId/change-room',
    authorize('update', 'Booking'),
    validate(bookingValidation.changeRoom),
    employeeBookingController.changeRoom
  );

  return router;
}
