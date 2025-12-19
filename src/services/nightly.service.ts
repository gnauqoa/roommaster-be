import {
  Prisma,
  PrismaClient,
  RoomStatus,
  StayDetailStatus,
  TransactionType,
  TransactionCategory,
  ServiceGroup,
  ReservationStatus,
  DateType
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
   * Post nightly room charges for all occupied rooms
   * Should run at midnight (00:00) every day
   * Uses ReservationDetailDay for rate lookup, falls back to RatePolicyLog or rackRate
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
            reservation: {
              include: {
                reservationDetails: {
                  include: {
                    reservationDetailDays: true
                  }
                }
              }
            }
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
   * Priority: ReservationDetailDay -> RatePolicyLog -> RoomType.rackRate
   */
  private async getDailyRoomRate(
    stayDetail: {
      reservationDetailId?: number | null;
      room: { roomType: { id: number; rackRate: Prisma.Decimal } };
      stayRecord: {
        reservation?: {
          reservationDetails: Array<{
            roomTypeId: number;
            reservationDetailDays: Array<{
              date: Date;
              finalRate: Prisma.Decimal;
            }>;
          }>;
        } | null;
      };
    },
    date: Date
  ): Promise<Prisma.Decimal> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // 1. Try to get rate from ReservationDetailDay (if from reservation)
    if (stayDetail.reservationDetailId) {
      const reservationDetailDay = await this.prisma.reservationDetailDay.findUnique({
        where: {
          reservationDetailId_date: {
            reservationDetailId: stayDetail.reservationDetailId,
            date: normalizedDate
          }
        }
      });

      if (reservationDetailDay) {
        return reservationDetailDay.finalRate;
      }
    }

    // 2. Try matching via reservation's room type
    if (stayDetail.stayRecord.reservation) {
      const matchingDetail = stayDetail.stayRecord.reservation.reservationDetails.find(
        (rd) => rd.roomTypeId === stayDetail.room.roomType.id
      );

      if (matchingDetail) {
        const dayRate = matchingDetail.reservationDetailDays.find((day) => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          return dayDate.getTime() === normalizedDate.getTime();
        });

        if (dayRate) {
          return dayRate.finalRate;
        }
      }
    }

    // 3. Try to get rate from RatePolicyLog (for walk-ins or extended stays)
    const ratePolicyLog = await this.prisma.ratePolicyLog.findUnique({
      where: {
        roomTypeId_date: {
          roomTypeId: stayDetail.room.roomType.id,
          date: normalizedDate
        }
      }
    });

    if (ratePolicyLog) {
      return ratePolicyLog.baseRate.mul(ratePolicyLog.rateFactor);
    }

    // 4. Fallback: create RatePolicyLog entry and use rackRate with dynamic factor
    const roomType = stayDetail.room.roomType;
    const { rateFactor, dateType, ratePolicyId } = await this.findApplicableRatePolicy(
      roomType.id,
      normalizedDate
    );

    // Create RatePolicyLog for future reference
    await this.prisma.ratePolicyLog.create({
      data: {
        roomTypeId: roomType.id,
        date: normalizedDate,
        dateType,
        rateFactor,
        baseRate: roomType.rackRate,
        ratePolicyId
      }
    });

    return roomType.rackRate.mul(rateFactor);
  }

  /**
   * Find applicable rate policy for a specific date and room type
   */
  private async findApplicableRatePolicy(
    roomTypeId: number,
    date: Date
  ): Promise<{ rateFactor: Prisma.Decimal; dateType: DateType; ratePolicyId: number | null }> {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const policy = await this.prisma.ratePolicy.findFirst({
      where: {
        roomTypeId,
        fromDate: { lte: normalizedDate },
        toDate: { gte: normalizedDate }
      },
      orderBy: { priority: 'desc' }
    });

    if (policy) {
      return {
        rateFactor: policy.rateFactor,
        dateType: policy.dateType,
        ratePolicyId: policy.id
      };
    }

    // Default: no policy found, use factor 1.0 and determine dateType from day of week
    const dayOfWeek = normalizedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
      rateFactor: new Prisma.Decimal(1.0),
      dateType: isWeekend ? DateType.WEEKEND : DateType.WEEKDAY,
      ratePolicyId: null
    };
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
