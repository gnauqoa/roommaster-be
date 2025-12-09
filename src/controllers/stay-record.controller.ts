import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import { stayRecordService } from 'services';
import { Employee } from '@prisma/client';

// Walk-in check-in
const createStayRecord = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const stayRecord = await stayRecordService.createStayRecord(employee.id, req.body);
  res.status(httpStatus.CREATED).send(stayRecord);
});

const getStayRecords = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['customerId', 'status', 'reservationId']);
  const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
  const result = await stayRecordService.queryStayRecords(filter, options);
  res.send(result);
});

const getStayRecord = catchAsync(async (req, res) => {
  const stayRecord = await stayRecordService.getStayRecordById(Number(req.params.stayRecordId));
  if (!stayRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Stay record not found');
  }
  res.send(stayRecord);
});

const checkOut = catchAsync(async (req, res) => {
  const stayDetailIds = req.body.stayDetailIds;
  const stayRecord = await stayRecordService.checkOut(
    Number(req.params.stayRecordId),
    stayDetailIds
  );
  res.send(stayRecord);
});

const checkOutRoom = catchAsync(async (req, res) => {
  const stayDetail = await stayRecordService.checkOutRoom(Number(req.params.stayDetailId));
  res.send(stayDetail);
});

const moveRoom = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const stayDetail = await stayRecordService.moveRoom(
    Number(req.params.stayDetailId),
    req.body.newRoomId,
    employee.id,
    req.body.reason
  );
  res.send(stayDetail);
});

const extendStay = catchAsync(async (req, res) => {
  const stayDetail = await stayRecordService.extendStay(
    Number(req.params.stayDetailId),
    new Date(req.body.newCheckOutDate)
  );
  res.send(stayDetail);
});

const addGuest = catchAsync(async (req, res) => {
  const guest = await stayRecordService.addGuestToRoom(Number(req.params.stayDetailId), req.body);
  res.status(httpStatus.CREATED).send(guest);
});

const getCurrentGuests = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['roomId', 'floor']);
  const options = pick(req.query, ['limit', 'page']);
  const result = await stayRecordService.getCurrentGuests(
    filter,
    options.page ? Number(options.page) : 1,
    options.limit ? Number(options.limit) : 10
  );
  res.send(result);
});

export default {
  createStayRecord,
  getStayRecords,
  getStayRecord,
  checkOut,
  checkOutRoom,
  moveRoom,
  extendStay,
  addGuest,
  getCurrentGuests
};
