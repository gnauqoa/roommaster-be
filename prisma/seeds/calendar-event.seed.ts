import { EventType, PrismaClient } from '@prisma/client';

export async function seedCalendarEvents(prisma: PrismaClient) {
  console.log('  📅 Seeding calendar events...');

  const currentYear = new Date().getFullYear();
  const events = [];

  // ==================== FIXED GREGORIAN HOLIDAYS (RECURRING) ====================
  // These holidays have fixed dates in Gregorian calendar, use RRule

  // 30/4 - Reunification Day
  events.push({
    id: 'le-30-4',
    name: 'Lễ 30/4 - 1/5',
    description: 'Reunification Day and International Labor Day',
    type: EventType.HOLIDAY,
    startDate: new Date(`${currentYear}-04-30`),
    endDate: new Date(`${currentYear}-05-01`),
    rrule: 'FREQ=YEARLY;BYMONTH=4;BYMONTHDAY=30' // Recurs annually on Apr 30
  });

  // Quốc Khánh 2/9 - National Day
  events.push({
    id: 'quoc-khanh',
    name: 'Quốc Khánh',
    description: 'National Day of Vietnam',
    type: EventType.HOLIDAY,
    startDate: new Date(`${currentYear}-09-02`),
    endDate: new Date(`${currentYear}-09-02`),
    rrule: 'FREQ=YEARLY;BYMONTH=9;BYMONTHDAY=2' // Recurs annually on Sep 2
  });

  // ==================== LUNAR CALENDAR HOLIDAYS (NON-RECURRING) ====================
  // These holidays follow lunar calendar, dates vary each year
  // Create separate events for each year with accurate dates

  // Tết Nguyên Đán (Lunar New Year - varies by lunar calendar)
  const tetDates: { [key: number]: { start: string; end: string } } = {
    2026: { start: '2026-02-17', end: '2026-02-23' },
    2027: { start: '2027-02-06', end: '2027-02-12' },
    2028: { start: '2028-01-26', end: '2028-02-01' },
    2029: { start: '2029-02-13', end: '2029-02-19' },
    2030: { start: '2030-02-03', end: '2030-02-09' }
  };

  // Giỗ Tổ Hùng Vương (10/3 Âm lịch - varies by lunar calendar)
  const hungVuongDates: { [key: number]: string } = {
    2026: '2026-04-18',
    2027: '2027-04-07',
    2028: '2028-04-26',
    2029: '2029-04-15',
    2030: '2030-04-05'
  };

  for (let year = currentYear; year < currentYear + 5; year++) {
    // Tết Nguyên Đán
    if (tetDates[year]) {
      events.push({
        id: `tet-nguyen-dan-${year}`,
        name: `Tết Nguyên Đán ${year}`,
        description: 'Tết Âm lịch - Vietnamese Lunar New Year',
        type: EventType.HOLIDAY,
        startDate: new Date(tetDates[year].start),
        endDate: new Date(tetDates[year].end),
        rrule: null // Non-recurring (lunar calendar)
      });
    }

    // Giỗ Tổ Hùng Vương
    if (hungVuongDates[year]) {
      events.push({
        id: `gio-to-hung-vuong-${year}`,
        name: `Giỗ Tổ Hùng Vương ${year}`,
        description: "Hung Kings' Festival (10/3 Âm lịch)",
        type: EventType.HOLIDAY,
        startDate: new Date(hungVuongDates[year]),
        endDate: new Date(hungVuongDates[year]),
        rrule: null // Non-recurring (lunar calendar)
      });
    }
  }

  // ==================== SEASONAL EVENTS (NON-RECURRING) ====================
  // These span multiple months, don't use RRule

  for (let year = currentYear; year < currentYear + 5; year++) {
    // Mùa Hè (Summer Season)
    events.push({
      id: `mua-he-${year}`,
      name: `Mùa Hè ${year}`,
      description: 'Summer high season',
      type: EventType.SEASONAL,
      startDate: new Date(`${year}-06-01`),
      endDate: new Date(`${year}-08-31`),
      rrule: null // Non-recurring
    });

    // Mùa Đông (Winter Season)
    events.push({
      id: `mua-dong-${year}`,
      name: `Mùa Đông ${year}`,
      description: 'Winter low season',
      type: EventType.SEASONAL,
      startDate: new Date(`${year}-12-01`),
      endDate: new Date(`${year + 1}-02-28`),
      rrule: null // Non-recurring
    });
  }

  // Upsert events
  for (const event of events) {
    await prisma.calendarEvent.upsert({
      where: { id: event.id },
      create: event,
      update: event
    });
  }

  console.log(
    `    ✓ Created ${events.length} calendar events (2 recurring Gregorian holidays + ${
      events.length - 2
    } yearly events)`
  );
}
