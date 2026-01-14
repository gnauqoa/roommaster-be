import express from 'express';
import validate from '@/middlewares/validate';
import { bookingValidation } from '@/validations';
import EmployeeBookingController from '@/controllers/employee/employee.booking.controller';
import { ImageController } from '@/controllers/employee/employee.image.controller';
import { container, TOKENS } from '@/core/container';
import { BookingService, ImageService } from '@/services';
import { authEmployee } from '@/middlewares/auth';
import { attachAbilities, authorize, canAccessScreen } from '@/middlewares/casl.middleware';
import { uploadPaymentImage } from '@/middlewares/upload.middleware';

export default function createBookingRoutes(): express.Router {
  const router = express.Router();

  // Resolve dependencies from container
  const bookingService = container.resolve<BookingService>(TOKENS.BookingService);
  const imageService = container.resolve<ImageService>(TOKENS.ImageService);
  const employeeBookingController = new EmployeeBookingController(bookingService);
  const imageController = new ImageController(imageService);

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
   *     description: |
   *       Create a booking for walk-in customers or phone reservations.
   *       Must provide either customerId (existing customer) OR customer object (new customer), not both.
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
   *               - rooms
   *               - checkInDate
   *               - checkOutDate
   *               - totalGuests
   *             properties:
   *               customerId:
   *                 type: string
   *                 description: Existing customer ID (use this OR customer, not both)
   *               customer:
   *                 type: object
   *                 required:
   *                   - fullName
   *                   - phone
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
   *                 description: New customer details (use this OR customerId, not both)
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
   *                 minimum: 1
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
   *     description: |
   *       Check in one or more booking rooms and assign customers to each room.
   *       **Important:** All booking rooms must be in CONFIRMED status (not PENDING).
   *       Rooms must also be in AVAILABLE or RESERVED status.
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
  router.get(
    '/:id',
    authorize('read', 'Booking'),
    validate(bookingValidation.getBooking),
    employeeBookingController.getBooking
  );

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

  /**
   * @swagger
   * /employee/bookings/rooms/{bookingRoomId}/customers:
   *   put:
   *     summary: Update customers for a booking room
   *     description: Replace the list of customers for a specific booking room
   *     tags: [Employee Bookings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: bookingRoomId
   *         required: true
   *         schema:
   *           type: string
   *         description: Booking room ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - customerIds
   *             properties:
   *               customerIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 minItems: 1
   *                 description: List of customer IDs
   *     responses:
   *       200:
   *         description: Customers updated successfully
   *       400:
   *         description: Validation error
   *       404:
   *         description: Booking room or customer not found
   */
  router.put(
    '/rooms/:bookingRoomId/customers',
    authorize('update', 'Booking'),
    validate(bookingValidation.updateBookingRoomCustomers),
    employeeBookingController.updateBookingRoomCustomers
  );

  // ==================== PAYMENT IMAGE ROUTES ====================

  /**
   * @swagger
   * /employee/bookings/{bookingId}/payment-images:
   *   post:
   *     summary: Upload payment proof image
   *     description: Upload a single payment proof image for a booking
   *     tags: [Employee Bookings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: bookingId
   *         required: true
   *         schema:
   *           type: string
   *         description: Booking ID
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
   *               paymentMethod:
   *                 type: string
   *                 description: Payment method (e.g., bank_transfer, cash, credit_card)
   *               description:
   *                 type: string
   *                 description: Notes about this payment proof
   *     responses:
   *       201:
   *         description: Image uploaded successfully
   *       400:
   *         description: No file uploaded or validation error
   */
  router.post(
    '/:bookingId/payment-images',
    uploadPaymentImage.single('image'),
    imageController.uploadPaymentImage
  );

  /**
   * @swagger
   * /employee/bookings/{bookingId}/payment-images/batch:
   *   post:
   *     summary: Upload multiple payment proof images
   *     description: Upload multiple payment proof images for a booking
   *     tags: [Employee Bookings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: bookingId
   *         required: true
   *         schema:
   *           type: string
   *         description: Booking ID
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - images
   *             properties:
   *               images:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *     responses:
   *       200:
   *         description: Images uploaded successfully
   *       207:
   *         description: Partial success (some images failed)
   */
  router.post(
    '/:bookingId/payment-images/batch',
    authorize('update', 'Booking'),
    uploadPaymentImage.array('images', 10),
    imageController.uploadPaymentImagesBatch
  );

  /**
   * @swagger
   * /employee/bookings/{bookingId}/payment-images:
   *   get:
   *     summary: Get all payment images for a booking
   *     description: Retrieve all payment proof images for a specific booking
   *     tags: [Employee Bookings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: bookingId
   *         required: true
   *         schema:
   *           type: string
   *         description: Booking ID
   *     responses:
   *       200:
   *         description: List of payment images
   */
  router.get(
    '/:bookingId/payment-images',
    authorize('read', 'Booking'),
    imageController.getPaymentImages
  );

  /**
   * @swagger
   * /employee/bookings/payment-images/{imageId}:
   *   delete:
   *     summary: Delete a payment image
   *     description: Delete a payment proof image from both Cloudinary and database
   *     tags: [Employee Bookings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: imageId
   *         required: true
   *         schema:
   *           type: string
   *         description: Payment image ID
   *     responses:
   *       204:
   *         description: Image deleted successfully
   *       404:
   *         description: Image not found
   */
  router.delete(
    '/payment-images/:imageId',
    authorize('update', 'Booking'),
    imageController.deletePaymentImage
  );

  /**
   * @swagger
   * /employee/bookings/{bookingId}/payment-images/reorder:
   *   put:
   *     summary: Reorder payment images
   *     description: Update the sort order of payment images
   *     tags: [Employee Bookings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: bookingId
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
   *             required:
   *               - imageIds
   *             properties:
   *               imageIds:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of image IDs in desired order
   *     responses:
   *       200:
   *         description: Images reordered successfully
   */
  router.put(
    '/:bookingId/payment-images/reorder',
    authorize('update', 'Booking'),
    imageController.reorderPaymentImages
  );

  /**
   * @swagger
   * /employee/bookings/payment-images/{imageId}/default:
   *   put:
   *     summary: Set default payment image
   *     description: Set a payment image as the default for the booking
   *     tags: [Employee Bookings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: imageId
   *         required: true
   *         schema:
   *           type: string
   *         description: Payment image ID
   *     responses:
   *       200:
   *         description: Default image set successfully
   */
  router.put(
    '/payment-images/:imageId/default',
    authorize('update', 'Booking'),
    imageController.setDefaultPaymentImage
  );

  return router;
}
