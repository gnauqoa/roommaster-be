import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import InspectionService from '../services/inspection.service';
import { Injectable } from 'core/decorators';

@Injectable()
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  createInspection = catchAsync(async (req: Request, res: Response) => {
    const { stayDetailId } = req.params;
    const inspectedById = (req.user as { id: number }).id;

    const inspection = await this.inspectionService.createInspection(
      Number(stayDetailId),
      inspectedById,
      req.body
    );

    res.status(httpStatus.CREATED).send(inspection);
  });

  getInspection = catchAsync(async (req: Request, res: Response) => {
    const { stayDetailId } = req.params;
    const inspection = await this.inspectionService.getInspectionByStayDetail(Number(stayDetailId));
    res.send(inspection);
  });

  updateInspection = catchAsync(async (req: Request, res: Response) => {
    const { stayDetailId } = req.params;
    const inspection = await this.inspectionService.updateInspection(
      Number(stayDetailId),
      req.body
    );
    res.send(inspection);
  });

  canCheckout = catchAsync(async (req: Request, res: Response) => {
    const { stayDetailId } = req.params;
    const result = await this.inspectionService.canCheckout(Number(stayDetailId));
    res.send({ canCheckout: result });
  });
}

export default InspectionController;
