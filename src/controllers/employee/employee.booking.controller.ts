// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import catchAsync from 'utils/catchAsync';
import { BookingService } from 'services/booking.service';
import { sendData } from 'utils/responseWrapper';

@Injectable()
export class EmployeeBookingController {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * Check in specific booking rooms with customer assignments
   * POST /employee-api/v1/bookings/check-in-rooms
   */
  checkInRooms = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const { checkInInfo } = req.body;

    const result = await this.bookingService.checkIn({
      checkInInfo,
      employeeId: req.employee.id
    });

    sendData(res, result);
  });

  /**
   * Check out specific booking rooms
   * POST /employee-api/v1/bookings/check-out-rooms
   */
  checkOutRooms = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const { bookingRoomIds } = req.body;

    const result = await this.bookingService.checkOut({
      bookingRoomIds,
      employeeId: req.employee.id
    });

    sendData(res, result);
  });

  /**
   * Create a transaction for a booking
   * POST /employee-api/v1/bookings/transaction
   */

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

  /**
   * Get all bookings with filters
   * GET /employee-api/v1/bookings
   */
  getBookings = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const filter = req.query;
    const options = req.query;

    const result = await this.bookingService.getBookings(filter, options);
    sendData(res, result);
  });

  /**
   * Create a booking (walk-in/phone)
   * POST /employee-api/v1/bookings
   */
  createBooking = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const result = await this.bookingService.createBookingEmployee(req.body);
    sendData(res, result, 201);
  });

  /**
   * Update booking details
   * PUT /employee-api/v1/bookings/:id
   */
  updateBooking = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const result = await this.bookingService.updateBooking(req.params.id, req.body);
    sendData(res, result);
  });

  /**
   * Cancel a booking
   * POST /employee-api/v1/bookings/:id/cancel
   */
  cancelBooking = catchAsync(async (req: Request, res: Response) => {
    if (!req.employee?.id) {
      throw new Error('Employee not authenticated');
    }

    const result = await this.bookingService.cancelBooking(req.params.id);
    sendData(res, result);
  });
}

export default EmployeeBookingController;
