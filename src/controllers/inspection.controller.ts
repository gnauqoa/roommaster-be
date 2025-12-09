import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { inspectionService } from '../services';

const createInspection = catchAsync(async (req: Request, res: Response) => {
  const { stayDetailId } = req.params;
  const inspectedById = (req.user as { id: number }).id;

  const inspection = await inspectionService.createInspection(
    Number(stayDetailId),
    inspectedById,
    req.body
  );

  res.status(httpStatus.CREATED).send(inspection);
});

const getInspection = catchAsync(async (req: Request, res: Response) => {
  const { stayDetailId } = req.params;
  const inspection = await inspectionService.getInspectionByStayDetail(Number(stayDetailId));
  res.send(inspection);
});

const updateInspection = catchAsync(async (req: Request, res: Response) => {
  const { stayDetailId } = req.params;
  const inspection = await inspectionService.updateInspection(Number(stayDetailId), req.body);
  res.send(inspection);
});

const canCheckout = catchAsync(async (req: Request, res: Response) => {
  const { stayDetailId } = req.params;
  const result = await inspectionService.canCheckout(Number(stayDetailId));
  res.send({ canCheckout: result });
});

export default {
  createInspection,
  getInspection,
  updateInspection,
  canCheckout
};
