import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { nightlyService } from '../services';

const runNightlyJobs = catchAsync(async (req: Request, res: Response) => {
  const employeeId = (req.user as { id: number }).id;
  const result = await nightlyService.runNightlyJobs(employeeId);
  res.send(result);
});

const postRoomCharges = catchAsync(async (req: Request, res: Response) => {
  const employeeId = (req.user as { id: number }).id;
  const result = await nightlyService.postNightlyRoomCharges(employeeId);
  res.send(result);
});

const postExtraPersonCharges = catchAsync(async (req: Request, res: Response) => {
  const employeeId = (req.user as { id: number }).id;
  const result = await nightlyService.postExtraPersonCharges(employeeId);
  res.send(result);
});

const createSnapshot = catchAsync(async (req: Request, res: Response) => {
  const date = req.body.date ? new Date(req.body.date) : new Date();
  const snapshot = await nightlyService.createDailySnapshot(date);
  res.status(httpStatus.CREATED).send(snapshot);
});

const markNoShows = catchAsync(async (req: Request, res: Response) => {
  const result = await nightlyService.markNoShowReservations();
  res.send(result);
});

export default {
  runNightlyJobs,
  postRoomCharges,
  postExtraPersonCharges,
  createSnapshot,
  markNoShows
};
