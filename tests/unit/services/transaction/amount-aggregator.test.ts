import { describe, expect, it } from '@jest/globals';
import { aggregateTransactionAmounts } from '../../../../src/services/transaction/calculators/amount-aggregator';

describe('amount-aggregator', () => {
  describe('aggregateTransactionAmounts', () => {
    it('should aggregate amounts from transaction details', () => {
      const details = [
        { bookingRoomId: 'room-1', baseAmount: 1000, discountAmount: 100, amount: 900 },
        { bookingRoomId: 'room-2', baseAmount: 1500, discountAmount: 150, amount: 1350 },
        { serviceUsageId: 'service-1', baseAmount: 500, discountAmount: 50, amount: 450 }
      ];

      const discounts = new Map();

      const result = aggregateTransactionAmounts(details, discounts);

      expect(result.baseAmount).toBe(3000); // 1000 + 1500 + 500
      expect(result.discountAmount).toBe(300); // 100 + 150 + 50
      expect(result.amount).toBe(2700); // 3000 - 300
    });

    it('should include transaction-level discounts', () => {
      const details = [
        { bookingRoomId: 'room-1', baseAmount: 1000, discountAmount: 100, amount: 900 }
      ];

      const discounts = new Map();
      discounts.set('promo-1', {
        amount: 200,
        target: { customerPromotionId: 'promo-1' } // No bookingRoomId or serviceUsageId
      });

      const result = aggregateTransactionAmounts(details, discounts);

      expect(result.baseAmount).toBe(1000);
      expect(result.discountAmount).toBe(300); // 100 (detail) + 200 (transaction-level)
      expect(result.amount).toBe(700); // 1000 - 300
    });

    it('should not double-count detail-level discounts', () => {
      const details = [
        { bookingRoomId: 'room-1', baseAmount: 1000, discountAmount: 100, amount: 900 }
      ];

      const discounts = new Map();
      discounts.set('promo-1', {
        amount: 100,
        target: { bookingRoomId: 'room-1', customerPromotionId: 'promo-1' }
      });

      const result = aggregateTransactionAmounts(details, discounts);

      expect(result.baseAmount).toBe(1000);
      expect(result.discountAmount).toBe(100); // Only detail discount, not doubled
      expect(result.amount).toBe(900);
    });

    it('should handle multiple transaction-level discounts', () => {
      const details = [
        { bookingRoomId: 'room-1', baseAmount: 1000, discountAmount: 0, amount: 1000 }
      ];

      const discounts = new Map();
      discounts.set('promo-1', {
        amount: 100,
        target: { customerPromotionId: 'promo-1' }
      });
      discounts.set('promo-2', {
        amount: 50,
        target: { customerPromotionId: 'promo-2' }
      });

      const result = aggregateTransactionAmounts(details, discounts);

      expect(result.baseAmount).toBe(1000);
      expect(result.discountAmount).toBe(150); // 100 + 50
      expect(result.amount).toBe(850); // 1000 - 150
    });

    it('should handle empty details', () => {
      const details: any[] = [];
      const discounts = new Map();

      const result = aggregateTransactionAmounts(details, discounts);

      expect(result.baseAmount).toBe(0);
      expect(result.discountAmount).toBe(0);
      expect(result.amount).toBe(0);
    });

    it('should handle no discounts', () => {
      const details = [
        { bookingRoomId: 'room-1', baseAmount: 1000, discountAmount: 0, amount: 1000 },
        { serviceUsageId: 'service-1', baseAmount: 500, discountAmount: 0, amount: 500 }
      ];

      const discounts = new Map();

      const result = aggregateTransactionAmounts(details, discounts);

      expect(result.baseAmount).toBe(1500);
      expect(result.discountAmount).toBe(0);
      expect(result.amount).toBe(1500);
    });

    it('should correctly separate detail and transaction discounts', () => {
      const details = [
        { bookingRoomId: 'room-1', baseAmount: 1000, discountAmount: 100, amount: 900 },
        { bookingRoomId: 'room-2', baseAmount: 2000, discountAmount: 200, amount: 1800 }
      ];

      const discounts = new Map();
      discounts.set('promo-1', {
        amount: 100,
        target: { bookingRoomId: 'room-1', customerPromotionId: 'promo-1' }
      });
      discounts.set('promo-2', {
        amount: 300,
        target: { customerPromotionId: 'promo-2' } // Transaction-level
      });

      const result = aggregateTransactionAmounts(details, discounts);

      expect(result.baseAmount).toBe(3000); // 1000 + 2000
      expect(result.discountAmount).toBe(600); // 100 + 200 (details) + 300 (transaction)
      expect(result.amount).toBe(2400); // 3000 - 600
    });
  });
});
