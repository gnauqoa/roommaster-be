import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ReportService from '../services/report.service';
import pick from '../utils/pick';
import { Injectable } from 'core/decorators';

@Injectable()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  getDashboard = catchAsync(async (req: Request, res: Response) => {
    const dashboard = await this.reportService.getDashboard();
    res.send(dashboard);
  });

  getOccupancyReport = catchAsync(async (req: Request, res: Response) => {
    const { fromDate, toDate } = pick(req.query, ['fromDate', 'toDate']);

    const from = fromDate ? new Date(fromDate as string) : new Date();
    const to = toDate ? new Date(toDate as string) : new Date();

    // Default to last 30 days if not specified
    if (!fromDate) {
      from.setDate(from.getDate() - 30);
    }

    const report = await this.reportService.getOccupancyReport(from, to);
    res.send(report);
  });

  getRevenueReport = catchAsync(async (req: Request, res: Response) => {
    const { fromDate, toDate } = pick(req.query, ['fromDate', 'toDate']);

    const from = fromDate ? new Date(fromDate as string) : new Date();
    const to = toDate ? new Date(toDate as string) : new Date();

    if (!fromDate) {
      from.setDate(from.getDate() - 30);
    }

    const report = await this.reportService.getRevenueReport(from, to);
    res.send(report);
  });

  getBookingReport = catchAsync(async (req: Request, res: Response) => {
    const { fromDate, toDate } = pick(req.query, ['fromDate', 'toDate']);

    const from = fromDate ? new Date(fromDate as string) : new Date();
    const to = toDate ? new Date(toDate as string) : new Date();

    if (!fromDate) {
      from.setDate(from.getDate() - 30);
    }

    const report = await this.reportService.getBookingReport(from, to);
    res.send(report);
  });

  getDailySnapshot = catchAsync(async (req: Request, res: Response) => {
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const snapshot = await this.reportService.getDailySnapshot(date);
    res.send(snapshot);
  });

  getSnapshots = catchAsync(async (req: Request, res: Response) => {
    const { fromDate, toDate } = pick(req.query, ['fromDate', 'toDate']);

    const from = fromDate ? new Date(fromDate as string) : new Date();
    const to = toDate ? new Date(toDate as string) : new Date();

    if (!fromDate) {
      from.setDate(from.getDate() - 30);
    }

    const snapshots = await this.reportService.getSnapshotsInRange(from, to);
    res.send(snapshots);
  });

  getRevenueByRoomType = catchAsync(async (req: Request, res: Response) => {
    const { fromDate, toDate } = pick(req.query, ['fromDate', 'toDate']);

    const from = fromDate ? new Date(fromDate as string) : new Date();
    const to = toDate ? new Date(toDate as string) : new Date();

    if (!fromDate) {
      from.setDate(from.getDate() - 30);
    }

    const report = await this.reportService.getRevenueByRoomType(from, to);
    res.send(report);
  });
}

export default ReportController;
