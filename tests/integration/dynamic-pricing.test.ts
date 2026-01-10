import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient, EventType, AdjustmentType } from '@prisma/client';
import PricingCalculatorService from '@/services/pricing-calculator.service';
import PricingRuleService from '@/services/pricing-rule.service';
import { LexoRank } from 'lexorank';

const prisma = new PrismaClient();
const pricingCalculator = new PricingCalculatorService(prisma);
const pricingRuleService = new PricingRuleService(prisma);

describe('Dynamic Pricing Integration Tests', () => {
  let testRoomTypeId: string;
  let tetEventId: string;
  let summerEventId: string;

  beforeAll(async () => {
    // Create test room type
    const roomType = await prisma.roomType.create({
      data: {
        name: 'Integration Test Room',
        capacity: 2,
        totalBed: 1,
        basePrice: 1000000
      }
    });
    testRoomTypeId = roomType.id;

    // Create calendar events
    const tetEvent = await prisma.calendarEvent.create({
      data: {
        name: 'Integration Test Tết',
        type: EventType.HOLIDAY,
        startDate: new Date('2026-02-17'),
        endDate: new Date('2026-02-23')
      }
    });
    tetEventId = tetEvent.id;

    const summerEvent = await prisma.calendarEvent.create({
      data: {
        name: 'Integration Test Summer',
        type: EventType.SEASONAL,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-08-31')
      }
    });
    summerEventId = summerEvent.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.pricingRule.deleteMany({
      where: { name: { startsWith: 'Integration' } }
    });
    await prisma.calendarEvent.deleteMany({
      where: { name: { startsWith: 'Integration' } }
    });
    await prisma.roomType.deleteMany({
      where: { name: { startsWith: 'Integration' } }
    });
    await prisma.$disconnect();
  });

  describe('Complete Pricing Flow', () => {
    it('should handle complex pricing scenario with multiple rules', async () => {
      // Clean up existing rules
      await prisma.pricingRule.deleteMany({
        where: { name: { startsWith: 'Integration' } }
      });

      // Create rules with different priorities
      const tetRule = await pricingRuleService.createRule({
        name: 'Integration Tết Surcharge',
        calendarEventId: tetEventId,
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 50
      });

      const weekendRule = await pricingRuleService.createRule({
        name: 'Integration Weekend Surcharge',
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA,SU',
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 20
      });

      const summerRule = await pricingRuleService.createRule({
        name: 'Integration Summer Surcharge',
        calendarEventId: summerEventId,
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 30
      });

      // Test 1: Regular weekday (no rules apply)
      const regularDay = await pricingCalculator.calculatePrice(
        testRoomTypeId,
        new Date('2026-03-16') // Monday
      );
      expect(regularDay.finalPrice.toNumber()).toBe(1000000);
      expect(regularDay.appliedRule).toBeNull();

      // Test 2: Weekend (weekend rule applies)
      const weekend = await pricingCalculator.calculatePrice(
        testRoomTypeId,
        new Date('2026-03-14') // Saturday
      );
      expect(weekend.finalPrice.toNumber()).toBe(1200000); // +20%
      expect(weekend.appliedRule?.name).toBe('Integration Weekend Surcharge');

      // Test 3: Tết period (Tết rule has highest priority)
      const tet = await pricingCalculator.calculatePrice(
        testRoomTypeId,
        new Date('2026-02-20') // During Tết
      );
      expect(tet.finalPrice.toNumber()).toBe(1500000); // +50%
      expect(tet.appliedRule?.name).toBe('Integration Tết Surcharge');

      // Test 4: Summer (summer rule applies)
      const summer = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-07-15'));
      expect(summer.finalPrice.toNumber()).toBe(1300000); // +30%
      expect(summer.appliedRule?.name).toBe('Integration Summer Surcharge');
    });

    it('should respect rule priority after reordering', async () => {
      // Clean up
      await prisma.pricingRule.deleteMany({
        where: { name: { startsWith: 'Integration' } }
      });

      // Create two overlapping rules
      const rule1 = await pricingRuleService.createRule({
        name: 'Integration Rule 1',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 10
      });

      const rule2 = await pricingRuleService.createRule({
        name: 'Integration Rule 2',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 30
      });

      // Initially, rule1 should win (created first, has lower rank)
      let result = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-06-15'));
      expect(result.finalPrice.toNumber()).toBe(1100000); // +10%
      expect(result.appliedRule?.name).toBe('Integration Rule 1');

      // Reorder: move rule2 to top
      await pricingRuleService.reorderRule(rule2.id, {
        prevRank: null,
        nextRank: rule1.rank
      });

      // Now rule2 should win
      result = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-06-15'));
      expect(result.finalPrice.toNumber()).toBe(1300000); // +30%
      expect(result.appliedRule?.name).toBe('Integration Rule 2');
    });

    it('should handle rule activation/deactivation', async () => {
      // Clean up
      await prisma.pricingRule.deleteMany({
        where: { name: { startsWith: 'Integration' } }
      });

      const rule = await pricingRuleService.createRule({
        name: 'Integration Active Rule',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 25
      });

      // Rule is active - should apply
      let result = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-06-15'));
      expect(result.finalPrice.toNumber()).toBe(1250000);

      // Deactivate rule
      await pricingRuleService.deleteRule(rule.id);

      // Rule is inactive - should not apply
      result = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-06-15'));
      expect(result.finalPrice.toNumber()).toBe(1000000);
      expect(result.appliedRule).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative final price gracefully', async () => {
      // Clean up
      await prisma.pricingRule.deleteMany({
        where: { name: { startsWith: 'Integration' } }
      });

      // Create rule with large discount
      await pricingRuleService.createRule({
        name: 'Integration Large Discount',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        adjustmentType: 'FIXED_AMOUNT',
        adjustmentValue: -1500000 // More than base price
      });

      const result = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-06-15'));

      // Should allow negative price (business logic can validate this elsewhere)
      expect(result.finalPrice.toNumber()).toBe(-500000);
    });

    it('should handle very small adjustments correctly', async () => {
      // Clean up
      await prisma.pricingRule.deleteMany({
        where: { name: { startsWith: 'Integration' } }
      });

      await pricingRuleService.createRule({
        name: 'Integration Small Adjustment',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 0.5 // 0.5%
      });

      const result = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-06-15'));

      expect(result.finalPrice.toNumber()).toBe(1005000); // +0.5%
    });

    it('should handle room type with no matching rules', async () => {
      // Clean up
      await prisma.pricingRule.deleteMany({
        where: { name: { startsWith: 'Integration' } }
      });

      // Create another room type
      const otherRoomType = await prisma.roomType.create({
        data: {
          name: 'Integration Other Room',
          capacity: 4,
          totalBed: 2,
          basePrice: 2000000
        }
      });

      // Create rule scoped to testRoomTypeId only
      await pricingRuleService.createRule({
        name: 'Integration Scoped Rule',
        roomTypeIds: [testRoomTypeId],
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 20
      });

      // Should apply to testRoomTypeId
      const result1 = await pricingCalculator.calculatePrice(
        testRoomTypeId,
        new Date('2026-06-15')
      );
      expect(result1.finalPrice.toNumber()).toBe(1200000);

      // Should NOT apply to otherRoomType
      const result2 = await pricingCalculator.calculatePrice(
        otherRoomType.id,
        new Date('2026-06-15')
      );
      expect(result2.finalPrice.toNumber()).toBe(2000000);

      await prisma.roomType.delete({ where: { id: otherRoomType.id } });
    });
  });
});
