import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getIds() {
  const customer = await prisma.customer.findFirst();
  const employee = await prisma.employee.findFirst();
  const room = await prisma.room.findFirst();
  const roomType = await prisma.roomType.findFirst();
  const service = await prisma.service.findFirst();
  const paymentMethod = await prisma.paymentMethod.findFirst();
  const customerTier = await prisma.customerTier.findFirst();
  const shift = await prisma.workShift.findFirst();
  const reservation = await prisma.reservation.findFirst();
  const stayRecord = await prisma.stayRecord.findFirst();
  const folio = await prisma.guestFolio.findFirst();

  console.log(
    JSON.stringify(
      {
        customerId: customer?.id,
        employeeId: employee?.id,
        roomId: room?.id,
        roomTypeId: roomType?.id,
        serviceId: service?.id,
        paymentMethodId: paymentMethod?.id,
        customerTierId: customerTier?.id,
        shiftId: shift?.id,
        reservationId: reservation?.id,
        stayRecordId: stayRecord?.id,
        folioId: folio?.id
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

getIds();
