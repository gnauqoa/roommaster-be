import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, AdjustmentType } from '@prisma/client';
import PricingCalculatorService from '@/services/pricing-calculator.service';
import { LexoRank } from 'lexorank';

const prisma = new PrismaClient();
const pricingCalculator = new PricingCalculatorService(prisma);

describe('PricingCalculatorService', () => {
  let testRoomTypeId: string;
  let testCalendarEventId: string;

  beforeAll(async () => {
    // Create test room type
    const roomType = await prisma.roomType.create({
      data: {
        name: 'Test Room Type',
        capacity: 2,
        totalBed: 1,
        basePrice: 1000000
      }
    });
    testRoomTypeId = roomType.id;

    // Create test calendar event
    const event = await prisma.calendarEvent.create({
      data: {
        name: 'Test Holiday',
        startDate: new Date('2026-02-01'),
        endDate: new Date('2026-02-07')
      }
    });
    testCalendarEventId = event.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.pricingRule.deleteMany({
      where: { name: { startsWith: 'Test' } }
    });
    await prisma.calendarEvent.deleteMany({
      where: { name: { startsWith: 'Test' } }
    });
    await prisma.roomType.deleteMany({
      where: { name: { startsWith: 'Test' } }
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up pricing rules before each test
    await prisma.pricingRule.deleteMany({
      where: { name: { startsWith: 'Test' } }
    });
  });

  describe('calculatePrice - Base Price', () => {
    it('should return base price when no rules match', async () => {
      const result = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-01-15'));

      expect(result.basePrice.toNumber()).toBe(1000000);
      expect(result.finalPrice.toNumber()).toBe(1000000);
      expect(result.appliedRule).toBeNull();
    });
  });

  describe('calculatePrice - Percentage Adjustment', () => {
    it('should apply percentage surcharge correctly', async () => {
      // Create rule with +20% surcharge
      await prisma.pricingRule.create({
        data: {
          name: 'Test Percentage Surcharge',
          rank: LexoRank.middle().toString(),
          roomTypeIds: [],
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 20,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31')
        }
      });

      const result = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-06-15'));

      expect(result.basePrice.toNumber()).toBe(1000000);
      expect(result.finalPrice.toNumber()).toBe(1200000); // +20%
      expect(result.appliedRule).not.toBeNull();
      expect(result.appliedRule?.name).toBe('Test Percentage Surcharge');
    });

    it('should apply percentage discount correctly', async () => {
      // Create rule with -15% discount
      await prisma.pricingRule.create({
        data: {
          name: 'Test Percentage Discount',
          rank: LexoRank.middle().toString(),
          roomTypeIds: [],
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: -15,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31')
        }
      });

      const result = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-06-15'));

      expect(result.finalPrice.toNumber()).toBe(850000); // -15%
    });
  });

  describe('calculatePrice - Fixed Amount Adjustment', () => {
    it('should apply fixed amount surcharge correctly', async () => {
      await prisma.pricingRule.create({
        data: {
          name: 'Test Fixed Surcharge',
          rank: LexoRank.middle().toString(),
          roomTypeIds: [],
          adjustmentType: AdjustmentType.FIXED_AMOUNT,
          adjustmentValue: 200000,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31')
        }
      });

      const result = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-06-15'));

      expect(result.finalPrice.toNumber()).toBe(1200000); // +200000
    });

    it('should apply fixed amount discount correctly', async () => {
      await prisma.pricingRule.create({
        data: {
          name: 'Test Fixed Discount',
          rank: LexoRank.middle().toString(),
          roomTypeIds: [],
          adjustmentType: AdjustmentType.FIXED_AMOUNT,
          adjustmentValue: -100000,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31')
        }
      });

      const result = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-06-15'));

      expect(result.finalPrice.toNumber()).toBe(900000); // -100000
    });
  });

  describe('calculatePrice - Room Scope', () => {
    it('should apply rule when room type is in scope', async () => {
      await prisma.pricingRule.create({
        data: {
          name: 'Test Scoped Rule',
          rank: LexoRank.middle().toString(),
          roomTypeIds: [testRoomTypeId],
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 10,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31')
        }
      });

      const result = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-06-15'));

      expect(result.finalPrice.toNumber()).toBe(1100000);
    });

    it('should not apply rule when room type is not in scope', async () => {
      const otherRoomType = await prisma.roomType.create({
        data: {
          name: 'Test Other Room Type',
          capacity: 2,
          totalBed: 1,
          basePrice: 800000
        }
      });

      await prisma.pricingRule.create({
        data: {
          name: 'Test Scoped Rule',
          rank: LexoRank.middle().toString(),
          roomTypeIds: [testRoomTypeId], // Only for testRoomTypeId
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 10,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31')
        }
      });

      const result = await pricingCalculator.calculatePrice(
        otherRoomType.id,
        new Date('2026-06-15')
      );

      expect(result.finalPrice.toNumber()).toBe(800000); // No adjustment
      expect(result.appliedRule).toBeNull();

      await prisma.roomType.delete({ where: { id: otherRoomType.id } });
    });
  });

  describe('calculatePrice - Calendar Event', () => {
    it('should apply rule linked to calendar event within date range', async () => {
      await prisma.pricingRule.create({
        data: {
          name: 'Test Event Rule',
          rank: LexoRank.middle().toString(),
          roomTypeIds: [],
          calendarEventId: testCalendarEventId,
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 50
        }
      });

      const result = await pricingCalculator.calculatePrice(
        testRoomTypeId,
        new Date('2026-02-03') // Within event range
      );

      expect(result.finalPrice.toNumber()).toBe(1500000); // +50%
    });

    it('should not apply rule linked to calendar event outside date range', async () => {
      await prisma.pricingRule.create({
        data: {
          name: 'Test Event Rule',
          rank: LexoRank.middle().toString(),
          roomTypeIds: [],
          calendarEventId: testCalendarEventId,
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 50
        }
      });

      const result = await pricingCalculator.calculatePrice(
        testRoomTypeId,
        new Date('2026-01-15') // Outside event range
      );

      expect(result.finalPrice.toNumber()).toBe(1000000); // No adjustment
      expect(result.appliedRule).toBeNull();
    });
  });

  describe('calculatePrice - RRule Patterns', () => {
    it('should apply rule for weekend (Saturday and Sunday)', async () => {
      await prisma.pricingRule.create({
        data: {
          name: 'Test Weekend Rule',
          rank: LexoRank.middle().toString(),
          roomTypeIds: [],
          recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA,SU',
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 20
        }
      });

      // Saturday
      const saturdayResult = await pricingCalculator.calculatePrice(
        testRoomTypeId,
        new Date('2026-01-17') // Saturday
      );
      expect(saturdayResult.finalPrice.toNumber()).toBe(1200000);

      // Sunday
      const sundayResult = await pricingCalculator.calculatePrice(
        testRoomTypeId,
        new Date('2026-01-18') // Sunday
      );
      expect(sundayResult.finalPrice.toNumber()).toBe(1200000);

      // Monday (should not apply)
      const mondayResult = await pricingCalculator.calculatePrice(
        testRoomTypeId,
        new Date('2026-01-19') // Monday
      );
      expect(mondayResult.finalPrice.toNumber()).toBe(1000000);
    });

    it('should apply rule for weekdays', async () => {
      await prisma.pricingRule.create({
        data: {
          name: 'Test Weekday Rule',
          rank: LexoRank.middle().toString(),
          roomTypeIds: [],
          recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: -10
        }
      });

      // Monday
      const result = await pricingCalculator.calculatePrice(
        testRoomTypeId,
        new Date('2026-01-19') // Monday
      );
      expect(result.finalPrice.toNumber()).toBe(900000);

      // Saturday (should not apply)
      const saturdayResult = await pricingCalculator.calculatePrice(
        testRoomTypeId,
        new Date('2026-01-17') // Saturday
      );
      expect(saturdayResult.finalPrice.toNumber()).toBe(1000000);
    });
  });

  describe('calculatePrice - Priority (Top Wins)', () => {
    it('should apply rule with highest priority (smallest rank)', async () => {
      const rank1 = LexoRank.middle();
      const rank2 = rank1.genNext();

      // Create two rules, first one should win
      await prisma.pricingRule.create({
        data: {
          name: 'Test High Priority',
          rank: rank1.toString(),
          roomTypeIds: [],
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 50,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31')
        }
      });

      await prisma.pricingRule.create({
        data: {
          name: 'Test Low Priority',
          rank: rank2.toString(),
          roomTypeIds: [],
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 10,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31')
        }
      });

      const result = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-06-15'));

      // Should apply first rule (+50%)
      expect(result.finalPrice.toNumber()).toBe(1500000);
      expect(result.appliedRule?.name).toBe('Test High Priority');
    });
  });

  describe('calculatePrice - Inactive Rules', () => {
    it('should not apply inactive rules', async () => {
      await prisma.pricingRule.create({
        data: {
          name: 'Test Inactive Rule',
          rank: LexoRank.middle().toString(),
          roomTypeIds: [],
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 50,
          isActive: false,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31')
        }
      });

      const result = await pricingCalculator.calculatePrice(testRoomTypeId, new Date('2026-06-15'));

      expect(result.finalPrice.toNumber()).toBe(1000000);
      expect(result.appliedRule).toBeNull();
    });
  });
});
