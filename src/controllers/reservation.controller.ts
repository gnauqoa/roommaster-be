import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import { reservationService, stayRecordService } from 'services';
import { Employee } from '@prisma/client';

const createReservation = catchAsync(async (req, res) => {
  const reservation = await reservationService.createReservation(req.body);
  res.status(httpStatus.CREATED).send(reservation);
});

const getReservations = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'customerId',
    'status',
    'checkInDate',
    'checkOutDate',
    'roomTypeId'
  ]);
  const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
  const result = await reservationService.queryReservations(filter, options);
  res.send(result);
});

const getReservation = catchAsync(async (req, res) => {
  const reservation = await reservationService.getReservationById(Number(req.params.reservationId));
  if (!reservation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
  }
  res.send(reservation);
});

const updateReservation = catchAsync(async (req, res) => {
  const reservation = await reservationService.updateReservationById(
    Number(req.params.reservationId),
    req.body
  );
  res.send(reservation);
});

const confirmReservation = catchAsync(async (req, res) => {
  const reservation = await reservationService.confirmReservation(Number(req.params.reservationId));
  res.send(reservation);
});

const cancelReservation = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const reservation = await reservationService.cancelReservation(
    Number(req.params.reservationId),
    reason
  );
  res.send(reservation);
});

const checkInReservation = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const stayRecord = await stayRecordService.checkInFromReservation(employee.id, {
    reservationId: Number(req.params.reservationId),
    roomAssignments: req.body.roomAssignments,
    notes: req.body.notes
  });
  res.send(stayRecord);
});

const getTodayArrivals = catchAsync(async (req, res) => {
  const arrivals = await reservationService.getTodayArrivals();
  res.send(arrivals);
});

const getTodayDepartures = catchAsync(async (req, res) => {
  const departures = await reservationService.getTodayDepartures();
  res.send(departures);
});

export default {
  createReservation,
  getReservations,
  getReservation,
  updateReservation,
  confirmReservation,
  cancelReservation,
  checkInReservation,
  getTodayArrivals,
  getTodayDepartures
};
