/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-var-requires */
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { TransactionService } from '../../../src/services/transaction/transaction.service';
import { createMockPrismaClient } from '../../utils/testContainer';
import { PrismaClient, PaymentMethod, TransactionType } from '@prisma/client';
import ApiError from '../../../src/utils/ApiError';

// Mock the handler modules
jest.mock('../../../src/services/transaction/handlers/full-booking-payment');
jest.mock('../../../src/services/transaction/handlers/split-room-payment');
jest.mock('../../../src/services/transaction/handlers/booking-service-payment');
jest.mock('../../../src/services/transaction/handlers/guest-service-payment');

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let mockPrisma: jest.Mocked<Partial<PrismaClient>>;
  let mockActivityService: any;
  let mockUsageServiceService: any;
  let mockPromotionService: any;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    mockActivityService = {
      createActivity: jest.fn()
    };
    mockUsageServiceService = {};
    mockPromotionService = {};

    transactionService = new TransactionService(
      mockPrisma as PrismaClient,
      mockActivityService,
      mockUsageServiceService,
      mockPromotionService
    );
    jest.clearAllMocks();
  });

  describe('createTransaction - Routing Logic', () => {
    const basePayload = {
      paymentMethod: PaymentMethod.CASH,
      transactionType: TransactionType.DEPOSIT,
      employeeId: 'employee-123'
    };

    it('should route to guest service payment when serviceUsageId provided without bookingId', async () => {
      const payload = {
        ...basePayload,
        serviceUsageId: 'service-123'
      };

      const {
        processGuestServicePayment
      } = require('../../../src/services/transaction/handlers/guest-service-payment');
      processGuestServicePayment.mockResolvedValue({ success: true });

      await transactionService.createTransaction(payload);

      expect(processGuestServicePayment).toHaveBeenCalledWith(
        payload,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService
      );
    });

    it('should route to booking service payment when both bookingId and serviceUsageId provided', async () => {
      const payload = {
        ...basePayload,
        bookingId: 'booking-123',
        serviceUsageId: 'service-123'
      };

      const {
        processBookingServicePayment
      } = require('../../../src/services/transaction/handlers/booking-service-payment');
      processBookingServicePayment.mockResolvedValue({ success: true });

      await transactionService.createTransaction(payload);

      expect(processBookingServicePayment).toHaveBeenCalledWith(
        payload,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      );
    });

    it('should route to split room payment when bookingId and bookingRoomIds provided', async () => {
      const payload = {
        ...basePayload,
        bookingId: 'booking-123',
        bookingRoomIds: ['room-1', 'room-2']
      };

      const {
        processSplitRoomPayment
      } = require('../../../src/services/transaction/handlers/split-room-payment');
      processSplitRoomPayment.mockResolvedValue({ success: true });

      await transactionService.createTransaction(payload);

      expect(processSplitRoomPayment).toHaveBeenCalledWith(
        payload,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      );
    });

    it('should route to full booking payment when only bookingId provided', async () => {
      const payload = {
        ...basePayload,
        bookingId: 'booking-123'
      };

      const {
        processFullBookingPayment
      } = require('../../../src/services/transaction/handlers/full-booking-payment');
      processFullBookingPayment.mockResolvedValue({ success: true });

      await transactionService.createTransaction(payload);

      expect(processFullBookingPayment).toHaveBeenCalledWith(
        payload,
        mockPrisma,
        mockActivityService,
        mockUsageServiceService,
        mockPromotionService
      );
    });

    it('should throw error for invalid payment scenario', async () => {
      const payload = {
        ...basePayload
        // No bookingId, no serviceUsageId
      };

      await expect(transactionService.createTransaction(payload)).rejects.toThrow(ApiError);
      await expect(transactionService.createTransaction(payload)).rejects.toThrow(
        'Invalid payment scenario'
      );
    });
  });
});
