// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/utils/catchAsync';
import { BookingService } from '@/services/booking.service';
import { ImageService } from '@/services';
import { sendData } from '@/utils/responseWrapper';

@Injectable()
export class CustomerBookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly imageService?: ImageService
  ) {}

  /**
   * Create a booking with automatic room allocation
   * Supports both JSON and multipart/form-data (for optional payment images)
   * POST /customer-api/v1/bookings
   */
  createBooking = catchAsync(async (req: Request, res: Response) => {
    if (!req.customer?.id) {
      throw new Error('Customer not authenticated');
    }

    // Handle both JSON and multipart/form-data
    let rooms, checkInDate, checkOutDate, totalGuests;

    if (req.is('multipart/form-data')) {
      // Parse data from form fields
      rooms = typeof req.body.rooms === 'string' ? JSON.parse(req.body.rooms) : req.body.rooms;
      checkInDate = req.body.checkInDate;
      checkOutDate = req.body.checkOutDate;
      totalGuests = parseInt(req.body.totalGuests);
    } else {
      // Parse data from JSON body
      ({ rooms, checkInDate, checkOutDate, totalGuests } = req.body);
    }

    // Create the booking
    const result = await this.bookingService.createBooking({
      rooms,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      totalGuests,
      customerId: req.customer.id
    });

    // Upload payment images if provided (only for multipart requests)
    const files = req.files as Express.Multer.File[];
    let uploadedImages: any[] = [];

    if (files && files.length > 0 && this.imageService) {
      const uploadResult = await this.imageService.uploadPaymentImagesBatch(
        result.bookingId,
        files
      );

      // Confirm all successful uploads
      await Promise.all(
        uploadResult.successful.map((img) => this.imageService!.confirmUpload(img.cloudinaryId))
      );

      uploadedImages = uploadResult.successful;
    }

    const responseData: any = {
      bookingId: result.bookingId,
      bookingCode: result.bookingCode,
      expiresAt: result.expiresAt,
      totalAmount: result.totalAmount,
      booking: result.booking
    };

    // Include payment images info if any were uploaded
    if (uploadedImages.length > 0) {
      responseData.paymentImages = uploadedImages;
      responseData.paymentImagesCount = uploadedImages.length;
    }

    sendData(res, responseData, httpStatus.CREATED);
  });

  /**
   * Get booking details
   * GET /customer-api/v1/bookings/:id
   */
  getBooking = catchAsync(async (req: Request, res: Response) => {
    if (!req.customer?.id) {
      throw new Error('Customer not authenticated');
    }

    const booking = await this.bookingService.getBookingById(req.params.id);

    // Verify the booking belongs to the authenticated customer
    if (booking.primaryCustomerId !== req.customer.id) {
      throw new Error('Unauthorized to view this booking');
    }

    sendData(res, booking);
  });

  /**
   * Get all bookings for the logged-in customer
   * GET /customer-api/v1/bookings
   */
  getBookings = catchAsync(async (req: Request, res: Response) => {
    if (!req.customer?.id) {
      throw new Error('Customer not authenticated');
    }

    const filter = {
      customerId: req.customer.id,
      ...req.query
    };
    const options = req.query;

    const result = await this.bookingService.getBookings(filter, options);
    sendData(res, result);
  });

  /**
   * Cancel a booking
   * POST /customer-api/v1/bookings/:id/cancel
   */
  cancelBooking = catchAsync(async (req: Request, res: Response) => {
    if (!req.customer?.id) {
      throw new Error('Customer not authenticated');
    }

    const booking = await this.bookingService.getBookingById(req.params.id);

    // Verify the booking belongs to the authenticated customer
    if (booking.primaryCustomerId !== req.customer.id) {
      throw new Error('Unauthorized to cancel this booking');
    }

    const result = await this.bookingService.cancelBooking(req.params.id);
    sendData(res, result);
  });
}

export default CustomerBookingController;
