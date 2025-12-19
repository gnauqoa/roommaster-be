import {
  Prisma,
  PrismaClient,
  TransactionType,
  TransactionCategory,
  RoomStatus
} from '@prisma/client';
import { Injectable } from 'core/decorators';

// Type for DailySnapshot until Prisma client is regenerated with the model
interface DailySnapshot {
  id: number;
  snapshotDate: Date;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  reservedRooms: number;
  outOfOrderRooms: number;
  occupancyRate: Prisma.Decimal;
  roomRevenue: Prisma.Decimal;
  serviceRevenue: Prisma.Decimal;
  surchargeRevenue: Prisma.Decimal;
  penaltyRevenue: Prisma.Decimal;
  totalRevenue: Prisma.Decimal;
  newReservations: number;
  cancelledReservations: number;
  checkIns: number;
  checkOuts: number;
  noShows: number;
  totalGuests: number;
  averageDailyRate: Prisma.Decimal;
  revPAR: Prisma.Decimal;
  createdAt: Date;
}

/**
 * Get daily snapshot for a specific date
 */

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaClient) {}

  async getDailySnapshot(date: Date): Promise<DailySnapshot | null> {
    const snapshotDate = new Date(date);
    snapshotDate.setHours(0, 0, 0, 0);

    const snapshot = await (this.prisma as any).dailySnapshot.findUnique({
      where: { snapshotDate }
    });

    return snapshot;
  }

  /**
   * Get daily snapshots for a date range
   */
  async getSnapshotsInRange(fromDate: Date, toDate: Date): Promise<DailySnapshot[]> {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);

    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    const snapshots = await (this.prisma as any).dailySnapshot.findMany({
      where: {
        snapshotDate: {
          gte: from,
          lte: to
        }
      },
      orderBy: { snapshotDate: 'asc' }
    });

    return snapshots;
  }

  /**
   * Get occupancy report for a date range
   */
  async getOccupancyReport(fromDate: Date, toDate: Date) {
    const snapshots = await this.getSnapshotsInRange(fromDate, toDate);

    if (snapshots.length === 0) {
      return {
        period: { from: fromDate, to: toDate },
        days: 0,
        averageOccupancy: 0,
        averageADR: new Prisma.Decimal(0),
        averageRevPAR: new Prisma.Decimal(0),
        totalRoomNights: 0,
        data: []
      };
    }

    const totalOccupancy = snapshots.reduce(
      (sum: number, s: DailySnapshot) => sum + Number(s.occupancyRate),
      0
    );
    const totalADR = snapshots.reduce(
      (sum: Prisma.Decimal, s: DailySnapshot) => sum.add(s.averageDailyRate),
      new Prisma.Decimal(0)
    );
    const totalRevPAR = snapshots.reduce(
      (sum: Prisma.Decimal, s: DailySnapshot) => sum.add(s.revPAR),
      new Prisma.Decimal(0)
    );
    const totalRoomNights = snapshots.reduce(
      (sum: number, s: DailySnapshot) => sum + s.occupiedRooms,
      0
    );

    return {
      period: { from: fromDate, to: toDate },
      days: snapshots.length,
      averageOccupancy: totalOccupancy / snapshots.length,
      averageADR: totalADR.div(snapshots.length),
      averageRevPAR: totalRevPAR.div(snapshots.length),
      totalRoomNights,
      data: snapshots.map((s: DailySnapshot) => ({
        date: s.snapshotDate,
        occupancyRate: s.occupancyRate,
        occupiedRooms: s.occupiedRooms,
        totalRooms: s.totalRooms,
        adr: s.averageDailyRate,
        revPAR: s.revPAR
      }))
    };
  }

  /**
   * Get revenue report for a date range
   */
  async getRevenueReport(fromDate: Date, toDate: Date) {
    const snapshots = await this.getSnapshotsInRange(fromDate, toDate);

    if (snapshots.length === 0) {
      return {
        period: { from: fromDate, to: toDate },
        days: 0,
        totalRevenue: new Prisma.Decimal(0),
        roomRevenue: new Prisma.Decimal(0),
        serviceRevenue: new Prisma.Decimal(0),
        surchargeRevenue: new Prisma.Decimal(0),
        penaltyRevenue: new Prisma.Decimal(0),
        dailyData: []
      };
    }

    const totals = {
      roomRevenue: new Prisma.Decimal(0),
      serviceRevenue: new Prisma.Decimal(0),
      surchargeRevenue: new Prisma.Decimal(0),
      penaltyRevenue: new Prisma.Decimal(0),
      totalRevenue: new Prisma.Decimal(0)
    };

    snapshots.forEach((s: DailySnapshot) => {
      totals.roomRevenue = totals.roomRevenue.add(s.roomRevenue);
      totals.serviceRevenue = totals.serviceRevenue.add(s.serviceRevenue);
      totals.surchargeRevenue = totals.surchargeRevenue.add(s.surchargeRevenue);
      totals.penaltyRevenue = totals.penaltyRevenue.add(s.penaltyRevenue);
      totals.totalRevenue = totals.totalRevenue.add(s.totalRevenue);
    });

    return {
      period: { from: fromDate, to: toDate },
      days: snapshots.length,
      ...totals,
      breakdown: {
        roomPercentage: totals.totalRevenue.gt(0)
          ? Number(totals.roomRevenue.div(totals.totalRevenue).mul(100).toFixed(2))
          : 0,
        servicePercentage: totals.totalRevenue.gt(0)
          ? Number(totals.serviceRevenue.div(totals.totalRevenue).mul(100).toFixed(2))
          : 0,
        surchargePercentage: totals.totalRevenue.gt(0)
          ? Number(totals.surchargeRevenue.div(totals.totalRevenue).mul(100).toFixed(2))
          : 0,
        penaltyPercentage: totals.totalRevenue.gt(0)
          ? Number(totals.penaltyRevenue.div(totals.totalRevenue).mul(100).toFixed(2))
          : 0
      },
      dailyData: snapshots.map((s: DailySnapshot) => ({
        date: s.snapshotDate,
        roomRevenue: s.roomRevenue,
        serviceRevenue: s.serviceRevenue,
        surchargeRevenue: s.surchargeRevenue,
        penaltyRevenue: s.penaltyRevenue,
        totalRevenue: s.totalRevenue
      }))
    };
  }

  /**
   * Get booking statistics report for a date range
   */
  async getBookingReport(fromDate: Date, toDate: Date) {
    const snapshots = await this.getSnapshotsInRange(fromDate, toDate);

    if (snapshots.length === 0) {
      return {
        period: { from: fromDate, to: toDate },
        days: 0,
        totalReservations: 0,
        totalCancellations: 0,
        totalCheckIns: 0,
        totalCheckOuts: 0,
        totalNoShows: 0,
        cancellationRate: 0,
        noShowRate: 0,
        dailyData: []
      };
    }

    const totals = {
      newReservations: 0,
      cancelledReservations: 0,
      checkIns: 0,
      checkOuts: 0,
      noShows: 0
    };

    snapshots.forEach((s: DailySnapshot) => {
      totals.newReservations += s.newReservations;
      totals.cancelledReservations += s.cancelledReservations;
      totals.checkIns += s.checkIns;
      totals.checkOuts += s.checkOuts;
      totals.noShows += s.noShows;
    });

    const cancellationRate =
      totals.newReservations > 0
        ? (totals.cancelledReservations / totals.newReservations) * 100
        : 0;

    const noShowRate =
      totals.newReservations > 0 ? (totals.noShows / totals.newReservations) * 100 : 0;

    return {
      period: { from: fromDate, to: toDate },
      days: snapshots.length,
      totalReservations: totals.newReservations,
      totalCancellations: totals.cancelledReservations,
      totalCheckIns: totals.checkIns,
      totalCheckOuts: totals.checkOuts,
      totalNoShows: totals.noShows,
      cancellationRate,
      noShowRate,
      dailyData: snapshots.map((s: DailySnapshot) => ({
        date: s.snapshotDate,
        reservations: s.newReservations,
        cancellations: s.cancelledReservations,
        checkIns: s.checkIns,
        checkOuts: s.checkOuts,
        noShows: s.noShows
      }))
    };
  }

  /**
   * Get real-time dashboard data (current state)
   */
  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Room status counts
    const roomsByStatus = await this.prisma.room.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const roomStatus: Record<string, number> = {};
    roomsByStatus.forEach((r) => {
      roomStatus[r.status] = r._count.id;
    });

    const totalRooms = Object.values(roomStatus).reduce((sum, count) => sum + count, 0);
    const occupiedRooms = roomStatus[RoomStatus.OCCUPIED] || 0;
    const availableRooms = roomStatus[RoomStatus.AVAILABLE] || 0;
    const outOfOrder =
      (roomStatus[RoomStatus.OUT_OF_ORDER] || 0) + (roomStatus[RoomStatus.MAINTENANCE] || 0);
    const sellableRooms = totalRooms - outOfOrder;
    const occupancyRate = sellableRooms > 0 ? (occupiedRooms / sellableRooms) * 100 : 0;

    // Today's arrivals and departures
    const todayArrivals = await this.prisma.reservation.count({
      where: {
        expectedArrival: today,
        status: { in: ['CONFIRMED', 'PENDING'] }
      }
    });

    const todayDepartures = await this.prisma.stayDetail.count({
      where: {
        expectedCheckOut: today,
        status: 'OCCUPIED'
      }
    });

    // Today's revenue
    const todayTransactions = await this.prisma.folioTransaction.aggregate({
      where: {
        postingDate: {
          gte: today,
          lte: endOfToday
        },
        transactionType: TransactionType.DEBIT,
        isVoid: false
      },
      _sum: { amount: true }
    });

    // Today's payments
    const todayPayments = await this.prisma.folioTransaction.aggregate({
      where: {
        postingDate: {
          gte: today,
          lte: endOfToday
        },
        category: TransactionCategory.PAYMENT,
        isVoid: false
      },
      _sum: { amount: true }
    });

    // Current guests
    const currentGuests = await this.prisma.guestInResidence.count({
      where: {
        stayDetail: {
          status: 'OCCUPIED'
        }
      }
    });

    // Pending housekeeping
    const pendingHousekeeping = await this.prisma.housekeepingLog.count({
      where: {
        status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
      }
    });

    // Get yesterday's snapshot for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySnapshot: DailySnapshot | null = await (
      this.prisma as any
    ).dailySnapshot.findUnique({
      where: { snapshotDate: yesterday }
    });

    return {
      date: today,
      rooms: {
        total: totalRooms,
        available: availableRooms,
        occupied: occupiedRooms,
        reserved: roomStatus[RoomStatus.RESERVED] || 0,
        cleaning: roomStatus[RoomStatus.CLEANING] || 0,
        outOfOrder,
        occupancyRate
      },
      todayActivity: {
        arrivals: todayArrivals,
        departures: todayDepartures,
        currentGuests,
        pendingHousekeeping
      },
      finance: {
        todayRevenue: todayTransactions._sum.amount || new Prisma.Decimal(0),
        todayPayments: todayPayments._sum.amount || new Prisma.Decimal(0)
      },
      comparison: yesterdaySnapshot
        ? {
            occupancyChange: occupancyRate - Number(yesterdaySnapshot.occupancyRate),
            revenueChange:
              Number(todayTransactions._sum.amount || 0) - Number(yesterdaySnapshot.totalRevenue)
          }
        : null
    };
  }

  /**
   * Get revenue by room type report
   */
  async getRevenueByRoomType(fromDate: Date, toDate: Date) {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);

    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    const transactions = await this.prisma.folioTransaction.findMany({
      where: {
        postingDate: {
          gte: from,
          lte: to
        },
        category: TransactionCategory.ROOM_CHARGE,
        transactionType: TransactionType.DEBIT,
        isVoid: false,
        stayDetailId: { not: null }
      },
      include: {
        stayDetail: {
          include: {
            room: {
              include: { roomType: true }
            }
          }
        }
      }
    });

    // Group by room type
    const byRoomType: Record<
      string,
      { roomTypeId: number; name: string; revenue: Prisma.Decimal; roomNights: number }
    > = {};

    transactions.forEach((tx) => {
      if (tx.stayDetail?.room.roomType) {
        const rt = tx.stayDetail.room.roomType;
        if (!byRoomType[rt.code]) {
          byRoomType[rt.code] = {
            roomTypeId: rt.id,
            name: rt.name,
            revenue: new Prisma.Decimal(0),
            roomNights: 0
          };
        }
        byRoomType[rt.code].revenue = byRoomType[rt.code].revenue.add(tx.amount);
        byRoomType[rt.code].roomNights += tx.quantity;
      }
    });

    const data = Object.values(byRoomType);
    const totalRevenue = data.reduce((sum, d) => sum.add(d.revenue), new Prisma.Decimal(0));

    return {
      period: { from: fromDate, to: toDate },
      totalRevenue,
      byRoomType: data.map((d) => ({
        ...d,
        percentage: totalRevenue.gt(0) ? Number(d.revenue.div(totalRevenue).mul(100).toFixed(2)) : 0
      }))
    };
  }
}

export default ReportService;
