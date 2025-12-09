import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import { housekeepingService } from 'services';
import { Employee } from '@prisma/client';

// Housekeeping Log Controllers
const createHousekeepingLog = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const log = await housekeepingService.createHousekeepingLog({
    ...req.body,
    employeeId: req.body.employeeId ?? employee.id
  });
  res.status(httpStatus.CREATED).send(log);
});

const getHousekeepingLogs = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['roomId', 'status', 'employeeId', 'priority']);
  const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
  const result = await housekeepingService.queryHousekeepingLogs(filter, options);
  res.send(result);
});

const getHousekeepingLog = catchAsync(async (req, res) => {
  const log = await housekeepingService.getHousekeepingLogById(Number(req.params.logId));
  if (!log) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Housekeeping log not found');
  }
  res.send(log);
});

const startCleaning = catchAsync(async (req, res) => {
  const log = await housekeepingService.startCleaning(Number(req.params.logId));
  res.send(log);
});

const completeCleaning = catchAsync(async (req, res) => {
  const log = await housekeepingService.completeCleaning(Number(req.params.logId), req.body.notes);
  res.send(log);
});

const inspectRoom = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const log = await housekeepingService.inspectRoom(
    Number(req.params.logId),
    employee.id,
    req.body.passed,
    req.body.notes
  );
  res.send(log);
});

const assignHousekeeper = catchAsync(async (req, res) => {
  const log = await housekeepingService.assignHousekeeper(
    Number(req.params.logId),
    req.body.employeeId
  );
  res.send(log);
});

const bulkAssign = catchAsync(async (req, res) => {
  const result = await housekeepingService.bulkAssign(req.body.logIds, req.body.employeeId);
  res.send(result);
});

const getPendingRooms = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['floor', 'priority']);
  const options = pick(req.query, ['limit', 'page']);
  const result = await housekeepingService.getPendingRooms(
    filter,
    options.page ? Number(options.page) : 1,
    options.limit ? Number(options.limit) : 10
  );
  res.send(result);
});

const getMyTasks = catchAsync(async (req, res) => {
  const employee = req.user as Employee;
  const options = pick(req.query, ['status', 'limit', 'page']);
  const result = await housekeepingService.getMyTasks(
    employee.id,
    options.status as any,
    new Date(),
    options.page ? Number(options.page) : 1,
    options.limit ? Number(options.limit) : 10
  );
  res.send(result);
});

export default {
  createHousekeepingLog,
  getHousekeepingLogs,
  getHousekeepingLog,
  startCleaning,
  completeCleaning,
  inspectRoom,
  assignHousekeeper,
  bulkAssign,
  getPendingRooms,
  getMyTasks
};
