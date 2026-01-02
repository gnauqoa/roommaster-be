// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/utils/catchAsync';
import { BookingService } from '@/services/booking.service';
import { sendData } from '@/utils/responseWrapper';

@Injectable()
export class CustomerBookingController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * Create a booking with automatic room allocation
   * POST /customer-api/v1/bookings
   */
  createBooking = catchAsync(async (req: Request, res: Response) => {
    if (!req.customer?.id) {
      throw new Error('Customer not authenticated');
    }

    const { rooms, checkInDate, checkOutDate, totalGuests } = req.body;

    const result = await this.bookingService.createBooking({
      rooms,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      totalGuests,
      customerId: req.customer.id
    });

    sendData(
      res,
      {
        bookingId: result.bookingId,
        bookingCode: result.bookingCode,
        expiresAt: result.expiresAt,
        totalAmount: result.totalAmount,
        booking: result.booking
      },
      httpStatus.CREATED
    );
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
