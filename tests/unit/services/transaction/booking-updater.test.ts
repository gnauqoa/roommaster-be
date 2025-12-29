/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { Prisma, TransactionType } from '@prisma/client';
import { updateBookingTotals, getDefaultDescription } from '@/services/transaction/helpers/booking-updater';
import ApiError from '@/utils/ApiError';

describe('Booking Updater', () => {
  describe('updateBookingTotals', () => {
    it('should calculate and update booking totals correctly', async () => {
      const mockTx = {
        bookingRoom: {
          findMany: (jest.fn() as any).mockResolvedValue([
            { id: 'room-1', totalPaid: new Prisma.Decimal(500) },
            { id: 'room-2', totalPaid: new Prisma.Decimal(700) }
          ])
        },
        booking: {
          findUnique: (jest.fn() as any).mockResolvedValue({
            id: 'booking-1',
            totalAmount: new Prisma.Decimal(2000)
          }),
          update: jest.fn()
        }
      };

      await updateBookingTotals('booking-1', mockTx);

      expect(mockTx.bookingRoom.findMany).toHaveBeenCalledWith({
        where: { bookingId: 'booking-1' }
      });

      expect(mockTx.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: {
          totalPaid: new Prisma.Decimal(1200), // 500 + 700
          balance: new Prisma.Decimal(800) // 2000 - 1200
        }
      });
    });

    it('should handle zero paid amount', async () => {
      const mockTx = {
        bookingRoom: {
          findMany: (jest.fn() as any).mockResolvedValue([
            { id: 'room-1', totalPaid: new Prisma.Decimal(0) },
            { id: 'room-2', totalPaid: new Prisma.Decimal(0) }
          ])
        },
        booking: {
          findUnique: (jest.fn() as any).mockResolvedValue({
            id: 'booking-1',
            totalAmount: new Prisma.Decimal(1000)
          }),
          update: jest.fn()
        }
      };

      await updateBookingTotals('booking-1', mockTx);

      expect(mockTx.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: {
          totalPaid: new Prisma.Decimal(0),
          balance: new Prisma.Decimal(1000)
        }
      });
    });

    it('should handle fully paid booking', async () => {
      const mockTx = {
        bookingRoom: {
          findMany: (jest.fn() as any).mockResolvedValue([
            { id: 'room-1', totalPaid: new Prisma.Decimal(1000) }
          ])
        },
        booking: {
          findUnique: (jest.fn() as any).mockResolvedValue({
            id: 'booking-1',
            totalAmount: new Prisma.Decimal(1000)
          }),
          update: jest.fn()
        }
      };

      await updateBookingTotals('booking-1', mockTx);

      expect(mockTx.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: {
          totalPaid: new Prisma.Decimal(1000),
          balance: new Prisma.Decimal(0)
        }
      });
    });

    it('should handle overpaid booking (negative balance)', async () => {
      const mockTx = {
        bookingRoom: {
          findMany: (jest.fn() as any).mockResolvedValue([
            { id: 'room-1', totalPaid: new Prisma.Decimal(1200) }
          ])
        },
        booking: {
          findUnique: (jest.fn() as any).mockResolvedValue({
            id: 'booking-1',
            totalAmount: new Prisma.Decimal(1000)
          }),
          update: jest.fn()
        }
      };

      await updateBookingTotals('booking-1', mockTx);

      expect(mockTx.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: {
          totalPaid: new Prisma.Decimal(1200),
          balance: new Prisma.Decimal(-200) // Negative balance (credit)
        }
      });
    });

    it('should throw error if booking not found', async () => {
      const mockTx = {
        bookingRoom: {
          findMany: (jest.fn() as any).mockResolvedValue([])
        },
        booking: {
          findUnique: (jest.fn() as any).mockResolvedValue(null)
        }
      };

      await expect(updateBookingTotals('non-existent', mockTx)).rejects.toThrow(ApiError);
      await expect(updateBookingTotals('non-existent', mockTx)).rejects.toThrow(
        'Booking not found'
      );
    });

    it('should handle single booking room', async () => {
      const mockTx = {
        bookingRoom: {
          findMany: (jest.fn() as any).mockResolvedValue([
            { id: 'room-1', totalPaid: new Prisma.Decimal(300) }
          ])
        },
        booking: {
          findUnique: (jest.fn() as any).mockResolvedValue({
            id: 'booking-1',
            totalAmount: new Prisma.Decimal(500)
          }),
          update: jest.fn()
        }
      };

      await updateBookingTotals('booking-1', mockTx);

      expect(mockTx.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: {
          totalPaid: new Prisma.Decimal(300),
          balance: new Prisma.Decimal(200)
        }
      });
    });
  });

  describe('getDefaultDescription', () => {
    it('should return description for DEPOSIT transaction', () => {
      const result = getDefaultDescription(TransactionType.DEPOSIT, 'BK001');
      expect(result).toBe('Deposit for booking BK001');
    });

    it('should return description for ROOM_CHARGE transaction', () => {
      const result = getDefaultDescription(TransactionType.ROOM_CHARGE, 'BK002');
      expect(result).toBe('Room charge for booking BK002');
    });

    it('should return description for SERVICE_CHARGE transaction', () => {
      const result = getDefaultDescription(TransactionType.SERVICE_CHARGE, 'BK003');
      expect(result).toBe('Service charge for booking BK003');
    });

    it('should return description for REFUND transaction', () => {
      const result = getDefaultDescription(TransactionType.REFUND, 'BK004');
      expect(result).toBe('Refund for booking BK004');
    });

    it('should return description for ADJUSTMENT transaction', () => {
      const result = getDefaultDescription(TransactionType.ADJUSTMENT, 'BK005');
      expect(result).toBe('Adjustment for booking BK005');
    });

    it('should return generic description for unknown transaction type', () => {
      const result = getDefaultDescription('UNKNOWN' as TransactionType, 'BK006');
      expect(result).toBe('Transaction for booking BK006');
    });

    it('should handle empty booking code', () => {
      const result = getDefaultDescription(TransactionType.DEPOSIT, '');
      expect(result).toBe('Deposit for booking ');
    });

    it('should handle special characters in booking code', () => {
      const result = getDefaultDescription(TransactionType.DEPOSIT, 'BK-001/TEST');
      expect(result).toBe('Deposit for booking BK-001/TEST');
    });
  });
});
