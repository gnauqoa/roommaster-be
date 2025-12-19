import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import HousekeepingService from 'services/housekeeping.service';
import { Employee } from '@prisma/client';
import { Injectable } from 'core/decorators';

// Housekeeping Log Controllers

@Injectable()
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  createHousekeepingLog = catchAsync(async (req, res) => {
    const employee = req.user as Employee;
    const log = await this.housekeepingService.createHousekeepingLog({
      ...req.body,
      employeeId: req.body.employeeId ?? employee.id
    });
    res.status(httpStatus.CREATED).send(log);
  });

  getHousekeepingLogs = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['roomId', 'status', 'employeeId', 'priority']);
    const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
    const result = await this.housekeepingService.queryHousekeepingLogs(filter, options);
    res.send(result);
  });

  getHousekeepingLog = catchAsync(async (req, res) => {
    const log = await this.housekeepingService.getHousekeepingLogById(Number(req.params.logId));
    if (!log) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Housekeeping log not found');
    }
    res.send(log);
  });

  startCleaning = catchAsync(async (req, res) => {
    const log = await this.housekeepingService.startCleaning(Number(req.params.logId));
    res.send(log);
  });

  completeCleaning = catchAsync(async (req, res) => {
    const log = await this.housekeepingService.completeCleaning(
      Number(req.params.logId),
      req.body.notes
    );
    res.send(log);
  });

  inspectRoom = catchAsync(async (req, res) => {
    const employee = req.user as Employee;
    const log = await this.housekeepingService.inspectRoom(
      Number(req.params.logId),
      employee.id,
      req.body.passed,
      req.body.notes
    );
    res.send(log);
  });

  assignHousekeeper = catchAsync(async (req, res) => {
    const log = await this.housekeepingService.assignHousekeeper(
      Number(req.params.logId),
      req.body.employeeId
    );
    res.send(log);
  });

  bulkAssign = catchAsync(async (req, res) => {
    const result = await this.housekeepingService.bulkAssign(req.body.logIds, req.body.employeeId);
    res.send(result);
  });

  getPendingRooms = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['floor', 'priority']);
    const options = pick(req.query, ['limit', 'page']);
    const result = await this.housekeepingService.getPendingRooms(
      filter,
      options.page ? Number(options.page) : 1,
      options.limit ? Number(options.limit) : 10
    );
    res.send(result);
  });

  getMyTasks = catchAsync(async (req, res) => {
    const employee = req.user as Employee;
    const options = pick(req.query, ['status', 'limit', 'page']);
    const result = await this.housekeepingService.getMyTasks(
      employee.id,
      options.status as any,
      new Date(),
      options.page ? Number(options.page) : 1,
      options.limit ? Number(options.limit) : 10
    );
    res.send(result);
  });
}

export default HousekeepingController;
