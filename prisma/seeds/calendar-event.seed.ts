import { PrismaClient, EventType } from '@prisma/client';

export async function seedCalendarEvents(prisma: PrismaClient) {
  console.log('  📅 Seeding calendar events...');

  const currentYear = new Date().getFullYear();
  const events = [];

  // Seed for current year and next 4 years (total 5 years)
  for (let year = currentYear; year < currentYear + 5; year++) {
    // Tết Nguyên Đán (Lunar New Year - approximate dates)
    // Note: These are approximate Gregorian dates, actual dates vary
    const tetDates: { [key: number]: { start: string; end: string } } = {
      2026: { start: '2026-02-17', end: '2026-02-23' },
      2027: { start: '2027-02-06', end: '2027-02-12' },
      2028: { start: '2028-01-26', end: '2028-02-01' },
      2029: { start: '2029-02-13', end: '2029-02-19' },
      2030: { start: '2030-02-03', end: '2030-02-09' }
    };

    if (tetDates[year]) {
      events.push({
        name: `Tết Nguyên Đán ${year}`,
        description: 'Tết Âm lịch - Vietnamese Lunar New Year',
        type: EventType.HOLIDAY,
        startDate: new Date(tetDates[year].start),
        endDate: new Date(tetDates[year].end)
      });
    }

    // Giỗ Tổ Hùng Vương (10/3 Âm lịch - approximate)
    events.push({
      name: `Giỗ Tổ Hùng Vương ${year}`,
      description: "Hung Kings' Festival",
      type: EventType.HOLIDAY,
      startDate: new Date(`${year}-04-18`),
      endDate: new Date(`${year}-04-18`)
    });

    // 30/4 - 1/5
    events.push({
      name: `Lễ 30/4 - 1/5 ${year}`,
      description: 'Reunification Day and International Labor Day',
      type: EventType.HOLIDAY,
      startDate: new Date(`${year}-04-30`),
      endDate: new Date(`${year}-05-01`)
    });

    // Quốc Khánh 2/9
    events.push({
      name: `Quốc Khánh ${year}`,
      description: 'National Day of Vietnam',
      type: EventType.HOLIDAY,
      startDate: new Date(`${year}-09-02`),
      endDate: new Date(`${year}-09-02`)
    });

    // Mùa Hè (Summer Season)
    events.push({
      name: `Mùa Hè ${year}`,
      description: 'Summer high season',
      type: EventType.SEASONAL,
      startDate: new Date(`${year}-06-01`),
      endDate: new Date(`${year}-08-31`)
    });

    // Mùa Đông (Winter Season)
    events.push({
      name: `Mùa Đông ${year}`,
      description: 'Winter low season',
      type: EventType.SEASONAL,
      startDate: new Date(`${year}-12-01`),
      endDate: new Date(`${year}-02-28`)
    });
  }

  // Upsert events
  for (const event of events) {
    await prisma.calendarEvent.upsert({
      where: {
        id: `${event.name.toLowerCase().replace(/\s+/g, '-')}`
      },
      create: event,
      update: event
    });
  }

  console.log(`    ✓ Created ${events.length} calendar events`);
}
