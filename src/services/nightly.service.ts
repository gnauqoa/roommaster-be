import prisma from '../prisma';
import {
  Prisma,
  RoomStatus,
  StayDetailStatus,
  TransactionType,
  TransactionCategory,
  ServiceGroup,
  ReservationStatus
} from '@prisma/client';

/**
 * Generate unique transaction code
 */
const generateTransactionCode = async (): Promise<string> => {
  const today = new Date();
  const datePrefix = `TX${today.getFullYear()}${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}${String(today.getDate()).padStart(2, '0')}`;

  const lastTx = await prisma.folioTransaction.findFirst({
    where: {
      code: {
        startsWith: datePrefix
      }
    },
    orderBy: {
      code: 'desc'
    }
  });

  let sequence = 1;
  if (lastTx) {
    const lastSequence = parseInt(lastTx.code.slice(-5), 10);
    sequence = lastSequence + 1;
  }

  return `${datePrefix}${String(sequence).padStart(5, '0')}`;
};

/**
 * Post nightly room charges for all occupied rooms
 * Should run at midnight (00:00) every day
 */
const postNightlyRoomCharges = async (employeeId: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all occupied stay details with their folios
  const occupiedStayDetails = await prisma.stayDetail.findMany({
    where: {
      status: StayDetailStatus.OCCUPIED
    },
    include: {
      room: {
        include: {
          roomType: true
        }
      },
      stayRecord: {
        include: {
          guestFolios: {
            where: {
              status: 'OPEN'
            }
          }
        }
      }
    }
  });

  const results: Array<{ stayDetailId: number; success: boolean; error?: string }> = [];

  for (const stayDetail of occupiedStayDetails) {
    try {
      // Get the first open folio for this stay
      const folio = stayDetail.stayRecord.guestFolios[0];
      if (!folio) {
        results.push({ stayDetailId: stayDetail.id, success: false, error: 'No open folio found' });
        continue;
      }

      // Check if room charge already posted for today
      const existingCharge = await prisma.folioTransaction.findFirst({
        where: {
          guestFolioId: folio.id,
          stayDetailId: stayDetail.id,
          category: TransactionCategory.ROOM_CHARGE,
          postingDate: today,
          isVoid: false
        }
      });

      if (existingCharge) {
        results.push({
          stayDetailId: stayDetail.id,
          success: false,
          error: 'Room charge already posted'
        });
        continue;
      }

      // Calculate room rate (use locked rate or calculate from room type)
      const roomRate = stayDetail.lockedRate || stayDetail.room.roomType.rackRate;

      // Create room charge transaction
      const txCode = await generateTransactionCode();
      await prisma.folioTransaction.create({
        data: {
          code: txCode,
          guestFolioId: folio.id,
          stayDetailId: stayDetail.id,
          transactionType: TransactionType.DEBIT,
          category: TransactionCategory.ROOM_CHARGE,
          amount: roomRate,
          quantity: 1,
          unitPrice: roomRate,
          description: `Room Charge - ${stayDetail.room.code} (${stayDetail.room.roomType.name})`,
          postingDate: today,
          employeeId
        }
      });

      // Update folio totals
      await prisma.guestFolio.update({
        where: { id: folio.id },
        data: {
          totalCharges: { increment: roomRate },
          balance: { increment: roomRate }
        }
      });

      results.push({ stayDetailId: stayDetail.id, success: true });
    } catch (error) {
      results.push({
        stayDetailId: stayDetail.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return {
    date: today,
    totalProcessed: occupiedStayDetails.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    details: results
  };
};

/**
 * Post extra person charges for rooms with guests exceeding base capacity
 */
const postExtraPersonCharges = async (employeeId: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all occupied stay details with extra guests
  const stayDetailsWithExtraGuests = await prisma.stayDetail.findMany({
    where: {
      status: StayDetailStatus.OCCUPIED
    },
    include: {
      room: {
        include: {
          roomType: true
        }
      },
      guestsInResidence: true,
      stayRecord: {
        include: {
          guestFolios: {
            where: {
              status: 'OPEN'
            }
          }
        }
      }
    }
  });

  const results: Array<{ stayDetailId: number; success: boolean; error?: string }> = [];

  // Get extra person service
  const extraPersonService = await prisma.service.findFirst({
    where: {
      serviceGroup: ServiceGroup.SURCHARGE,
      code: { contains: 'EXTRA_PERSON' }
    }
  });

  for (const stayDetail of stayDetailsWithExtraGuests) {
    try {
      const baseCapacity = stayDetail.room.roomType.baseCapacity;
      const actualGuests = stayDetail.guestsInResidence.length || stayDetail.numberOfGuests;

      if (actualGuests <= baseCapacity) {
        continue; // No extra guests
      }

      const folio = stayDetail.stayRecord.guestFolios[0];
      if (!folio) {
        results.push({ stayDetailId: stayDetail.id, success: false, error: 'No open folio found' });
        continue;
      }

      // Check if extra person charge already posted for today
      const existingCharge = await prisma.folioTransaction.findFirst({
        where: {
          guestFolioId: folio.id,
          stayDetailId: stayDetail.id,
          category: TransactionCategory.SURCHARGE,
          postingDate: today,
          description: { contains: 'Extra Person' },
          isVoid: false
        }
      });

      if (existingCharge) {
        continue; // Already posted
      }

      const extraGuests = actualGuests - baseCapacity;
      const extraPersonFee = stayDetail.room.roomType.extraPersonFee;
      const totalCharge = extraPersonFee.mul(extraGuests);

      const txCode = await generateTransactionCode();
      await prisma.folioTransaction.create({
        data: {
          code: txCode,
          guestFolioId: folio.id,
          stayDetailId: stayDetail.id,
          serviceId: extraPersonService?.id,
          transactionType: TransactionType.DEBIT,
          category: TransactionCategory.SURCHARGE,
          amount: totalCharge,
          quantity: extraGuests,
          unitPrice: extraPersonFee,
          description: `Extra Person Charge (${extraGuests} extra guest${
            extraGuests > 1 ? 's' : ''
          })`,
          postingDate: today,
          employeeId
        }
      });

      // Update folio totals
      await prisma.guestFolio.update({
        where: { id: folio.id },
        data: {
          totalCharges: { increment: totalCharge },
          balance: { increment: totalCharge }
        }
      });

      results.push({ stayDetailId: stayDetail.id, success: true });
    } catch (error) {
      results.push({
        stayDetailId: stayDetail.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return {
    date: today,
    totalWithExtraGuests: results.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    details: results
  };
};

/**
 * Create daily snapshot for reporting
 */
const createDailySnapshot = async (snapshotDate?: Date) => {
  const date = snapshotDate || new Date();
  date.setHours(0, 0, 0, 0);

  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Room metrics
  const totalRooms = await prisma.room.count();
  const roomsByStatus = await prisma.room.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  const statusCounts: Record<RoomStatus, number> = {
    [RoomStatus.AVAILABLE]: 0,
    [RoomStatus.RESERVED]: 0,
    [RoomStatus.OCCUPIED]: 0,
    [RoomStatus.CLEANING]: 0,
    [RoomStatus.MAINTENANCE]: 0,
    [RoomStatus.OUT_OF_ORDER]: 0
  };

  roomsByStatus.forEach((r) => {
    statusCounts[r.status] = r._count.id;
  });

  const availableRooms = statusCounts[RoomStatus.AVAILABLE];
  const occupiedRooms = statusCounts[RoomStatus.OCCUPIED];
  const reservedRooms = statusCounts[RoomStatus.RESERVED];
  const outOfOrderRooms =
    statusCounts[RoomStatus.OUT_OF_ORDER] + statusCounts[RoomStatus.MAINTENANCE];
  const sellableRooms = totalRooms - outOfOrderRooms;
  const occupancyRate = sellableRooms > 0 ? (occupiedRooms / sellableRooms) * 100 : 0;

  // Revenue metrics from transactions
  const transactions = await prisma.folioTransaction.findMany({
    where: {
      postingDate: {
        gte: startOfDay,
        lte: endOfDay
      },
      transactionType: TransactionType.DEBIT,
      isVoid: false
    }
  });

  let roomRevenue = new Prisma.Decimal(0);
  let serviceRevenue = new Prisma.Decimal(0);
  let surchargeRevenue = new Prisma.Decimal(0);
  let penaltyRevenue = new Prisma.Decimal(0);

  transactions.forEach((tx) => {
    switch (tx.category) {
      case TransactionCategory.ROOM_CHARGE:
        roomRevenue = roomRevenue.add(tx.amount);
        break;
      case TransactionCategory.SERVICE_CHARGE:
        serviceRevenue = serviceRevenue.add(tx.amount);
        break;
      case TransactionCategory.SURCHARGE:
        surchargeRevenue = surchargeRevenue.add(tx.amount);
        break;
      case TransactionCategory.PENALTY:
        penaltyRevenue = penaltyRevenue.add(tx.amount);
        break;
    }
  });

  const totalRevenue = roomRevenue.add(serviceRevenue).add(surchargeRevenue).add(penaltyRevenue);

  // Booking metrics
  const newReservations = await prisma.reservation.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  const cancelledReservations = await prisma.reservation.count({
    where: {
      status: ReservationStatus.CANCELLED,
      updatedAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  const checkIns = await prisma.stayRecord.count({
    where: {
      checkInTime: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  const checkOuts = await prisma.stayDetail.count({
    where: {
      actualCheckOut: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  const noShows = await prisma.reservation.count({
    where: {
      status: ReservationStatus.NO_SHOW,
      updatedAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  // Guest count
  const totalGuests = await prisma.guestInResidence.count({
    where: {
      stayDetail: {
        status: StayDetailStatus.OCCUPIED
      }
    }
  });

  // ADR & RevPAR
  const adr = occupiedRooms > 0 ? roomRevenue.div(occupiedRooms) : new Prisma.Decimal(0);
  const revPAR = sellableRooms > 0 ? roomRevenue.div(sellableRooms) : new Prisma.Decimal(0);

  // Upsert snapshot
  const snapshot = await prisma.dailySnapshot.upsert({
    where: { snapshotDate: date },
    update: {
      totalRooms,
      availableRooms,
      occupiedRooms,
      reservedRooms,
      outOfOrderRooms,
      occupancyRate: new Prisma.Decimal(occupancyRate.toFixed(2)),
      roomRevenue,
      serviceRevenue,
      surchargeRevenue,
      penaltyRevenue,
      totalRevenue,
      newReservations,
      cancelledReservations,
      checkIns,
      checkOuts,
      noShows,
      totalGuests,
      averageDailyRate: adr,
      revPAR
    },
    create: {
      snapshotDate: date,
      totalRooms,
      availableRooms,
      occupiedRooms,
      reservedRooms,
      outOfOrderRooms,
      occupancyRate: new Prisma.Decimal(occupancyRate.toFixed(2)),
      roomRevenue,
      serviceRevenue,
      surchargeRevenue,
      penaltyRevenue,
      totalRevenue,
      newReservations,
      cancelledReservations,
      checkIns,
      checkOuts,
      noShows,
      totalGuests,
      averageDailyRate: adr,
      revPAR
    }
  });

  return snapshot;
};

/**
 * Mark no-show reservations (expected arrival was yesterday but not checked in)
 */
const markNoShowReservations = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  const noShowReservations = await prisma.reservation.updateMany({
    where: {
      status: ReservationStatus.CONFIRMED,
      expectedArrival: {
        gte: yesterday,
        lte: endOfYesterday
      }
    },
    data: {
      status: ReservationStatus.NO_SHOW
    }
  });

  return {
    date: yesterday,
    markedAsNoShow: noShowReservations.count
  };
};

/**
 * Run all nightly jobs
 */
const runNightlyJobs = async (employeeId: number) => {
  const results = {
    roomCharges: await postNightlyRoomCharges(employeeId),
    extraPersonCharges: await postExtraPersonCharges(employeeId),
    noShowMarking: await markNoShowReservations(),
    snapshot: await createDailySnapshot()
  };

  return results;
};

export default {
  postNightlyRoomCharges,
  postExtraPersonCharges,
  createDailySnapshot,
  markNoShowReservations,
  runNightlyJobs
};
