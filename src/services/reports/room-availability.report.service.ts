import { PrismaClient, BookingStatus } from '@prisma/client';
import { Injectable } from '@/core/decorators';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

export interface RoomAvailabilityFilters {
  checkInDate: string;
  checkOutDate: string;
  roomTypeId?: string;
  capacity?: number;
  floor?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface OccupancyForecastFilters {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
}

/**
 * Room Availability Report Service
 * Handles room availability checks and occupancy forecasting
 */
@Injectable()
export class RoomAvailabilityReportService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * API 1.1: Check Room Availability at Specific Time
   * Returns available rooms for a given date range
   */
  async checkRoomAvailability(filters: RoomAvailabilityFilters) {
    const { checkInDate, checkOutDate, roomTypeId, capacity, floor, minPrice, maxPrice } = filters;

    const checkIn = dayjs(checkInDate).startOf('day').toDate();
    const checkOut = dayjs(checkOutDate).startOf('day').toDate();

    // Get all rooms with their types
    const allRooms = await this.prisma.room.findMany({
      where: {
        ...(roomTypeId && { roomTypeId }),
        ...(floor !== undefined && { floor }),
        ...(capacity && {
          roomType: {
            capacity: { gte: capacity }
          }
        })
      },
      include: {
        roomType: true,
        bookingRooms: {
          where: {
            checkInDate: { lt: checkOut },
            checkOutDate: { gt: checkIn },
            status: {
              in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.PENDING]
            }
          }
        }
      }
    });

    // Separate available and occupied rooms
    const availableRooms = [];
    const occupiedRooms = [];
    const reservedRooms = [];

    for (const room of allRooms) {
      const hasConflictingBooking = room.bookingRooms.length > 0;

      if (!hasConflictingBooking) {
        const pricePerNight = Number(room.roomType.basePrice);

        // Apply price filters
        if (minPrice !== undefined && pricePerNight < minPrice) continue;
        if (maxPrice !== undefined && pricePerNight > maxPrice) continue;

        const numberOfNights = dayjs(checkOut).diff(dayjs(checkIn), 'day');
        const totalPrice = pricePerNight * numberOfNights;

        availableRooms.push({
          roomId: room.id,
          roomNumber: room.roomNumber,
          floor: room.floor,
          code: room.code,
          status: room.status,
          roomType: {
            id: room.roomType.id,
            name: room.roomType.name,
            capacity: room.roomType.capacity,
            totalBed: room.roomType.totalBed
          },
          pricePerNight,
          totalPrice,
          numberOfNights
        });
      } else {
        const isCheckedIn = room.bookingRooms.some((br) => br.status === BookingStatus.CHECKED_IN);
        if (isCheckedIn) {
          occupiedRooms.push(room);
        } else {
          reservedRooms.push(room);
        }
      }
    }

    return {
      checkInDate,
      checkOutDate,
      totalAvailable: availableRooms.length,
      totalOccupied: occupiedRooms.length,
      totalReserved: reservedRooms.length,
      totalRooms: allRooms.length,
      availableRooms: availableRooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
    };
  }

  /**
   * API 1.2: Room Occupancy Forecast
   * Returns occupancy forecast for a date range
   */
  async getOccupancyForecast(filters: OccupancyForecastFilters) {
    const { startDate, endDate, groupBy = 'day' } = filters;

    const start = dayjs(startDate).startOf('day');
    const end = dayjs(endDate).startOf('day');

    // Get total room count
    const totalRooms = await this.prisma.room.count();

    // Get all booking rooms in the date range
    const bookingRooms = await this.prisma.bookingRoom.findMany({
      where: {
        checkInDate: { lt: end.toDate() },
        checkOutDate: { gt: start.toDate() },
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.PENDING]
        }
      },
      select: {
        checkInDate: true,
        checkOutDate: true,
        status: true
      }
    });

    const forecast = [];
    let current = start;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
      // Count occupied rooms for this day
      const occupiedCount = bookingRooms.filter((br) => {
        const checkIn = dayjs(br.checkInDate);
        const checkOut = dayjs(br.checkOutDate);
        return current.isBetween(checkIn, checkOut, 'day', '[)');
      }).length;

      const availableCount = totalRooms - occupiedCount;
      const occupancyRate = totalRooms > 0 ? (occupiedCount / totalRooms) * 100 : 0;

      forecast.push({
        date: current.format('YYYY-MM-DD'),
        totalRooms,
        occupiedRooms: occupiedCount,
        availableRooms: availableCount,
        occupancyRate: Math.round(occupancyRate * 100) / 100
      });

      // Move to next period based on groupBy
      if (groupBy === 'week') {
        current = current.add(7, 'day');
      } else if (groupBy === 'month') {
        current = current.add(1, 'month');
      } else {
        current = current.add(1, 'day');
      }
    }

    // Calculate averages
    const avgOccupancyRate =
      forecast.reduce((sum, f) => sum + f.occupancyRate, 0) / forecast.length;
    const avgOccupiedRooms =
      forecast.reduce((sum, f) => sum + f.occupiedRooms, 0) / forecast.length;

    return {
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
      groupBy,
      totalRooms,
      averageOccupancyRate: Math.round(avgOccupancyRate * 100) / 100,
      averageOccupiedRooms: Math.round(avgOccupiedRooms * 100) / 100,
      forecast
    };
  }
}
