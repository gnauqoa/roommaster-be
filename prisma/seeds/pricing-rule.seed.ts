import { PrismaClient, AdjustmentType } from '@prisma/client';
import { LexoRank } from 'lexorank';

export async function seedPricingRules(prisma: PrismaClient) {
  console.log('  💰 Seeding pricing rules...');

  // Get Tết event for linking
  const tetEvent = await prisma.calendarEvent.findFirst({
    where: {
      name: { contains: 'Tết Nguyên Đán' },
      startDate: { gte: new Date() }
    },
    orderBy: { startDate: 'asc' }
  });

  // Get Summer event
  const summerEvent = await prisma.calendarEvent.findFirst({
    where: {
      name: { contains: 'Mùa Hè' },
      startDate: { gte: new Date() }
    },
    orderBy: { startDate: 'asc' }
  });

  const rules = [
    {
      name: 'Tăng giá Tết Nguyên Đán',
      calendarEventId: tetEvent?.id,
      adjustmentType: AdjustmentType.PERCENTAGE,
      adjustmentValue: 50,
      roomTypeIds: [],
      rank: LexoRank.middle().toString()
    },
    {
      name: 'Tăng giá cuối tuần',
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA,SU',
      adjustmentType: AdjustmentType.PERCENTAGE,
      adjustmentValue: 20,
      roomTypeIds: [],
      rank: LexoRank.middle().genNext().toString()
    },
    {
      name: 'Tăng giá mùa hè',
      calendarEventId: summerEvent?.id,
      adjustmentType: AdjustmentType.PERCENTAGE,
      adjustmentValue: 30,
      roomTypeIds: [],
      rank: LexoRank.middle().genNext().genNext().toString()
    },
    {
      name: 'Giảm giá ngày thường',
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      adjustmentType: AdjustmentType.PERCENTAGE,
      adjustmentValue: -10,
      roomTypeIds: [],
      rank: LexoRank.middle().genNext().genNext().genNext().toString()
    }
  ];

  for (const rule of rules) {
    await prisma.pricingRule.upsert({
      where: {
        rank: rule.rank
      },
      create: rule,
      update: rule
    });
  }

  console.log(`    ✓ Created ${rules.length} pricing rules`);
}
