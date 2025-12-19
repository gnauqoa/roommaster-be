import {
  Prisma,
  PrismaClient,
  RoomStatus,
  StayDetailStatus,
  TransactionType,
  TransactionCategory,
  ServiceGroup,
  ReservationStatus,
  RatePolicyLoop
} from '@prisma/client';
import { Injectable } from 'core/decorators';

/**
 * Generate unique transaction code
 */

@Injectable()
export class NightlyService {
  constructor(private readonly prisma: PrismaClient) {}

  async generateTransactionCode(): Promise<string> {
    const today = new Date();
    const datePrefix = `TX${today.getFullYear()}${String(today.getMonth() + 1).padStart(
      2,
      '0'
    )}${String(today.getDate()).padStart(2, '0')}`;

    const lastTx = await this.prisma.folioTransaction.findFirst({
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
  }

  /**
   * Check if a date matches a rate policy based on loop type
   */
  private isDateMatchingPolicy(
    date: Date,
    policy: { fromDate: Date; toDate: Date; loop: RatePolicyLoop }
  ): boolean {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const fromDate = new Date(policy.fromDate);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(policy.toDate);
    toDate.setHours(0, 0, 0, 0);

    switch (policy.loop) {
      case RatePolicyLoop.NONE:
        return normalizedDate >= fromDate && normalizedDate <= toDate;

      case RatePolicyLoop.WEEKLY: {
        const dayOfWeek = normalizedDate.getDay();
        const fromDayOfWeek = fromDate.getDay();
        const toDayOfWeek = toDate.getDay();
        if (fromDayOfWeek === toDayOfWeek) {
          return dayOfWeek === fromDayOfWeek;
        }
        if (fromDayOfWeek <= toDayOfWeek) {
          return dayOfWeek >= fromDayOfWeek && dayOfWeek <= toDayOfWeek;
        } else {
          return dayOfWeek >= fromDayOfWeek || dayOfWeek <= toDayOfWeek;
        }
      }

      case RatePolicyLoop.MONTHLY: {
        const dayOfMonth = normalizedDate.getDate();
        const fromDay = fromDate.getDate();
        const toDay = toDate.getDate();
        if (fromDay <= toDay) {
          return dayOfMonth >= fromDay && dayOfMonth <= toDay;
        } else {
          return dayOfMonth >= fromDay || dayOfMonth <= toDay;
        }
      }

      case RatePolicyLoop.YEARLY: {
        const month = normalizedDate.getMonth();
        const day = normalizedDate.getDate();
        const fromMonth = fromDate.getMonth();
        const fromDay = fromDate.getDate();
        const toMonth = toDate.getMonth();
        const toDay = toDate.getDate();

        const dateValue = month * 100 + day;
        const fromValue = fromMonth * 100 + fromDay;
        const toValue = toMonth * 100 + toDay;

        if (fromValue <= toValue) {
          return dateValue >= fromValue && dateValue <= toValue;
        } else {
          return dateValue >= fromValue || dateValue <= toValue;
        }
      }

      default:
        return false;
    }
  }

  /**
   * Find applicable rate policy for a specific date and room type
   */
  private async findApplicableRatePolicy(
    roomTypeId: number,
    date: Date
  ): Promise<{ price: Prisma.Decimal | null; ratePolicyId: number | null }> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const policies = await this.prisma.ratePolicy.findMany({
      where: { roomTypeId },
      orderBy: { priority: 'desc' }
    });

    for (const policy of policies) {
      if (this.isDateMatchingPolicy(normalizedDate, policy)) {
        return {
          price: policy.price,
          ratePolicyId: policy.id
        };
      }
    }

    return {
      price: null,
      ratePolicyId: null
    };
  }

  /**
   * Find the nearest RatePolicyLog in the past for a given date and room type
   */
  private async findNearestRatePolicyLog(
    roomTypeId: number,
    referenceDate: Date
  ): Promise<{ price: Prisma.Decimal } | null> {
    const normalizedDate = new Date(referenceDate);
    normalizedDate.setHours(0, 0, 0, 0);

    const ratePolicyLog = await this.prisma.ratePolicyLog.findFirst({
      where: {
        roomTypeId,
        date: { lte: normalizedDate }
      },
      orderBy: { date: 'desc' }
    });

    return ratePolicyLog;
  }

  /**
   * Post nightly room charges for all occupied rooms
   * Should run at midnight (00:00) every day
   *
   * Night audit flow:
   * - For reservations: find RatePolicyLog nearest to reservation date
   * - For walk-ins: find RatePolicyLog nearest to check-in time
   * - For extended stays: find RatePolicyLog nearest to check-in time
   * - Fallback: use rackRate if no RatePolicyLog found
   */
  async postNightlyRoomCharges(employeeId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all occupied stay details with their folios
    const occupiedStayDetails = await this.prisma.stayDetail.findMany({
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
            reservation: true
          }
        }
      }
    });

    const results: Array<{ stayDetailId: number; success: boolean; error?: string }> = [];

    for (const stayDetail of occupiedStayDetails) {
      try {
        // Get the MASTER folio for this stayRecord (room charges go to master folio)
        const folio = await this.prisma.guestFolio.findFirst({
          where: {
            stayRecordId: stayDetail.stayRecordId,
            status: 'OPEN'
          }
        });

        if (!folio) {
          results.push({
            stayDetailId: stayDetail.id,
            success: false,
            error: 'No open master folio found'
          });
          continue;
        }

        // Check if room charge already posted for today
        const existingCharge = await this.prisma.folioTransaction.findFirst({
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

        // Calculate room rate using new daily rate logic
        const roomRate = await this.getDailyRoomRate(stayDetail, today);

        // Create room charge transaction
        const txCode = await this.generateTransactionCode();
        await this.prisma.folioTransaction.create({
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
        await this.prisma.guestFolio.update({
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
  }

  /**
   * Get daily room rate for a stay detail
   *
   * Night audit logic:
   * - For reservations: find RatePolicyLog nearest in the past to reservation date
   * - For walk-ins (no reservation) or extended stays: find RatePolicyLog nearest to check-in time
   * - Fallback: use rackRate
   */
  private async getDailyRoomRate(
    stayDetail: {
      room: { roomType: { id: number; rackRate: Prisma.Decimal } };
      expectedCheckOut: Date;
      stayRecord: {
        checkInTime: Date;
        reservation?: {
          reservationDate: Date;
        } | null;
      };
    },
    date: Date
  ): Promise<Prisma.Decimal> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const roomTypeId = stayDetail.room.roomType.id;
    const rackRate = stayDetail.room.roomType.rackRate;

    // Check if this is an extended stay (expectedCheckOut is in the past)
    const expectedCheckOut = new Date(stayDetail.expectedCheckOut);
    expectedCheckOut.setHours(0, 0, 0, 0);
    const isExtendedStay = expectedCheckOut < normalizedDate;

    // Determine the reference date for RatePolicyLog lookup
    let referenceDate: Date;

    if (stayDetail.stayRecord.reservation && !isExtendedStay) {
      // For reservations: use reservation date
      referenceDate = new Date(stayDetail.stayRecord.reservation.reservationDate);
    } else {
      // For walk-ins or extended stays: use check-in time
      referenceDate = new Date(stayDetail.stayRecord.checkInTime);
    }
    referenceDate.setHours(0, 0, 0, 0);

    // Find the nearest RatePolicyLog in the past
    const ratePolicyLog = await this.findNearestRatePolicyLog(roomTypeId, referenceDate);

    if (ratePolicyLog) {
      return ratePolicyLog.price;
    }

    // Fallback: use rackRate
    return rackRate;
  }

  /**
   * Post extra person charges for rooms with guests exceeding base capacity
   */
  async postExtraPersonCharges(employeeId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all occupied stay details with extra guests
    const stayDetailsWithExtraGuests = await this.prisma.stayDetail.findMany({
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
        stayRecord: true
      }
    });

    const results: Array<{ stayDetailId: number; success: boolean; error?: string }> = [];

    // Get extra person service
    const extraPersonService = await this.prisma.service.findFirst({
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

        // Get the MASTER folio for this stayRecord (surcharges go to master folio)
        const folio = await this.prisma.guestFolio.findFirst({
          where: {
            stayRecordId: stayDetail.stayRecordId,
            status: 'OPEN'
          }
        });

        if (!folio) {
          results.push({
            stayDetailId: stayDetail.id,
            success: false,
            error: 'No open master folio found'
          });
          continue;
        }

        // Check if extra person charge already posted for today
        const existingCharge = await this.prisma.folioTransaction.findFirst({
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

        const txCode = await this.generateTransactionCode();
        await this.prisma.folioTransaction.create({
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
        await this.prisma.guestFolio.update({
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
  }

  /**
   * Create daily snapshot for reporting
   */
  async createDailySnapshot(snapshotDate?: Date) {
    const date = snapshotDate || new Date();
    date.setHours(0, 0, 0, 0);

    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Room metrics
    const totalRooms = await this.prisma.room.count();
    const roomsByStatus = await this.prisma.room.groupBy({
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
    const transactions = await this.prisma.folioTransaction.findMany({
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
    const newReservations = await this.prisma.reservation.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const cancelledReservations = await this.prisma.reservation.count({
      where: {
        status: ReservationStatus.CANCELLED,
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const checkIns = await this.prisma.stayRecord.count({
      where: {
        checkInTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const checkOuts = await this.prisma.stayDetail.count({
      where: {
        actualCheckOut: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    const noShows = await this.prisma.reservation.count({
      where: {
        status: ReservationStatus.NO_SHOW,
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Guest count
    const totalGuests = await this.prisma.guestInResidence.count({
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
    const snapshot = await this.prisma.dailySnapshot.upsert({
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
  }

  /**
   * Mark no-show reservations (expected arrival was yesterday but not checked in)
   */
  async markNoShowReservations() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const noShowReservations = await this.prisma.reservation.updateMany({
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
  }

  /**
   * Run all nightly jobs
   */
  async runNightlyJobs(employeeId: number) {
    const results = {
      roomCharges: await this.postNightlyRoomCharges(employeeId),
      extraPersonCharges: await this.postExtraPersonCharges(employeeId),
      noShowMarking: await this.markNoShowReservations(),
      snapshot: await this.createDailySnapshot()
    };

    return results;
  }
}

export default NightlyService;
