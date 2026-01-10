import { describe, it, expect, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient, AdjustmentType } from '@prisma/client';
import PricingRuleService from '@/services/pricing-rule.service';
import { LexoRank } from 'lexorank';

const prisma = new PrismaClient();
const pricingRuleService = new PricingRuleService(prisma);

describe('PricingRuleService', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.pricingRule.deleteMany({
      where: { name: { startsWith: 'Test' } }
    });
  });

  afterAll(async () => {
    await prisma.pricingRule.deleteMany({
      where: { name: { startsWith: 'Test' } }
    });
    await prisma.$disconnect();
  });

  describe('createRule', () => {
    it('should create a rule with auto-generated rank', async () => {
      const rule = await pricingRuleService.createRule({
        name: 'Test Rule 1',
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 20
      });

      expect(rule.name).toBe('Test Rule 1');
      expect(rule.rank).toBeDefined();
      expect(rule.adjustmentType).toBe('PERCENTAGE');
      expect(rule.adjustmentValue.toNumber()).toBe(20);
      expect(rule.isActive).toBe(true);
    });

    it('should create first rule with middle rank', async () => {
      const rule = await pricingRuleService.createRule({
        name: 'Test First Rule',
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 10
      });

      expect(rule.rank).toBe(LexoRank.middle().toString());
    });

    it('should create subsequent rules with increasing ranks', async () => {
      const rule1 = await pricingRuleService.createRule({
        name: 'Test Rule 1',
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 10
      });

      const rule2 = await pricingRuleService.createRule({
        name: 'Test Rule 2',
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 20
      });

      // rule2 should have a higher rank (comes after rule1)
      expect(rule2.rank > rule1.rank).toBe(true);
    });

    it('should create rule with room type scope', async () => {
      const rule = await pricingRuleService.createRule({
        name: 'Test Scoped Rule',
        roomTypeIds: ['room-type-1', 'room-type-2'],
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 15
      });

      expect(rule.roomTypeIds).toEqual(['room-type-1', 'room-type-2']);
    });

    it('should create rule with RRule pattern', async () => {
      const rule = await pricingRuleService.createRule({
        name: 'Test Weekend Rule',
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA,SU',
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 25
      });

      expect(rule.recurrenceRule).toBe('FREQ=WEEKLY;BYDAY=SA,SU');
    });
  });

  describe('getRules', () => {
    it('should return rules sorted by rank', async () => {
      const rank1 = LexoRank.middle();
      const rank2 = rank1.genNext();
      const rank3 = rank2.genNext();

      await prisma.pricingRule.create({
        data: {
          name: 'Test Rule 2',
          rank: rank2.toString(),
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 20
        }
      });

      await prisma.pricingRule.create({
        data: {
          name: 'Test Rule 1',
          rank: rank1.toString(),
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 10
        }
      });

      await prisma.pricingRule.create({
        data: {
          name: 'Test Rule 3',
          rank: rank3.toString(),
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 30
        }
      });

      const rules = await pricingRuleService.getRules();

      expect(rules).toHaveLength(3);
      expect(rules[0].name).toBe('Test Rule 1');
      expect(rules[1].name).toBe('Test Rule 2');
      expect(rules[2].name).toBe('Test Rule 3');
    });

    it('should exclude inactive rules by default', async () => {
      await prisma.pricingRule.create({
        data: {
          name: 'Test Active Rule',
          rank: LexoRank.middle().toString(),
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 10,
          isActive: true
        }
      });

      await prisma.pricingRule.create({
        data: {
          name: 'Test Inactive Rule',
          rank: LexoRank.middle().genNext().toString(),
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 20,
          isActive: false
        }
      });

      const rules = await pricingRuleService.getRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].name).toBe('Test Active Rule');
    });

    it('should include inactive rules when requested', async () => {
      await prisma.pricingRule.create({
        data: {
          name: 'Test Active Rule',
          rank: LexoRank.middle().toString(),
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 10,
          isActive: true
        }
      });

      await prisma.pricingRule.create({
        data: {
          name: 'Test Inactive Rule',
          rank: LexoRank.middle().genNext().toString(),
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 20,
          isActive: false
        }
      });

      const rules = await pricingRuleService.getRules(true);

      expect(rules).toHaveLength(2);
    });
  });

  describe('getRuleById', () => {
    it('should return rule by ID', async () => {
      const created = await pricingRuleService.createRule({
        name: 'Test Rule',
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 15
      });

      const rule = await pricingRuleService.getRuleById(created.id);

      expect(rule.id).toBe(created.id);
      expect(rule.name).toBe('Test Rule');
    });

    it('should throw error if rule not found', async () => {
      await expect(pricingRuleService.getRuleById('non-existent-id')).rejects.toThrow(
        'Pricing rule not found'
      );
    });
  });

  describe('updateRule', () => {
    it('should update rule properties', async () => {
      const created = await pricingRuleService.createRule({
        name: 'Test Rule',
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 10
      });

      const updated = await pricingRuleService.updateRule(created.id, {
        name: 'Updated Rule',
        adjustmentValue: 25
      });

      expect(updated.name).toBe('Updated Rule');
      expect(updated.adjustmentValue.toNumber()).toBe(25);
    });

    it('should update isActive flag', async () => {
      const created = await pricingRuleService.createRule({
        name: 'Test Rule',
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 10
      });

      const updated = await pricingRuleService.updateRule(created.id, {
        isActive: false
      });

      expect(updated.isActive).toBe(false);
    });
  });

  describe('deleteRule', () => {
    it('should soft delete rule (set isActive to false)', async () => {
      const created = await pricingRuleService.createRule({
        name: 'Test Rule',
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 10
      });

      const deleted = await pricingRuleService.deleteRule(created.id);

      expect(deleted.isActive).toBe(false);

      // Verify it still exists in database
      const found = await prisma.pricingRule.findUnique({
        where: { id: created.id }
      });
      expect(found).not.toBeNull();
      expect(found?.isActive).toBe(false);
    });
  });

  describe('reorderRule - Lexorank', () => {
    it('should move rule to top (before all)', async () => {
      const rank1 = LexoRank.middle();
      const rank2 = rank1.genNext();

      const rule1 = await prisma.pricingRule.create({
        data: {
          name: 'Test Rule 1',
          rank: rank1.toString(),
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 10
        }
      });

      const rule2 = await prisma.pricingRule.create({
        data: {
          name: 'Test Rule 2',
          rank: rank2.toString(),
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 20
        }
      });

      // Move rule2 to top (before rule1)
      const reordered = await pricingRuleService.reorderRule(rule2.id, {
        prevRank: null,
        nextRank: rule1.rank
      });

      expect(reordered.rank < rule1.rank).toBe(true);
    });

    it('should move rule to bottom (after all)', async () => {
      const rank1 = LexoRank.middle();
      const rank2 = rank1.genNext();

      const rule1 = await prisma.pricingRule.create({
        data: {
          name: 'Test Rule 1',
          rank: rank1.toString(),
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 10
        }
      });

      const rule2 = await prisma.pricingRule.create({
        data: {
          name: 'Test Rule 2',
          rank: rank2.toString(),
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 20
        }
      });

      // Move rule1 to bottom (after rule2)
      const reordered = await pricingRuleService.reorderRule(rule1.id, {
        prevRank: rule2.rank,
        nextRank: null
      });

      expect(reordered.rank > rule2.rank).toBe(true);
    });

    it('should move rule between two rules', async () => {
      const rank1 = LexoRank.middle();
      const rank2 = rank1.genNext();
      const rank3 = rank2.genNext();

      const rule1 = await prisma.pricingRule.create({
        data: {
          name: 'Test Rule 1',
          rank: rank1.toString(),
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 10
        }
      });

      const rule2 = await prisma.pricingRule.create({
        data: {
          name: 'Test Rule 2',
          rank: rank2.toString(),
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 20
        }
      });

      const rule3 = await prisma.pricingRule.create({
        data: {
          name: 'Test Rule 3',
          rank: rank3.toString(),
          adjustmentType: AdjustmentType.PERCENTAGE,
          adjustmentValue: 30
        }
      });

      // Move rule3 between rule1 and rule2
      const reordered = await pricingRuleService.reorderRule(rule3.id, {
        prevRank: rule1.rank,
        nextRank: rule2.rank
      });

      expect(reordered.rank > rule1.rank).toBe(true);
      expect(reordered.rank < rule2.rank).toBe(true);

      // Verify order
      const rules = await pricingRuleService.getRules();
      expect(rules[0].name).toBe('Test Rule 1');
      expect(rules[1].name).toBe('Test Rule 3');
      expect(rules[2].name).toBe('Test Rule 2');
    });
  });
});
