import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import NightlyService from '../services/nightly.service';
import { Injectable } from 'core/decorators';

@Injectable()
export class NightlyController {
  constructor(private readonly nightlyService: NightlyService) {}

  runNightlyJobs = catchAsync(async (req: Request, res: Response) => {
    const employeeId = (req.user as { id: number }).id;
    const result = await this.nightlyService.runNightlyJobs(employeeId);
    res.send(result);
  });

  postRoomCharges = catchAsync(async (req: Request, res: Response) => {
    const employeeId = (req.user as { id: number }).id;
    const result = await this.nightlyService.postNightlyRoomCharges(employeeId);
    res.send(result);
  });

  postExtraPersonCharges = catchAsync(async (req: Request, res: Response) => {
    const employeeId = (req.user as { id: number }).id;
    const result = await this.nightlyService.postExtraPersonCharges(employeeId);
    res.send(result);
  });

  createSnapshot = catchAsync(async (req: Request, res: Response) => {
    const date = req.body.date ? new Date(req.body.date) : new Date();
    const snapshot = await this.nightlyService.createDailySnapshot(date);
    res.status(httpStatus.CREATED).send(snapshot);
  });
  markNoShows = catchAsync(async (req: Request, res: Response) => {
    const result = await this.nightlyService.markNoShowReservations();
    res.send(result);
  });
}

export default NightlyController;
