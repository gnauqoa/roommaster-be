import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { shiftService } from '../services';
import pick from '../utils/pick';

// Work Shifts
const createWorkShift = catchAsync(async (req: Request, res: Response) => {
  const shift = await shiftService.createWorkShift(req.body);
  res.status(httpStatus.CREATED).send(shift);
});

const getWorkShifts = catchAsync(async (req: Request, res: Response) => {
  const shifts = await shiftService.getWorkShifts();
  res.send(shifts);
});

const getWorkShift = catchAsync(async (req: Request, res: Response) => {
  const shift = await shiftService.getWorkShiftById(Number(req.params.shiftId));
  res.send(shift);
});

const updateWorkShift = catchAsync(async (req: Request, res: Response) => {
  const shift = await shiftService.updateWorkShift(Number(req.params.shiftId), req.body);
  res.send(shift);
});

const deleteWorkShift = catchAsync(async (req: Request, res: Response) => {
  await shiftService.deleteWorkShift(Number(req.params.shiftId));
  res.status(httpStatus.NO_CONTENT).send();
});

// Shift Sessions
const openSession = catchAsync(async (req: Request, res: Response) => {
  const employeeId = (req.user as { id: number }).id;
  const { shiftId, openingBalance } = req.body;

  const session = await shiftService.openShiftSession(employeeId, shiftId, openingBalance);
  res.status(httpStatus.CREATED).send(session);
});

const closeSession = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { closingBalance, notes } = req.body;

  const session = await shiftService.closeShiftSession(Number(sessionId), closingBalance, notes);
  res.send(session);
});

const approveSession = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const approverId = (req.user as { id: number }).id;
  const { notes } = req.body;

  const session = await shiftService.approveShiftSession(Number(sessionId), approverId, notes);
  res.send(session);
});

const getSession = catchAsync(async (req: Request, res: Response) => {
  const session = await shiftService.getShiftSessionById(Number(req.params.sessionId));
  res.send(session);
});

const getSessions = catchAsync(async (req: Request, res: Response) => {
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

  const result = await shiftService.queryShiftSessions(filter);
  res.send(result);
});

const getCurrentSession = catchAsync(async (req: Request, res: Response) => {
  const employeeId = (req.user as { id: number }).id;
  const session = await shiftService.getCurrentSession(employeeId);
  res.send(session);
});

export default {
  // Work shifts
  createWorkShift,
  getWorkShifts,
  getWorkShift,
  updateWorkShift,
  deleteWorkShift,
  // Sessions
  openSession,
  closeSession,
  approveSession,
  getSession,
  getSessions,
  getCurrentSession
};
