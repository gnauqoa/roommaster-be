import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import StayRecordService from 'services/stay-record.service';
import { Employee } from '@prisma/client';
import { Injectable } from 'core/decorators';

// Walk-in check-in

@Injectable()
export class StayRecordController {
  constructor(private readonly stayRecordService: StayRecordService) {}

  createStayRecord = catchAsync(async (req, res) => {
    const employee = req.user as Employee;
    const stayRecord = await this.stayRecordService.createStayRecord(employee.id, req.body);
    res.status(httpStatus.CREATED).send(stayRecord);
  });

  getStayRecords = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['customerId', 'status', 'reservationId']);
    const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
    const result = await this.stayRecordService.queryStayRecords(filter, options);
    res.send(result);
  });

  getStayRecord = catchAsync(async (req, res) => {
    const stayRecord = await this.stayRecordService.getStayRecordById(
      Number(req.params.stayRecordId)
    );
    if (!stayRecord) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Stay record not found');
    }
    res.send(stayRecord);
  });

  checkOut = catchAsync(async (req, res) => {
    const stayDetailIds = req.body.stayDetailIds;
    const stayRecord = await this.stayRecordService.checkOut(
      Number(req.params.stayRecordId),
      stayDetailIds
    );
    res.send(stayRecord);
  });

  checkOutRoom = catchAsync(async (req, res) => {
    const stayDetail = await this.stayRecordService.checkOutRoom(Number(req.params.stayDetailId));
    res.send(stayDetail);
  });

  moveRoom = catchAsync(async (req, res) => {
    const employee = req.user as Employee;
    const stayDetail = await this.stayRecordService.moveRoom(
      Number(req.params.stayDetailId),
      req.body.newRoomId,
      employee.id,
      req.body.reason
    );
    res.send(stayDetail);
  });

  extendStay = catchAsync(async (req, res) => {
    const stayDetail = await this.stayRecordService.extendStay(
      Number(req.params.stayDetailId),
      new Date(req.body.newCheckOutDate)
    );
    res.send(stayDetail);
  });

  addGuest = catchAsync(async (req, res) => {
    const guest = await this.stayRecordService.addGuestToRoom(
      Number(req.params.stayDetailId),
      req.body
    );
    res.status(httpStatus.CREATED).send(guest);
  });

  getCurrentGuests = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['roomId', 'floor']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await this.stayRecordService.getCurrentGuests(
      filter,
      options.page ? Number(options.page) : 1,
      options.limit ? Number(options.limit) : 10
    );
    res.send(result);
  });
}

export default StayRecordController;
