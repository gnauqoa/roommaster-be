import { Reservation, ReservationDetail, ReservationStatus, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from 'prisma';
import ApiError from 'utils/ApiError';
import { PaginatedResponse } from 'types/response';

const generateReservationCode = async (): Promise<string> => {
  const today = new Date();
  const prefix = `RES${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;

  const lastReservation = await prisma.reservation.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' }
  });

  let sequence = 1;
  if (lastReservation) {
    const lastSequence = parseInt(lastReservation.code.slice(-4), 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

interface ReservationDetailInput {
  roomTypeId: number;
  quantity?: number;
  expectedRate?: number;
  numberOfGuests?: number;
  notes?: string;
}

const createReservation = async (data: {
  customerId: number;
  expectedArrival: Date;
  expectedDeparture: Date;
  numberOfGuests?: number;
  depositRequired?: number;
  source?: string;
  notes?: string;
  reservationDetails: ReservationDetailInput[];
}): Promise<Reservation> => {
  const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
  if (!customer) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Customer not found');
  }

  // Validate room types
  for (const detail of data.reservationDetails) {
    const roomType = await prisma.roomType.findUnique({ where: { id: detail.roomTypeId } });
    if (!roomType) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Room type ${detail.roomTypeId} not found`);
    }
  }

  const code = await generateReservationCode();

  return prisma.reservation.create({
    data: {
      code,
      customerId: data.customerId,
      expectedArrival: data.expectedArrival,
      expectedDeparture: data.expectedDeparture,
      numberOfGuests: data.numberOfGuests ?? 1,
      depositRequired: data.depositRequired,
      source: data.source,
      notes: data.notes,
      status: ReservationStatus.PENDING,
      reservationDetails: {
        create: data.reservationDetails.map((d) => ({
          roomTypeId: d.roomTypeId,
          quantity: d.quantity ?? 1,
          expectedRate: d.expectedRate,
          numberOfGuests: d.numberOfGuests ?? 1,
          notes: d.notes
        }))
      }
    },
    include: {
      customer: true,
      reservationDetails: { include: { roomType: true } }
    }
  });
};

const queryReservations = async (
  filter: Prisma.ReservationWhereInput,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  }
): Promise<PaginatedResponse<Reservation>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? 'createdAt';
  const sortType = options.sortType ?? 'desc';

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where: filter,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortType },
      include: {
        customer: true,
        reservationDetails: { include: { roomType: true } }
      }
    }),
    prisma.reservation.count({ where: filter })
  ]);

  return {
    results: reservations,
    meta: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total
    }
  };
};

const getReservationById = async (id: number): Promise<Reservation | null> => {
  return prisma.reservation.findUnique({
    where: { id },
    include: {
      customer: true,
      reservationDetails: { include: { roomType: true } },
      guestFolios: true,
      stayRecords: true
    }
  });
};

const updateReservationById = async (
  id: number,
  updateData: Prisma.ReservationUpdateInput
): Promise<Reservation> => {
  const reservation = await getReservationById(id);
  if (!reservation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
  }

  if (reservation.status === ReservationStatus.CHECKED_IN) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update checked-in reservation');
  }

  return prisma.reservation.update({
    where: { id },
    data: updateData,
    include: {
      customer: true,
      reservationDetails: { include: { roomType: true } }
    }
  });
};

const confirmReservation = async (id: number): Promise<Reservation> => {
  const reservation = await getReservationById(id);
  if (!reservation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
  }

  if (reservation.status !== ReservationStatus.PENDING) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only pending reservations can be confirmed');
  }

  return prisma.reservation.update({
    where: { id },
    data: { status: ReservationStatus.CONFIRMED },
    include: {
      customer: true,
      reservationDetails: { include: { roomType: true } }
    }
  });
};

const cancelReservation = async (id: number, reason?: string): Promise<Reservation> => {
  const reservation = await getReservationById(id);
  if (!reservation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
  }

  if (
    reservation.status === ReservationStatus.CHECKED_IN ||
    reservation.status === ReservationStatus.CHECKED_OUT
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot cancel checked-in/out reservation');
  }

  return prisma.reservation.update({
    where: { id },
    data: {
      status: ReservationStatus.CANCELLED,
      notes: reason
        ? `${reservation.notes || ''}\nCancellation reason: ${reason}`
        : reservation.notes
    },
    include: {
      customer: true,
      reservationDetails: { include: { roomType: true } }
    }
  });
};

const addReservationDetail = async (
  reservationId: number,
  detail: ReservationDetailInput
): Promise<ReservationDetail> => {
  const reservation = await getReservationById(reservationId);
  if (!reservation) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reservation not found');
  }

  const roomType = await prisma.roomType.findUnique({ where: { id: detail.roomTypeId } });
  if (!roomType) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Room type not found');
  }

  return prisma.reservationDetail.create({
    data: {
      reservationId,
      roomTypeId: detail.roomTypeId,
      quantity: detail.quantity ?? 1,
      expectedRate: detail.expectedRate,
      numberOfGuests: detail.numberOfGuests ?? 1,
      notes: detail.notes
    },
    include: { roomType: true }
  });
};

const updateReservationDetail = async (
  detailId: number,
  updateData: Prisma.ReservationDetailUpdateInput
): Promise<ReservationDetail> => {
  const detail = await prisma.reservationDetail.findUnique({ where: { id: detailId } });
  if (!detail) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reservation detail not found');
  }

  return prisma.reservationDetail.update({
    where: { id: detailId },
    data: updateData,
    include: { roomType: true }
  });
};

const deleteReservationDetail = async (detailId: number): Promise<ReservationDetail> => {
  const detail = await prisma.reservationDetail.findUnique({ where: { id: detailId } });
  if (!detail) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reservation detail not found');
  }

  return prisma.reservationDetail.delete({ where: { id: detailId } });
};

const getTodayArrivals = async (
  date: Date = new Date(),
  status?: ReservationStatus,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<Reservation>> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const filter: Prisma.ReservationWhereInput = {
    expectedArrival: { gte: startOfDay, lte: endOfDay }
  };

  if (status) {
    filter.status = status;
  } else {
    filter.status = { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] };
  }

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where: filter,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { expectedArrival: 'asc' },
      include: {
        customer: true,
        reservationDetails: { include: { roomType: true } }
      }
    }),
    prisma.reservation.count({ where: filter })
  ]);

  return {
    results: reservations,
    meta: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total
    }
  };
};

const getTodayDepartures = async (
  date: Date = new Date(),
  page = 1,
  limit = 10
): Promise<PaginatedResponse<Reservation>> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const filter: Prisma.ReservationWhereInput = {
    expectedDeparture: { gte: startOfDay, lte: endOfDay },
    status: ReservationStatus.CHECKED_IN
  };

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where: filter,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { expectedDeparture: 'asc' },
      include: {
        customer: true,
        reservationDetails: { include: { roomType: true } }
      }
    }),
    prisma.reservation.count({ where: filter })
  ]);

  return {
    results: reservations,
    meta: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total
    }
  };
};

export default {
  createReservation,
  queryReservations,
  getReservationById,
  updateReservationById,
  confirmReservation,
  cancelReservation,
  addReservationDetail,
  updateReservationDetail,
  deleteReservationDetail,
  getTodayArrivals,
  getTodayDepartures
};
