// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from 'core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { BookingService } from 'services/booking.service';
import { sendData } from 'utils/responseWrapper';

@Injectable()
export class EmployeeBookingController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * Check in guests for a confirmed booking
   * PATCH /employee-api/v1/bookings/check-in
   */
  checkIn = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const { bookingId, bookingRoomId, guests } = req.body;

    const result = await this.bookingService.checkIn({
      bookingId,
      bookingRoomId,
      guests,
      employeeId: req.employee.id
    });

    sendData(res, result);
  });

  /**
   * Create a transaction for a booking
   * POST /employee-api/v1/bookings/transaction
   */
  createTransaction = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const {
      bookingId,
      transactionType,
      amount,
      method,
      bookingRoomId,
      transactionRef,
      description
    } = req.body;

    const result = await this.bookingService.createTransaction({
      bookingId,
      transactionType,
      amount,
      method,
      bookingRoomId,
      transactionRef,
      description,
      employeeId: req.employee.id
    });

    sendData(res, result, httpStatus.CREATED);
  });

  /**
   * Get booking details
   * GET /employee-api/v1/bookings/:id
   */
  getBooking = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const booking = await this.bookingService.getBookingById(req.params.id);
    sendData(res, booking);
  });
}

export default EmployeeBookingController;
