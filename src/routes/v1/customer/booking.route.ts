import express from 'express';
import validate from '@/middlewares/validate';
import { bookingValidation } from '@/validations';
import CustomerBookingController from '@/controllers/customer/customer.booking.controller';
import { CustomerImageController } from '@/controllers/customer/customer.image.controller';
import { container, TOKENS } from '@/core/container';
import { BookingService, ImageService } from '@/services';
import { authCustomer } from '@/middlewares/auth';
import { requireEmailVerified } from '@/middlewares/emailVerification';
import { uploadPaymentImage } from '@/middlewares/upload.middleware';

export default function createBookingRoutes(): express.Router {
  const router = express.Router();

  // Resolve dependencies from container
  const bookingService = container.resolve<BookingService>(TOKENS.BookingService);
  const imageService = container.resolve<ImageService>(TOKENS.ImageService);
  const customerBookingController = new CustomerBookingController(bookingService, imageService);
  const customerImageController = new CustomerImageController(imageService);

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
   *     description: |
   *       Create a booking with automatic room allocation.
   *       Supports both JSON and multipart/form-data (for optional payment image uploads).
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
   *                     - roomId
   *                   properties:
   *                     roomId:
   *                       type: string
   *                       description: ID of the specific room to book
   *                 description: Array of room requests
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
   *                 - roomId: "room_id_1"
   *                 - roomId: "room_id_2"
   *                 - roomId: "room_id_3"
   *               checkInDate: "2025-12-25T14:00:00Z"
   *               checkOutDate: "2025-12-27T12:00:00Z"
   *               totalGuests: 4
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - rooms
   *               - checkInDate
   *               - checkOutDate
   *               - totalGuests
   *             properties:
   *               rooms:
   *                 type: string
   *                 description: JSON string of room array (e.g., '[{"roomId":"room_1"}]')
   *               checkInDate:
   *                 type: string
   *                 format: date-time
   *               checkOutDate:
   *                 type: string
   *                 format: date-time
   *               totalGuests:
   *                 type: integer
   *                 minimum: 1
   *               paymentImages:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *                 description: Optional payment proof images
   *               paymentMethod:
   *                 type: string
   *                 description: Payment method used (optional)
   *               paymentDescription:
   *                 type: string
   *                 description: Notes about payment (optional)
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
   *                     paymentImagesCount:
   *                       type: integer
   *                       description: Number of payment images uploaded (if any)
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
    requireEmailVerified,
    uploadPaymentImage.array('paymentImages', 10),
    validate(bookingValidation.createBooking),
    customerBookingController.createBooking
  );

  /**
   * @swagger
   * /customer/bookings:
   *   get:
   *     summary: Get all bookings
   *     description: Retrieve a paginated list of bookings for the logged-in customer
   *     tags: [Customer Bookings]
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
   *         name: status
   *         schema:
   *           type: string
   *           enum: [PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED]
   *         description: Filter by status
   *     responses:
   *       200:
   *         description: List of bookings
   *       401:
   *         description: Unauthorized
   */
  router.get(
    '/',
    authCustomer,
    validate(bookingValidation.getBookings),
    customerBookingController.getBookings
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
  router.get(
    '/:id',
    authCustomer,
    validate(bookingValidation.getBooking),
    customerBookingController.getBooking
  );

  /**
   * @swagger
   * /customer/bookings/{id}/cancel:
   *   post:
   *     summary: Cancel booking
   *     description: Cancel a pending booking
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
    authCustomer,
    validate(bookingValidation.cancelBooking),
    customerBookingController.cancelBooking
  );

  // ==================== PAYMENT IMAGE ROUTES ====================

  /**
   * @swagger
   * /customer/bookings/{bookingId}/payment-images:
   *   post:
   *     summary: Upload payment proof image
   *     description: Upload a payment proof image for your booking
   *     tags: [Customer Bookings]
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
   *                 description: Payment method used
   *               description:
   *                 type: string
   *                 description: Notes about this payment
   *     responses:
   *       201:
   *         description: Image uploaded successfully
   *       400:
   *         description: No file uploaded
   *       401:
   *         description: Unauthorized
   */
  router.post(
    '/:bookingId/payment-images',
    authCustomer,
    uploadPaymentImage.single('image'),
    customerImageController.uploadPaymentImage
  );

  /**
   * @swagger
   * /customer/bookings/{bookingId}/payment-images/batch:
   *   post:
   *     summary: Upload multiple payment proof images
   *     description: Upload multiple payment proof images for your booking
   *     tags: [Customer Bookings]
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
   *         description: Partial success
   */
  router.post(
    '/:bookingId/payment-images/batch',
    authCustomer,
    uploadPaymentImage.array('images', 10),
    customerImageController.uploadPaymentImagesBatch
  );

  /**
   * @swagger
   * /customer/bookings/{bookingId}/payment-images:
   *   get:
   *     summary: Get payment images
   *     description: Get all payment proof images for your booking
   *     tags: [Customer Bookings]
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
  router.get('/:bookingId/payment-images', authCustomer, customerImageController.getPaymentImages);

  /**
   * @swagger
   * /customer/bookings/payment-images/{imageId}:
   *   delete:
   *     summary: Delete payment image
   *     description: Delete a payment proof image
   *     tags: [Customer Bookings]
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
    authCustomer,
    customerImageController.deletePaymentImage
  );

  /**
   * @swagger
   * /customer/bookings/payment-images/upload-signature:
   *   get:
   *     summary: Get upload signature for direct upload
   *     description: Get Cloudinary upload signature for mobile apps
   *     tags: [Customer Bookings]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Upload signature generated
   */
  router.get(
    '/payment-images/upload-signature',
    authCustomer,
    customerImageController.getPaymentUploadSignature
  );

  /**
   * @swagger
   * /customer/bookings/{bookingId}/payment-images/direct-upload:
   *   post:
   *     summary: Save direct upload metadata
   *     description: Save metadata after direct upload to Cloudinary (for mobile apps)
   *     tags: [Customer Bookings]
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
   *               - cloudinaryId
   *               - url
   *               - secureUrl
   *             properties:
   *               cloudinaryId:
   *                 type: string
   *               url:
   *                 type: string
   *               secureUrl:
   *                 type: string
   *               width:
   *                 type: integer
   *               height:
   *                 type: integer
   *               format:
   *                 type: string
   *               paymentMethod:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Upload metadata saved
   */
  router.post(
    '/:bookingId/payment-images/direct-upload',
    authCustomer,
    customerImageController.savePaymentDirectUpload
  );

  return router;
}
