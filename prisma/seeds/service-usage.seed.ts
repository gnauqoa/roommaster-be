import { PrismaClient, ServiceUsageStatus } from '@prisma/client';
import { getSeededBookings } from './booking.seed';
import { getSeededEmployees } from './employee.seed';

/**
 * Seed service usage data for report testing
 * Schema fields: id, bookingId, bookingRoomId, employeeId, serviceId, quantity, unitPrice, customPrice, totalPrice, totalPaid, note, status
 * @param prisma - Prisma client instance
 */
export const seedServiceUsage = async (prisma: PrismaClient): Promise<void> => {
  console.log('Seeding service usage...');

  const bookings = await getSeededBookings(prisma);
  const employees = await getSeededEmployees(prisma);
  const services = await prisma.service.findMany();

  if (bookings.length === 0 || services.length === 0 || employees.length === 0) {
    console.log('⚠ Missing required data. Please seed bookings, services, and employees first.');
    return;
  }

  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  // Find specific services - use first service if not found
  const defaultService = services[0];
  const laundryService =
    services.find((s) => s.name.toLowerCase().includes('giặt')) || defaultService;
  const spaService =
    services.find(
      (s) => s.name.toLowerCase().includes('spa') || s.name.toLowerCase().includes('massage')
    ) || defaultService;
  const foodService =
    services.find(
      (s) => s.name.toLowerCase().includes('ăn') || s.name.toLowerCase().includes('thức ăn')
    ) || defaultService;

  const serviceUsages = [
    // Recent service usage - 1 month ago
    {
      bookingId: bookings[0]?.id,
      bookingRoomId: bookings[0]?.bookingRooms?.[0]?.id,
      serviceId: laundryService.id,
      employeeId: employees[0]?.id,
      quantity: 2,
      unitPrice: laundryService.price,
      totalPrice: Number(laundryService.price) * 2,
      totalPaid: Number(laundryService.price) * 2,
      status: ServiceUsageStatus.COMPLETED,
      note: 'Laundry service for 2 items',
      createdAt: oneMonthAgo
    },
    {
      bookingId: bookings[0]?.id,
      bookingRoomId: bookings[0]?.bookingRooms?.[0]?.id,
      serviceId: spaService.id,
      employeeId: employees[1]?.id || employees[0]?.id,
      quantity: 1,
      unitPrice: spaService.price,
      totalPrice: Number(spaService.price),
      totalPaid: Number(spaService.price),
      status: ServiceUsageStatus.COMPLETED,
      note: 'Spa treatment',
      createdAt: new Date(oneMonthAgo.getTime() + 1 * 24 * 60 * 60 * 1000)
    },
    // Historical service usage - 2 months ago
    {
      bookingId: bookings[1]?.id,
      bookingRoomId: bookings[1]?.bookingRooms?.[0]?.id,
      serviceId: foodService.id,
      employeeId: employees[0]?.id,
      quantity: 3,
      unitPrice: foodService.price,
      totalPrice: Number(foodService.price) * 3,
      totalPaid: Number(foodService.price) * 3,
      status: ServiceUsageStatus.COMPLETED,
      note: 'Room service - meals',
      createdAt: twoMonthsAgo
    },
    {
      bookingId: bookings[1]?.id,
      bookingRoomId: bookings[1]?.bookingRooms?.[0]?.id,
      serviceId: laundryService.id,
      employeeId: employees[1]?.id || employees[0]?.id,
      quantity: 5,
      unitPrice: laundryService.price,
      totalPrice: Number(laundryService.price) * 5,
      totalPaid: Number(laundryService.price) * 5,
      status: ServiceUsageStatus.COMPLETED,
      note: 'Bulk laundry service',
      createdAt: new Date(twoMonthsAgo.getTime() + 2 * 24 * 60 * 60 * 1000)
    },
    // Pending service
    {
      bookingId: bookings[2]?.id,
      bookingRoomId: bookings[2]?.bookingRooms?.[0]?.id,
      serviceId: spaService.id,
      employeeId: employees[0]?.id,
      quantity: 1,
      unitPrice: spaService.price,
      totalPrice: Number(spaService.price),
      totalPaid: 0,
      status: ServiceUsageStatus.PENDING,
      note: 'Spa booking - pending',
      createdAt: now
    },
    // Cancelled service
    {
      bookingId: bookings[2]?.id,
      bookingRoomId: bookings[2]?.bookingRooms?.[0]?.id,
      serviceId: foodService.id,
      employeeId: employees[1]?.id || employees[0]?.id,
      quantity: 2,
      unitPrice: foodService.price,
      totalPrice: Number(foodService.price) * 2,
      totalPaid: 0,
      status: ServiceUsageStatus.CANCELLED,
      note: 'Cancelled by customer',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    },
    // More service usage for trend analysis
    {
      bookingId: bookings[0]?.id,
      bookingRoomId: bookings[0]?.bookingRooms?.[0]?.id,
      serviceId: spaService.id,
      employeeId: employees[0]?.id,
      quantity: 2,
      unitPrice: spaService.price,
      totalPrice: Number(spaService.price) * 2,
      totalPaid: Number(spaService.price) * 2,
      status: ServiceUsageStatus.COMPLETED,
      note: 'Couples spa treatment',
      createdAt: new Date(oneMonthAgo.getTime() + 2 * 24 * 60 * 60 * 1000)
    },
    {
      bookingId: bookings[1]?.id,
      bookingRoomId: bookings[1]?.bookingRooms?.[0]?.id,
      serviceId: spaService.id,
      employeeId: employees[1]?.id || employees[0]?.id,
      quantity: 1,
      unitPrice: spaService.price,
      totalPrice: Number(spaService.price),
      totalPaid: Number(spaService.price),
      status: ServiceUsageStatus.COMPLETED,
      note: 'Relaxation spa',
      createdAt: new Date(twoMonthsAgo.getTime() + 3 * 24 * 60 * 60 * 1000)
    }
  ];

  // Check if service usage already exists for these bookings
  const existingUsages = await prisma.serviceUsage.findMany({
    where: {
      bookingId: {
        in: bookings.slice(0, 3).map((b) => b.id)
      }
    }
  });

  if (existingUsages.length > 0) {
    console.log(`  Found ${existingUsages.length} existing service usages, skipping...`);
    return;
  }

  for (const usage of serviceUsages) {
    await prisma.serviceUsage.create({
      data: usage
    });
  }

  console.log(`✓ Created ${serviceUsages.length} service usage records`);
};

/**
 * Get seeded service usages for use in other seeds
 */
export const getSeededServiceUsages = async (prisma: PrismaClient) => {
  return prisma.serviceUsage.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' }
  });
};
