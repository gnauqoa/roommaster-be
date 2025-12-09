import { HousekeepingLog, HousekeepingStatus, RoomStatus, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from 'prisma';
import ApiError from 'utils/ApiError';
import { PaginatedResponse } from 'types/response';

const createHousekeepingLog = async (data: {
  roomId: number;
  employeeId: number;
  priority?: number;
  notes?: string;
}): Promise<HousekeepingLog> => {
  const room = await prisma.room.findUnique({ where: { id: data.roomId } });
  if (!room) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Room not found');
  }

  const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
  if (!employee) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee not found');
  }

  return prisma.housekeepingLog.create({
    data: {
      roomId: data.roomId,
      employeeId: data.employeeId,
      priority: data.priority ?? 0,
      notes: data.notes,
      status: HousekeepingStatus.ASSIGNED
    },
    include: {
      room: { include: { roomType: true } },
      employee: { select: { id: true, name: true, code: true } }
    }
  });
};

const queryHousekeepingLogs = async (
  filter: Prisma.HousekeepingLogWhereInput,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  }
): Promise<PaginatedResponse<HousekeepingLog>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? 'assignedAt';
  const sortType = options.sortType ?? 'desc';

  const [logs, total] = await Promise.all([
    prisma.housekeepingLog.findMany({
      where: filter,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortType },
      include: {
        room: { include: { roomType: true } },
        employee: { select: { id: true, name: true, code: true } },
        inspector: { select: { id: true, name: true, code: true } }
      }
    }),
    prisma.housekeepingLog.count({ where: filter })
  ]);

  return {
    results: logs,
    meta: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total
    }
  };
};

const getHousekeepingLogById = async (id: number): Promise<HousekeepingLog | null> => {
  return prisma.housekeepingLog.findUnique({
    where: { id },
    include: {
      room: { include: { roomType: true } },
      employee: { select: { id: true, name: true, code: true } },
      inspector: { select: { id: true, name: true, code: true } }
    }
  });
};

const startCleaning = async (id: number): Promise<HousekeepingLog> => {
  const log = await getHousekeepingLogById(id);
  if (!log) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Housekeeping log not found');
  }

  if (log.status !== HousekeepingStatus.ASSIGNED && log.status !== HousekeepingStatus.PENDING) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid status for starting cleaning');
  }

  return prisma.housekeepingLog.update({
    where: { id },
    data: {
      status: HousekeepingStatus.IN_PROGRESS,
      startedAt: new Date()
    },
    include: {
      room: { include: { roomType: true } },
      employee: { select: { id: true, name: true, code: true } }
    }
  });
};

const completeCleaning = async (id: number, notes?: string): Promise<HousekeepingLog> => {
  const log = await getHousekeepingLogById(id);
  if (!log) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Housekeeping log not found');
  }

  if (log.status !== HousekeepingStatus.IN_PROGRESS) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cleaning must be in progress');
  }

  return prisma.housekeepingLog.update({
    where: { id },
    data: {
      status: HousekeepingStatus.COMPLETED,
      completedAt: new Date(),
      notes: notes ? `${log.notes || ''}\n${notes}` : log.notes
    },
    include: {
      room: { include: { roomType: true } },
      employee: { select: { id: true, name: true, code: true } }
    }
  });
};

const inspectRoom = async (
  id: number,
  inspectorId: number,
  passed: boolean,
  notes?: string
): Promise<HousekeepingLog> => {
  const log = await getHousekeepingLogById(id);
  if (!log) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Housekeeping log not found');
  }

  if (log.status !== HousekeepingStatus.COMPLETED && log.status !== HousekeepingStatus.INSPECTING) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cleaning must be completed for inspection');
  }

  const newStatus = passed ? HousekeepingStatus.PASSED : HousekeepingStatus.FAILED;

  const updated = await prisma.housekeepingLog.update({
    where: { id },
    data: {
      status: newStatus,
      inspectedBy: inspectorId,
      inspectedAt: new Date(),
      notes: notes ? `${log.notes || ''}\nInspection: ${notes}` : log.notes
    },
    include: {
      room: { include: { roomType: true } },
      employee: { select: { id: true, name: true, code: true } },
      inspector: { select: { id: true, name: true, code: true } }
    }
  });

  // Update room status based on inspection result
  if (passed) {
    await prisma.room.update({
      where: { id: log.roomId },
      data: { status: RoomStatus.AVAILABLE }
    });
  }

  return updated;
};

const assignHousekeeper = async (id: number, employeeId: number): Promise<HousekeepingLog> => {
  const log = await getHousekeepingLogById(id);
  if (!log) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Housekeeping log not found');
  }

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee not found');
  }

  return prisma.housekeepingLog.update({
    where: { id },
    data: {
      employeeId,
      status: HousekeepingStatus.ASSIGNED,
      assignedAt: new Date()
    },
    include: {
      room: { include: { roomType: true } },
      employee: { select: { id: true, name: true, code: true } }
    }
  });
};

const bulkAssign = async (
  roomIds: number[],
  employeeId: number,
  priority = 0
): Promise<HousekeepingLog[]> => {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Employee not found');
  }

  const logs: HousekeepingLog[] = [];
  for (const roomId of roomIds) {
    const log = await createHousekeepingLog({
      roomId,
      employeeId,
      priority
    });
    logs.push(log);
  }

  return logs;
};

const getPendingRooms = async (
  filter: { floor?: number; priority?: number },
  page = 1,
  limit = 10
): Promise<PaginatedResponse<HousekeepingLog>> => {
  const whereClause: Prisma.HousekeepingLogWhereInput = {
    status: { in: [HousekeepingStatus.PENDING, HousekeepingStatus.ASSIGNED] }
  };

  if (filter.floor) {
    whereClause.room = { floor: filter.floor };
  }

  if (filter.priority !== undefined) {
    whereClause.priority = filter.priority;
  }

  return queryHousekeepingLogs(whereClause, { page, limit, sortBy: 'priority', sortType: 'desc' });
};

const getMyTasks = async (
  employeeId: number,
  status?: HousekeepingStatus,
  date: Date = new Date(),
  page = 1,
  limit = 10
): Promise<PaginatedResponse<HousekeepingLog>> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const whereClause: Prisma.HousekeepingLogWhereInput = {
    employeeId,
    assignedAt: { gte: startOfDay, lte: endOfDay }
  };

  if (status) {
    whereClause.status = status;
  }

  return queryHousekeepingLogs(whereClause, { page, limit, sortBy: 'priority', sortType: 'desc' });
};

export default {
  createHousekeepingLog,
  queryHousekeepingLogs,
  getHousekeepingLogById,
  startCleaning,
  completeCleaning,
  inspectRoom,
  assignHousekeeper,
  bulkAssign,
  getPendingRooms,
  getMyTasks
};
