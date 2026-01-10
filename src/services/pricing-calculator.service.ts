import { Injectable } from '@/core/decorators';
import { PrismaClient, Prisma, PricingRule, CalendarEvent, AdjustmentType } from '@prisma/client';
import { RRule } from 'rrule';

interface PricingResult {
  basePrice: Prisma.Decimal;
  finalPrice: Prisma.Decimal;
  appliedRule: (PricingRule & { calendarEvent: CalendarEvent | null }) | null;
}

type PricingRuleWithEvent = PricingRule & { calendarEvent: CalendarEvent | null };

@Injectable()
export class PricingCalculatorService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Calculate price for a room type on a specific date
   * Uses "Top of List Wins" strategy - first matching rule by rank wins
   */
  async calculatePrice(roomTypeId: string, date: Date): Promise<PricingResult> {
    // 1. Get Base Price from RoomType
    const roomType = await this.prisma.roomType.findUnique({
      where: { id: roomTypeId }
    });

    if (!roomType) {
      throw new Error(`Room Type not found: ${roomTypeId}`);
    }

    const basePrice = new Prisma.Decimal(roomType.basePrice);

    // 2. Fetch active rules sorted by rank (ASC - top wins)
    const rules = await this.prisma.pricingRule.findMany({
      where: { isActive: true },
      orderBy: { rank: 'asc' },
      include: { calendarEvent: true }
    });

    // 3. Find first matching rule
    for (const rule of rules) {
      if (this.isRuleMatch(rule, date, roomTypeId)) {
        const finalPrice = this.applyAdjustment(basePrice, rule);
        return { basePrice, finalPrice, appliedRule: rule };
      }
    }

    // No rule matched - return base price
    return { basePrice, finalPrice: basePrice, appliedRule: null };
  }

  /**
   * Check if a pricing rule matches the given criteria
   */
  private isRuleMatch(rule: PricingRuleWithEvent, date: Date, roomTypeId: string): boolean {
    // 1. Check Room Scope
    if (rule.roomTypeIds.length > 0 && !rule.roomTypeIds.includes(roomTypeId)) {
      return false;
    }

    // Determine Time Window
    let startWindow = rule.startDate;
    let endWindow = rule.endDate;

    // If rule is linked to a calendar event, use event's date range
    if (rule.calendarEvent) {
      startWindow = rule.calendarEvent.startDate;
      endWindow = rule.calendarEvent.endDate;
    }

    // 2. Check Time Window
    if (startWindow && date < startWindow) return false;
    if (endWindow && date > endWindow) return false;

    // 3. Check RRule (Recurrence Pattern)
    if (rule.recurrenceRule) {
      return this.checkRRuleMatch(rule.recurrenceRule, date, startWindow);
    }

    // If no RRule, rule matches (already passed time window check)
    return true;
  }

  /**
   * Check if a date matches an RRule pattern
   */
  private checkRRuleMatch(recurrenceRule: string, date: Date, startWindow: Date | null): boolean {
    try {
      // Parse RRule string
      const ruleOptions = RRule.parseString(recurrenceRule);

      // Create RRule instance
      const rrule = new RRule({
        ...ruleOptions,
        dtstart: startWindow || new Date(date.getFullYear(), 0, 1)
      });

      // Check if date falls within RRule occurrences
      // Only check within the 24h window of the target date
      const checkStart = new Date(date);
      checkStart.setHours(0, 0, 0, 0);
      const checkEnd = new Date(date);
      checkEnd.setHours(23, 59, 59, 999);

      const matches = rrule.between(checkStart, checkEnd, true);

      return matches.length > 0;
    } catch (error) {
      console.error(`Invalid RRule for rule: ${recurrenceRule}`, error);
      return false;
    }
  }

  /**
   * Apply price adjustment based on rule type
   */
  private applyAdjustment(basePrice: Prisma.Decimal, rule: PricingRule): Prisma.Decimal {
    const adjustmentValue = new Prisma.Decimal(rule.adjustmentValue);

    if (rule.adjustmentType === AdjustmentType.FIXED_AMOUNT) {
      // Fixed amount: add directly (supports negative for discount)
      return basePrice.plus(adjustmentValue);
    } else {
      // Percentage: calculate percentage change
      // adjustmentValue = -20 means 20% discount
      // adjustmentValue = +50 means 50% surcharge
      const factor = adjustmentValue.div(100);
      return basePrice.mul(new Prisma.Decimal(1).plus(factor));
    }
  }
}

export default PricingCalculatorService;
