import { Injectable } from '@/core/decorators';
import { PrismaClient, Prisma } from '@prisma/client';
import { LexoRank } from 'lexorank';
import ApiError from '@/utils/ApiError';
import httpStatus from 'http-status';

interface CreatePricingRuleDto {
  name: string;
  roomTypeIds?: string[];
  calendarEventId?: string;
  startDate?: Date;
  endDate?: Date;
  recurrenceRule?: string;
  adjustmentType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  adjustmentValue: number;
}

interface UpdatePricingRuleDto {
  name?: string;
  roomTypeIds?: string[];
  calendarEventId?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  recurrenceRule?: string | null;
  adjustmentType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  adjustmentValue?: number;
  isActive?: boolean;
}

interface ReorderPricingRuleDto {
  prevRank: string | null;
  nextRank: string | null;
}

@Injectable()
export class PricingRuleService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new pricing rule
   * Automatically generates rank (placed at bottom by default)
   */
  async createRule(data: CreatePricingRuleDto) {
    // Find the last rule to generate new rank
    const lastRule = await this.prisma.pricingRule.findFirst({
      orderBy: { rank: 'desc' }
    });

    let newRank: string;
    if (!lastRule) {
      // First rule - use middle rank
      newRank = LexoRank.middle().toString();
    } else {
      // Generate rank after the last one
      newRank = LexoRank.parse(lastRule.rank).genNext().toString();
    }

    return await this.prisma.pricingRule.create({
      data: {
        ...data,
        rank: newRank,
        roomTypeIds: data.roomTypeIds || []
      },
      include: {
        calendarEvent: true
      }
    });
  }

  /**
   * Get all pricing rules sorted by rank
   */
  async getRules(includeInactive = false) {
    return await this.prisma.pricingRule.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { rank: 'asc' },
      include: {
        calendarEvent: true
      }
    });
  }

  /**
   * Get a single pricing rule by ID
   */
  async getRuleById(id: string) {
    const rule = await this.prisma.pricingRule.findUnique({
      where: { id },
      include: {
        calendarEvent: true
      }
    });

    if (!rule) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Pricing rule not found');
    }

    return rule;
  }

  /**
   * Update a pricing rule
   */
  async updateRule(id: string, data: UpdatePricingRuleDto) {
    // Check if rule exists
    await this.getRuleById(id);

    return await this.prisma.pricingRule.update({
      where: { id },
      data,
      include: {
        calendarEvent: true
      }
    });
  }

  /**
   * Delete a pricing rule (soft delete - set isActive = false)
   */
  async deleteRule(id: string) {
    // Check if rule exists
    await this.getRuleById(id);

    return await this.prisma.pricingRule.update({
      where: { id },
      data: { isActive: false }
    });
  }

  /**
   * Reorder a pricing rule using Lexorank
   * @param ruleId - ID of the rule to reorder
   * @param prevRank - Rank of the rule before the target position (null if moving to top)
   * @param nextRank - Rank of the rule after the target position (null if moving to bottom)
   */
  async reorderRule(ruleId: string, { prevRank, nextRank }: ReorderPricingRuleDto) {
    // Check if rule exists
    await this.getRuleById(ruleId);

    let newRank: string;

    if (!prevRank && nextRank) {
      // Moving to top (before nextRank)
      newRank = LexoRank.parse(nextRank).genPrev().toString();
    } else if (prevRank && !nextRank) {
      // Moving to bottom (after prevRank)
      newRank = LexoRank.parse(prevRank).genNext().toString();
    } else if (prevRank && nextRank) {
      // Moving between two rules
      const prev = LexoRank.parse(prevRank);
      const next = LexoRank.parse(nextRank);
      newRank = prev.between(next).toString();
    } else {
      // Empty list or error - use middle
      newRank = LexoRank.middle().toString();
    }

    return await this.prisma.pricingRule.update({
      where: { id: ruleId },
      data: { rank: newRank },
      include: {
        calendarEvent: true
      }
    });
  }
}

export default PricingRuleService;
