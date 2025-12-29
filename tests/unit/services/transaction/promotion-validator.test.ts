/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { validatePromotions } from '../../../../src/services/transaction/validators/promotion-validator';
import ApiError from '../../../../src/utils/ApiError';

const createMockPromotionService = () => ({
  validatePromotionApplicability: jest.fn() as any
});

describe('promotion-validator', () => {
  let mockPromotionService: ReturnType<typeof createMockPromotionService>;

  beforeEach(() => {
    mockPromotionService = createMockPromotionService();
    jest.clearAllMocks();
  });

  describe('validatePromotions', () => {
    it('should validate room-level promotion', async () => {
      const promotionApplications = [{ customerPromotionId: 'cp-1', bookingRoomId: 'room-1' }];

      mockPromotionService.validatePromotionApplicability = (jest.fn() as any).mockResolvedValue({
        valid: true
      });

      await validatePromotions(promotionApplications, mockPromotionService as any);

      expect(mockPromotionService.validatePromotionApplicability).toHaveBeenCalledWith({
        customerPromotionId: 'cp-1',
        targetType: 'room',
        bookingRoomId: 'room-1',
        serviceUsageId: undefined
      });
    });

    it('should validate service-level promotion', async () => {
      const promotionApplications = [{ customerPromotionId: 'cp-1', serviceUsageId: 'service-1' }];

      mockPromotionService.validatePromotionApplicability = (jest.fn() as any).mockResolvedValue({
        valid: true
      });

      await validatePromotions(promotionApplications, mockPromotionService as any);

      expect(mockPromotionService.validatePromotionApplicability).toHaveBeenCalledWith({
        customerPromotionId: 'cp-1',
        targetType: 'service',
        bookingRoomId: undefined,
        serviceUsageId: 'service-1'
      });
    });

    it('should validate transaction-level promotion', async () => {
      const promotionApplications = [{ customerPromotionId: 'cp-1' }];

      mockPromotionService.validatePromotionApplicability = (jest.fn() as any).mockResolvedValue({
        valid: true
      });

      await validatePromotions(promotionApplications, mockPromotionService as any);

      expect(mockPromotionService.validatePromotionApplicability).toHaveBeenCalledWith({
        customerPromotionId: 'cp-1',
        targetType: 'transaction',
        bookingRoomId: undefined,
        serviceUsageId: undefined
      });
    });

    it('should throw error if promotion is invalid', async () => {
      const promotionApplications = [{ customerPromotionId: 'cp-1', bookingRoomId: 'room-1' }];

      mockPromotionService.validatePromotionApplicability = (jest.fn() as any).mockResolvedValue({
        valid: false,
        reason: 'Promotion has expired'
      });

      await expect(
        validatePromotions(promotionApplications, mockPromotionService as any)
      ).rejects.toThrow(ApiError);

      await expect(
        validatePromotions(promotionApplications, mockPromotionService as any)
      ).rejects.toThrow('Promotion has expired');
    });

    it('should throw generic error if no reason provided', async () => {
      const promotionApplications = [{ customerPromotionId: 'cp-1', bookingRoomId: 'room-1' }];

      mockPromotionService.validatePromotionApplicability = (jest.fn() as any).mockResolvedValue({
        valid: false
      });

      await expect(
        validatePromotions(promotionApplications, mockPromotionService as any)
      ).rejects.toThrow('Invalid promotion');
    });

    it('should validate multiple promotions', async () => {
      const promotionApplications = [
        { customerPromotionId: 'cp-1', bookingRoomId: 'room-1' },
        { customerPromotionId: 'cp-2', serviceUsageId: 'service-1' },
        { customerPromotionId: 'cp-3' }
      ];

      mockPromotionService.validatePromotionApplicability = (jest.fn() as any).mockResolvedValue({
        valid: true
      });

      await validatePromotions(promotionApplications, mockPromotionService as any);

      expect(mockPromotionService.validatePromotionApplicability).toHaveBeenCalledTimes(3);
    });

    it('should stop at first invalid promotion', async () => {
      const promotionApplications = [
        { customerPromotionId: 'cp-1', bookingRoomId: 'room-1' },
        { customerPromotionId: 'cp-2', serviceUsageId: 'service-1' }
      ];

      mockPromotionService.validatePromotionApplicability = (jest
        .fn() as any)
        .mockResolvedValueOnce({ valid: true })
        .mockResolvedValueOnce({ valid: false, reason: 'Invalid scope' });

      await expect(
        validatePromotions(promotionApplications, mockPromotionService as any)
      ).rejects.toThrow('Invalid scope');
    });

    it('should handle empty promotion applications', async () => {
      const promotionApplications: any[] = [];

      await validatePromotions(promotionApplications, mockPromotionService as any);

      expect(mockPromotionService.validatePromotionApplicability).not.toHaveBeenCalled();
    });
  });
});
