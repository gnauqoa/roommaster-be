import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import ReservationService from 'services/reservation.service';
import StayRecordService from 'services/stay-record.service';
import { Employee } from '@prisma/client';
import { Injectable } from 'core/decorators';

@Injectable()
export class ReservationController {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly stayRecordService: StayRecordService
  ) {}

  createReservation = catchAsync(async (req, res) => {
    const reservation = await this.reservationService.createReservation(req.body);
    res.status(httpStatus.CREATED).send(reservation);
  });

  getReservations = catchAsync(async (req, res) => {
    const filter = pick(req.query, [
      'customerId',
      'status',
      'checkInDate',
      'checkOutDate',
      'roomTypeId'
    ]);
    const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
    const result = await this.reservationService.queryReservations(filter, options);
    res.send(result);
  });

  getReservation = catchAsync(async (req, res) => {
    const reservation = await this.reservationService.getReservationById(
      Number(req.params.reservationId)
    );
    if (!reservation) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
    }
    res.send(reservation);
  });

  updateReservation = catchAsync(async (req, res) => {
    const reservation = await this.reservationService.updateReservationById(
      Number(req.params.reservationId),
      req.body
    );
    res.send(reservation);
  });

  confirmReservation = catchAsync(async (req, res) => {
    const reservation = await this.reservationService.confirmReservation(
      Number(req.params.reservationId)
    );
    res.send(reservation);
  });

  cancelReservation = catchAsync(async (req, res) => {
    const { reason } = req.body;
    const reservation = await this.reservationService.cancelReservation(
      Number(req.params.reservationId),
      reason
    );
    res.send(reservation);
  });

  checkInReservation = catchAsync(async (req, res) => {
    const employee = req.user as Employee;
    const stayRecord = await this.stayRecordService.checkInFromReservation(employee.id, {
      reservationId: Number(req.params.reservationId),
      roomAssignments: req.body.roomAssignments,
      notes: req.body.notes
    });
    res.send(stayRecord);
  });

  getTodayArrivals = catchAsync(async (req, res) => {
    const arrivals = await this.reservationService.getTodayArrivals();
    res.send(arrivals);
  });

  getTodayDepartures = catchAsync(async (req, res) => {
    const departures = await this.reservationService.getTodayDepartures();
    res.send(departures);
  });
}

export default ReservationController;
