import { PrismaClient, Prisma, ActivityType } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '@/utils/ApiError';
import { ActivityService } from '@/services/activity.service';
import { UsageServiceService } from '@/services/usage-service.service';
import { CreateTransactionPayload } from '@/services/transaction/types';

/**
 * Scenario 4: Guest service payment
 * Creates TransactionDetail only (no Transaction entity)
 * Note: Guest services don't support promotions in current design
 */
export async function processGuestServicePayment(
  payload: CreateTransactionPayload,
  prisma: PrismaClient,
  activityService: ActivityService,
  usageServiceService: UsageServiceService
) {
  const { serviceUsageId, paymentMethod, transactionType, employeeId } = payload;

  if (!serviceUsageId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Service usage ID is required');
  }

  return prisma.$transaction(async (tx) => {
    // Fetch service usage
    const serviceUsage = await tx.serviceUsage.findUnique({
      where: { id: serviceUsageId },
      include: { service: true }
    });

    if (!serviceUsage) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Service usage not found');
    }

    if (serviceUsage.bookingRoomId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'This service belongs to a booking. Use booking service payment instead.'
      );
    }

    const serviceBalance = new Prisma.Decimal(serviceUsage.totalPrice).sub(serviceUsage.totalPaid);

    if (serviceBalance.lte(0)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Service is already fully paid');
    }

    // Create transaction detail only (no transaction entity for guest services)
    const transactionDetail = await tx.transactionDetail.create({
      data: {
        serviceUsageId,
        baseAmount: serviceBalance.toNumber(),
        discountAmount: 0,
        amount: serviceBalance.toNumber()
      }
    });

    // Update service payment
    await usageServiceService.updateServiceUsagePayment(
      serviceUsageId,
      serviceBalance.toNumber(),
      employeeId,
      tx
    );

    // Create activity
    await activityService.createActivity(
      {
        type: ActivityType.CREATE_TRANSACTION,
        description: `Guest service payment: ${serviceUsage.service.name} - ${serviceBalance}`,
        employeeId,
        serviceUsageId,
        metadata: {
          transactionDetailId: transactionDetail.id,
          amount: serviceBalance.toNumber(),
          paymentMethod,
          transactionType
        }
      },
      tx
    );

    return {
      transactionDetail: await tx.transactionDetail.findUnique({
        where: { id: transactionDetail.id },
        include: { serviceUsage: { include: { service: true } } }
      })
    };
  });
}
