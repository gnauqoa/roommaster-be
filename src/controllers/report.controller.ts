import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { reportService } from '../services';
import pick from '../utils/pick';

const getDashboard = catchAsync(async (req: Request, res: Response) => {
  const dashboard = await reportService.getDashboard();
  res.send(dashboard);
});

const getOccupancyReport = catchAsync(async (req: Request, res: Response) => {
  const { fromDate, toDate } = pick(req.query, ['fromDate', 'toDate']);

  const from = fromDate ? new Date(fromDate as string) : new Date();
  const to = toDate ? new Date(toDate as string) : new Date();

  // Default to last 30 days if not specified
  if (!fromDate) {
    from.setDate(from.getDate() - 30);
  }

  const report = await reportService.getOccupancyReport(from, to);
  res.send(report);
});

const getRevenueReport = catchAsync(async (req: Request, res: Response) => {
  const { fromDate, toDate } = pick(req.query, ['fromDate', 'toDate']);

  const from = fromDate ? new Date(fromDate as string) : new Date();
  const to = toDate ? new Date(toDate as string) : new Date();

  if (!fromDate) {
    from.setDate(from.getDate() - 30);
  }

  const report = await reportService.getRevenueReport(from, to);
  res.send(report);
});

const getBookingReport = catchAsync(async (req: Request, res: Response) => {
  const { fromDate, toDate } = pick(req.query, ['fromDate', 'toDate']);

  const from = fromDate ? new Date(fromDate as string) : new Date();
  const to = toDate ? new Date(toDate as string) : new Date();

  if (!fromDate) {
    from.setDate(from.getDate() - 30);
  }

  const report = await reportService.getBookingReport(from, to);
  res.send(report);
});

const getDailySnapshot = catchAsync(async (req: Request, res: Response) => {
  const date = req.query.date ? new Date(req.query.date as string) : new Date();
  const snapshot = await reportService.getDailySnapshot(date);
  res.send(snapshot);
});

const getSnapshots = catchAsync(async (req: Request, res: Response) => {
  const { fromDate, toDate } = pick(req.query, ['fromDate', 'toDate']);

  const from = fromDate ? new Date(fromDate as string) : new Date();
  const to = toDate ? new Date(toDate as string) : new Date();

  if (!fromDate) {
    from.setDate(from.getDate() - 30);
  }

  const snapshots = await reportService.getSnapshotsInRange(from, to);
  res.send(snapshots);
});

const getRevenueByRoomType = catchAsync(async (req: Request, res: Response) => {
  const { fromDate, toDate } = pick(req.query, ['fromDate', 'toDate']);

  const from = fromDate ? new Date(fromDate as string) : new Date();
  const to = toDate ? new Date(toDate as string) : new Date();

  if (!fromDate) {
    from.setDate(from.getDate() - 30);
  }

  const report = await reportService.getRevenueByRoomType(from, to);
  res.send(report);
});

export default {
  getDashboard,
  getOccupancyReport,
  getRevenueReport,
  getBookingReport,
  getDailySnapshot,
  getSnapshots,
  getRevenueByRoomType
};
