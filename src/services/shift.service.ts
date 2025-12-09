import prisma from '../prisma';
import { Prisma, ShiftSessionStatus } from '@prisma/client';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

/**
 * Create a work shift
 */
const createWorkShift = async (data: {
  code: string;
  name: string;
  startTime: Date;
  endTime: Date;
}) => {
  const existing = await prisma.workShift.findUnique({
    where: { code: data.code }
  });

  if (existing) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Work shift code already exists');
  }

  const shift = await prisma.workShift.create({
    data
  });

  return shift;
};

/**
 * Get all work shifts
 */
const getWorkShifts = async () => {
  const shifts = await prisma.workShift.findMany({
    orderBy: { startTime: 'asc' }
  });

  return shifts;
};

/**
 * Get work shift by ID
 */
const getWorkShiftById = async (shiftId: number) => {
  const shift = await prisma.workShift.findUnique({
    where: { id: shiftId }
  });

  if (!shift) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Work shift not found');
  }

  return shift;
};

/**
 * Update work shift
 */
const updateWorkShift = async (
  shiftId: number,
  data: {
    name?: string;
    startTime?: Date;
    endTime?: Date;
  }
) => {
  const shift = await prisma.workShift.update({
    where: { id: shiftId },
    data
  });

  return shift;
};

/**
 * Delete work shift
 */
const deleteWorkShift = async (shiftId: number) => {
  const shift = await prisma.workShift.findUnique({
    where: { id: shiftId },
    include: {
      _count: {
        select: { shiftSessions: true, workSchedules: true }
      }
    }
  });

  if (!shift) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Work shift not found');
  }

  if (shift._count.shiftSessions > 0 || shift._count.workSchedules > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Cannot delete shift with existing sessions/schedules'
    );
  }

  await prisma.workShift.delete({
    where: { id: shiftId }
  });
};

// ==========================================
// SHIFT SESSIONS
// ==========================================

/**
 * Open a new shift session
 */
const openShiftSession = async (employeeId: number, shiftId: number, openingBalance: number) => {
  // Check for existing open session
  const existingOpen = await prisma.shiftSession.findFirst({
    where: {
      employeeId,
      status: ShiftSessionStatus.OPEN
    }
  });

  if (existingOpen) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee already has an open shift session');
  }

  const session = await prisma.shiftSession.create({
    data: {
      employeeId,
      shiftId,
      openingBalance: new Prisma.Decimal(openingBalance),
      status: ShiftSessionStatus.OPEN
    },
    include: {
      employee: {
        select: { id: true, name: true, code: true }
      },
      shift: true
    }
  });

  return session;
};

/**
 * Close a shift session
 */
const closeShiftSession = async (sessionId: number, closingBalance: number, notes?: string) => {
  const session = await prisma.shiftSession.findUnique({
    where: { id: sessionId },
    include: { employee: true }
  });

  if (!session) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shift session not found');
  }

  if (session.status !== ShiftSessionStatus.OPEN) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Shift session is not open');
  }

  // Calculate expected balance (sum of payments during shift)
  const payments = await prisma.folioTransaction.aggregate({
    where: {
      employeeId: session.employeeId,
      transactionDate: {
        gte: session.startTime,
        lte: new Date()
      },
      category: 'PAYMENT',
      isVoid: false
    },
    _sum: { amount: true }
  });

  const paymentTotal = payments._sum.amount || new Prisma.Decimal(0);
  const expectedBalance = session.openingBalance.add(paymentTotal);
  const variance = new Prisma.Decimal(closingBalance).sub(expectedBalance);

  const closedSession = await prisma.shiftSession.update({
    where: { id: sessionId },
    data: {
      endTime: new Date(),
      closingBalance: new Prisma.Decimal(closingBalance),
      expectedBalance,
      variance,
      status: ShiftSessionStatus.CLOSED,
      notes
    },
    include: {
      employee: {
        select: { id: true, name: true, code: true }
      },
      shift: true
    }
  });

  return closedSession;
};

/**
 * Approve a closed shift session
 */
const approveShiftSession = async (sessionId: number, approverId: number, notes?: string) => {
  const session = await prisma.shiftSession.findUnique({
    where: { id: sessionId }
  });

  if (!session) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shift session not found');
  }

  if (session.status !== ShiftSessionStatus.CLOSED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Shift session must be closed before approval');
  }

  const approvedSession = await prisma.shiftSession.update({
    where: { id: sessionId },
    data: {
      status: ShiftSessionStatus.APPROVED,
      approvedBy: approverId,
      approvedAt: new Date(),
      notes: notes ? `${session.notes || ''}\nApproval: ${notes}` : session.notes
    },
    include: {
      employee: {
        select: { id: true, name: true, code: true }
      },
      shift: true,
      approver: {
        select: { id: true, name: true, code: true }
      }
    }
  });

  return approvedSession;
};

/**
 * Get shift session by ID
 */
const getShiftSessionById = async (sessionId: number) => {
  const session = await prisma.shiftSession.findUnique({
    where: { id: sessionId },
    include: {
      employee: {
        select: { id: true, name: true, code: true }
      },
      shift: true,
      approver: {
        select: { id: true, name: true, code: true }
      }
    }
  });

  if (!session) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shift session not found');
  }

  return session;
};

/**
 * Query shift sessions
 */
const queryShiftSessions = async (filter: {
  employeeId?: number;
  shiftId?: number;
  status?: ShiftSessionStatus;
  fromDate?: Date;
  toDate?: Date;
  sortBy?: string;
  sortType?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}) => {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Prisma.ShiftSessionWhereInput = {};

  if (filter.employeeId) where.employeeId = filter.employeeId;
  if (filter.shiftId) where.shiftId = filter.shiftId;
  if (filter.status) where.status = filter.status;
  if (filter.fromDate || filter.toDate) {
    where.startTime = {};
    if (filter.fromDate) where.startTime.gte = filter.fromDate;
    if (filter.toDate) where.startTime.lte = filter.toDate;
  }

  const orderBy: Prisma.ShiftSessionOrderByWithRelationInput = {};
  if (filter.sortBy) {
    orderBy[filter.sortBy as keyof Prisma.ShiftSessionOrderByWithRelationInput] =
      filter.sortType || 'desc';
  } else {
    orderBy.startTime = 'desc';
  }

  const [sessions, total] = await Promise.all([
    prisma.shiftSession.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        employee: {
          select: { id: true, name: true, code: true }
        },
        shift: true
      }
    }),
    prisma.shiftSession.count({ where })
  ]);

  return {
    results: sessions,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    totalResults: total
  };
};

/**
 * Get employee's current open session
 */
const getCurrentSession = async (employeeId: number) => {
  const session = await prisma.shiftSession.findFirst({
    where: {
      employeeId,
      status: ShiftSessionStatus.OPEN
    },
    include: {
      shift: true
    }
  });

  return session;
};

export default {
  // Work shifts
  createWorkShift,
  getWorkShifts,
  getWorkShiftById,
  updateWorkShift,
  deleteWorkShift,
  // Shift sessions
  openShiftSession,
  closeShiftSession,
  approveShiftSession,
  getShiftSessionById,
  queryShiftSessions,
  getCurrentSession
};
