import { Prisma, PrismaClient, WorkShift, ShiftSession, ShiftSessionStatus } from '@prisma/client';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { Injectable } from 'core/decorators';

/**
 * Create a work shift
 */

@Injectable()
export class ShiftService {
  constructor(private readonly prisma: PrismaClient) {}

  async createWorkShift(data: {
    code: string;
    name: string;
    startTime: Date;
    endTime: Date;
  }): Promise<WorkShift> {
    const existing = await this.prisma.workShift.findUnique({
      where: { code: data.code }
    });

    if (existing) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Work shift code already exists');
    }

    const shift = await this.prisma.workShift.create({
      data
    });

    return shift;
  }

  /**
   * Get all work shifts
   */
  async getWorkShifts(): Promise<WorkShift[]> {
    const shifts = await this.prisma.workShift.findMany({
      orderBy: { startTime: 'asc' }
    });

    return shifts;
  }

  /**
   * Get work shift by ID
   */
  async getWorkShiftById(shiftId: number): Promise<WorkShift | null> {
    const shift = await this.prisma.workShift.findUnique({
      where: { id: shiftId }
    });

    if (!shift) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Work shift not found');
    }

    return shift;
  }

  /**
   * Update work shift
   */
  async updateWorkShift(
    shiftId: number,
    data: {
      name?: string;
      startTime?: Date;
      endTime?: Date;
    }
  ): Promise<WorkShift> {
    const shift = await this.prisma.workShift.update({
      where: { id: shiftId },
      data
    });

    return shift;
  }

  /**
   * Delete work shift
   */
  async deleteWorkShift(shiftId: number): Promise<WorkShift> {
    const shift = await this.prisma.workShift.findUnique({
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

    await this.prisma.workShift.delete({
      where: { id: shiftId }
    });

    return shift;
  }

  // ==========================================
  // SHIFT SESSIONS
  // ==========================================

  /**
   * Open a new shift session
   */
  async openShiftSession(
    employeeId: number,
    shiftId: number,
    openingBalance: number
  ): Promise<ShiftSession> {
    // Check for existing open session
    const existingOpen = await this.prisma.shiftSession.findFirst({
      where: {
        employeeId,
        status: ShiftSessionStatus.OPEN
      }
    });

    if (existingOpen) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Employee already has an open shift session');
    }

    const session = await this.prisma.shiftSession.create({
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
  }

  /**
   * Close a shift session
   */
  async closeShiftSession(
    sessionId: number,
    closingBalance: number,
    notes?: string
  ): Promise<ShiftSession> {
    const session = await this.prisma.shiftSession.findUnique({
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
    const payments = await this.prisma.folioTransaction.aggregate({
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

    const closedSession = await this.prisma.shiftSession.update({
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
  }

  /**
   * Approve a closed shift session
   */
  async approveShiftSession(
    sessionId: number,
    approverId: number,
    notes?: string
  ): Promise<ShiftSession> {
    const session = await this.prisma.shiftSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Shift session not found');
    }

    if (session.status !== ShiftSessionStatus.CLOSED) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Shift session must be closed before approval');
    }

    const approvedSession = await this.prisma.shiftSession.update({
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
  }

  /**
   * Get shift session by ID
   */
  async getShiftSessionById(sessionId: number): Promise<ShiftSession | null> {
    const session = await this.prisma.shiftSession.findUnique({
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
  }

  /**
   * Query shift sessions
   */
  async queryShiftSessions(filter: {
    employeeId?: number;
    shiftId?: number;
    status?: ShiftSessionStatus;
    fromDate?: Date;
    toDate?: Date;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
    limit?: number;
    page?: number;
  }): Promise<{
    results: ShiftSession[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  }> {
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
      this.prisma.shiftSession.findMany({
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
      this.prisma.shiftSession.count({ where })
    ]);

    return {
      results: sessions,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total
    };
  }

  /**
   * Get employee's current open session
   */
  async getCurrentSession(employeeId: number): Promise<ShiftSession | null> {
    const session = await this.prisma.shiftSession.findFirst({
      where: {
        employeeId,
        status: ShiftSessionStatus.OPEN
      },
      include: {
        shift: true
      }
    });

    return session;
  }
}

export default ShiftService;
