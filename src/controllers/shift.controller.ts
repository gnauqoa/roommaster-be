import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ShiftService from '../services/shift.service';
import pick from '../utils/pick';
import { Injectable } from 'core/decorators';

// Work Shifts

@Injectable()
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  createWorkShift = catchAsync(async (req: Request, res: Response) => {
    const shift = await this.shiftService.createWorkShift(req.body);
    res.status(httpStatus.CREATED).send(shift);
  });

  getWorkShifts = catchAsync(async (req: Request, res: Response) => {
    const shifts = await this.shiftService.getWorkShifts();
    res.send(shifts);
  });

  getWorkShift = catchAsync(async (req: Request, res: Response) => {
    const shift = await this.shiftService.getWorkShiftById(Number(req.params.shiftId));
    res.send(shift);
  });

  updateWorkShift = catchAsync(async (req: Request, res: Response) => {
    const shift = await this.shiftService.updateWorkShift(Number(req.params.shiftId), req.body);
    res.send(shift);
  });

  deleteWorkShift = catchAsync(async (req: Request, res: Response) => {
    await this.shiftService.deleteWorkShift(Number(req.params.shiftId));
    res.status(httpStatus.NO_CONTENT).send();
  });

  // Shift Sessions
  openSession = catchAsync(async (req: Request, res: Response) => {
    const employeeId = (req.user as { id: number }).id;
    const { shiftId, openingBalance } = req.body;

    const session = await this.shiftService.openShiftSession(employeeId, shiftId, openingBalance);
    res.status(httpStatus.CREATED).send(session);
  });

  closeSession = catchAsync(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { closingBalance, notes } = req.body;

    const session = await this.shiftService.closeShiftSession(
      Number(sessionId),
      closingBalance,
      notes
    );
    res.send(session);
  });

  approveSession = catchAsync(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const approverId = (req.user as { id: number }).id;
    const { notes } = req.body;

    const session = await this.shiftService.approveShiftSession(
      Number(sessionId),
      approverId,
      notes
    );
    res.send(session);
  });

  getSession = catchAsync(async (req: Request, res: Response) => {
    const session = await this.shiftService.getShiftSessionById(Number(req.params.sessionId));
    res.send(session);
  });

  getSessions = catchAsync(async (req: Request, res: Response) => {
    const filter = pick(req.query, [
      'employeeId',
      'shiftId',
      'status',
      'fromDate',
      'toDate',
      'sortBy',
      'sortType',
      'limit',
      'page'
    ]);

    const result = await this.shiftService.queryShiftSessions(filter);
    res.send(result);
  });

  getCurrentSession = catchAsync(async (req: Request, res: Response) => {
    const employeeId = (req.user as { id: number }).id;
    const session = await this.shiftService.getCurrentSession(employeeId);
    res.send(session);
  });
}

export default ShiftController;
