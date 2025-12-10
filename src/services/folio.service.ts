import {
  GuestFolio,
  FolioTransaction,
  FolioType,
  FolioStatus,
  TransactionType,
  TransactionCategory,
  Prisma
} from '@prisma/client';
import httpStatus from 'http-status';
import prisma from 'prisma';
import ApiError from 'utils/ApiError';
import { PaginatedResponse } from 'types/response';

const generateFolioCode = async (): Promise<string> => {
  const today = new Date();
  const prefix = `FLO${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;

  const lastFolio = await prisma.guestFolio.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' }
  });

  let sequence = 1;
  if (lastFolio) {
    const lastSequence = parseInt(lastFolio.code.slice(-4), 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

const generateTransactionCode = async (): Promise<string> => {
  const today = new Date();
  const prefix = `TXN${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;

  const lastTransaction = await prisma.folioTransaction.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' }
  });

  let sequence = 1;
  if (lastTransaction) {
    const lastSequence = parseInt(lastTransaction.code.slice(-4), 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

const createGuestFolio = async (data: {
  reservationId?: number;
  stayRecordId?: number;
  stayDetailId?: number;
  billToCustomerId: number;
  folioType?: FolioType;
  notes?: string;
}): Promise<GuestFolio> => {
  const customer = await prisma.customer.findUnique({ where: { id: data.billToCustomerId } });
  if (!customer) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Customer not found');
  }

  const folioType = data.folioType ?? FolioType.GUEST;

  // Validate folio type with stay relationships
  if (folioType === FolioType.GUEST) {
    // GUEST folio requires both stayDetailId and stayRecordId
    if (!data.stayDetailId || !data.stayRecordId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'GUEST folio requires both stayDetailId and stayRecordId'
      );
    }
    // Verify stayDetail exists
    const stayDetail = await prisma.stayDetail.findUnique({ where: { id: data.stayDetailId } });
    if (!stayDetail) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'StayDetail not found');
    }
    // Verify stayRecord exists
    const stayRecord = await prisma.stayRecord.findUnique({ where: { id: data.stayRecordId } });
    if (!stayRecord) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'StayRecord not found');
    }
  } else if (folioType === FolioType.MASTER) {
    // MASTER folio requires only stayRecordId
    if (!data.stayRecordId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'MASTER folio requires stayRecordId');
    }
    if (data.stayDetailId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'MASTER folio should not have stayDetailId');
    }
    // Verify stayRecord exists
    const stayRecord = await prisma.stayRecord.findUnique({ where: { id: data.stayRecordId } });
    if (!stayRecord) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'StayRecord not found');
    }
  } else if (folioType === FolioType.NON_RESIDENT) {
    // NON_RESIDENT folios should not have stayRecordId or stayDetailId
    if (data.stayRecordId || data.stayDetailId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'NON_RESIDENT folio should not be linked to a stay'
      );
    }
  }

  const code = await generateFolioCode();

  return prisma.guestFolio.create({
    data: {
      code,
      reservationId: folioType === FolioType.NON_RESIDENT ? undefined : data.reservationId,
      stayRecordId: folioType !== FolioType.NON_RESIDENT ? data.stayRecordId : undefined,
      stayDetailId: folioType === FolioType.GUEST ? data.stayDetailId : undefined,
      billToCustomerId: data.billToCustomerId,
      folioType,
      status: FolioStatus.OPEN,
      notes: data.notes
    },
    include: {
      billToCustomer: true,
      reservation: true,
      stayRecord: true,
      stayDetail: true
    }
  });
};

const queryGuestFolios = async (
  filter: Prisma.GuestFolioWhereInput,
  options: {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
  }
): Promise<PaginatedResponse<GuestFolio>> => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const sortBy = options.sortBy ?? 'createdAt';
  const sortType = options.sortType ?? 'desc';

  const [folios, total] = await Promise.all([
    prisma.guestFolio.findMany({
      where: filter,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortType },
      include: {
        billToCustomer: true,
        reservation: true,
        stayRecord: true,
        stayDetail: true
      }
    }),
    prisma.guestFolio.count({ where: filter })
  ]);

  return {
    results: folios,
    meta: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalResults: total
    }
  };
};

const getGuestFolioById = async (id: number): Promise<GuestFolio | null> => {
  return prisma.guestFolio.findUnique({
    where: { id },
    include: {
      billToCustomer: true,
      reservation: true,
      stayRecord: { include: { stayDetails: { include: { room: true } } } },
      stayDetail: { include: { room: true } },
      folioTransactions: {
        orderBy: { transactionDate: 'desc' },
        include: {
          service: true,
          paymentMethod: true,
          promotion: true,
          employee: { select: { id: true, name: true, code: true } }
        }
      }
    }
  });
};

const updateGuestFolio = async (
  id: number,
  updateData: Prisma.GuestFolioUpdateInput
): Promise<GuestFolio> => {
  const folio = await getGuestFolioById(id);
  if (!folio) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Guest folio not found');
  }

  if (folio.status === FolioStatus.CLOSED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update closed folio');
  }

  return prisma.guestFolio.update({
    where: { id },
    data: updateData,
    include: { billToCustomer: true }
  });
};

const closeFolio = async (id: number): Promise<GuestFolio> => {
  const folio = await getGuestFolioById(id);
  if (!folio) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Guest folio not found');
  }

  if (Number(folio.balance) !== 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Folio has outstanding balance');
  }

  return prisma.guestFolio.update({
    where: { id },
    data: { status: FolioStatus.CLOSED }
  });
};

const updateFolioBalance = async (folioId: number): Promise<GuestFolio> => {
  const transactions = await prisma.folioTransaction.findMany({
    where: { guestFolioId: folioId, isVoid: false }
  });

  let totalCharges = 0;
  let totalPayments = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    if (tx.transactionType === TransactionType.DEBIT) {
      totalCharges += amount;
    } else {
      totalPayments += amount;
    }
  }

  return prisma.guestFolio.update({
    where: { id: folioId },
    data: {
      totalCharges,
      totalPayments,
      balance: totalCharges - totalPayments
    }
  });
};

const addTransaction = async (
  folioId: number,
  employeeId: number,
  data: {
    description?: string;
    transactionType: TransactionType;
    category: TransactionCategory;
    amount: number;
    quantity?: number;
    unitPrice?: number;
    serviceId?: number;
    promotionId?: number;
    paymentMethodId?: number;
    stayDetailId?: number;
    postingDate?: Date;
  }
): Promise<FolioTransaction> => {
  const folio = await getGuestFolioById(folioId);
  if (!folio) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Guest folio not found');
  }

  if (folio.status === FolioStatus.CLOSED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot add transaction to closed folio');
  }

  const code = await generateTransactionCode();

  const transaction = await prisma.folioTransaction.create({
    data: {
      code,
      guestFolioId: folioId,
      employeeId,
      description: data.description,
      transactionType: data.transactionType,
      category: data.category,
      amount: data.amount,
      quantity: data.quantity ?? 1,
      unitPrice: data.unitPrice,
      serviceId: data.serviceId,
      promotionId: data.promotionId,
      paymentMethodId: data.paymentMethodId,
      stayDetailId: data.stayDetailId,
      postingDate: data.postingDate ?? new Date()
    },
    include: {
      service: true,
      paymentMethod: true,
      employee: { select: { id: true, name: true, code: true } }
    }
  });

  await updateFolioBalance(folioId);

  return transaction;
};

const addRoomCharge = async (
  folioId: number,
  employeeId: number,
  data: {
    stayDetailId: number;
    amount: number;
    postingDate?: Date;
    description?: string;
  }
): Promise<FolioTransaction> => {
  return addTransaction(folioId, employeeId, {
    transactionType: TransactionType.DEBIT,
    category: TransactionCategory.ROOM_CHARGE,
    amount: data.amount,
    stayDetailId: data.stayDetailId,
    postingDate: data.postingDate,
    description: data.description ?? 'Room charge'
  });
};

const addServiceCharge = async (
  folioId: number,
  employeeId: number,
  data: {
    serviceId: number;
    quantity?: number;
    unitPrice?: number;
    stayDetailId?: number;
    postingDate?: Date;
    description?: string;
  }
): Promise<FolioTransaction> => {
  const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
  if (!service) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Service not found');
  }

  const quantity = data.quantity ?? 1;
  const unitPrice = data.unitPrice ?? Number(service.unitPrice);
  const amount = quantity * unitPrice;

  return addTransaction(folioId, employeeId, {
    transactionType: TransactionType.DEBIT,
    category: TransactionCategory.SERVICE_CHARGE,
    amount,
    quantity,
    unitPrice,
    serviceId: data.serviceId,
    stayDetailId: data.stayDetailId,
    postingDate: data.postingDate,
    description: data.description ?? `${service.name} x ${quantity}`
  });
};

const addPayment = async (
  folioId: number,
  employeeId: number,
  data: {
    amount: number;
    paymentMethodId: number;
    description?: string;
  }
): Promise<FolioTransaction> => {
  const paymentMethod = await prisma.paymentMethod.findUnique({
    where: { id: data.paymentMethodId }
  });
  if (!paymentMethod) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment method not found');
  }

  return addTransaction(folioId, employeeId, {
    transactionType: TransactionType.CREDIT,
    category: TransactionCategory.PAYMENT,
    amount: data.amount,
    paymentMethodId: data.paymentMethodId,
    description: data.description ?? `Payment via ${paymentMethod.name}`
  });
};

const addDeposit = async (
  folioId: number,
  employeeId: number,
  data: {
    amount: number;
    paymentMethodId: number;
    description?: string;
  }
): Promise<FolioTransaction> => {
  return addTransaction(folioId, employeeId, {
    transactionType: TransactionType.CREDIT,
    category: TransactionCategory.DEPOSIT,
    amount: data.amount,
    paymentMethodId: data.paymentMethodId,
    description: data.description ?? 'Deposit'
  });
};

const addRefund = async (
  folioId: number,
  employeeId: number,
  data: {
    amount: number;
    paymentMethodId: number;
    description?: string;
  }
): Promise<FolioTransaction> => {
  return addTransaction(folioId, employeeId, {
    transactionType: TransactionType.DEBIT,
    category: TransactionCategory.REFUND,
    amount: data.amount,
    paymentMethodId: data.paymentMethodId,
    description: data.description ?? 'Refund'
  });
};

const addDiscount = async (
  folioId: number,
  employeeId: number,
  data: {
    amount: number;
    promotionId?: number;
    description?: string;
  }
): Promise<FolioTransaction> => {
  return addTransaction(folioId, employeeId, {
    transactionType: TransactionType.CREDIT,
    category: TransactionCategory.DISCOUNT,
    amount: data.amount,
    promotionId: data.promotionId,
    description: data.description ?? 'Discount'
  });
};

const voidTransaction = async (
  transactionId: number,
  employeeId: number,
  reason: string
): Promise<FolioTransaction> => {
  const transaction = await prisma.folioTransaction.findUnique({
    where: { id: transactionId }
  });

  if (!transaction) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
  }

  if (transaction.isVoid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Transaction already voided');
  }

  const updated = await prisma.folioTransaction.update({
    where: { id: transactionId },
    data: {
      isVoid: true,
      voidReason: reason,
      voidBy: employeeId,
      voidAt: new Date()
    }
  });

  await updateFolioBalance(transaction.guestFolioId);

  return updated;
};

const getFolioSummary = async (folioId: number) => {
  const folio = await getGuestFolioById(folioId);
  if (!folio) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Guest folio not found');
  }

  const transactions = await prisma.folioTransaction.findMany({
    where: { guestFolioId: folioId, isVoid: false },
    include: { service: true, paymentMethod: true }
  });

  const summary = {
    folio,
    totalCharges: Number(folio.totalCharges),
    totalPayments: Number(folio.totalPayments),
    balance: Number(folio.balance),
    breakdown: {
      roomCharges: 0,
      serviceCharges: 0,
      surcharges: 0,
      penalties: 0,
      deposits: 0,
      payments: 0,
      refunds: 0,
      discounts: 0
    },
    transactions
  };

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    switch (tx.category) {
      case TransactionCategory.ROOM_CHARGE:
        summary.breakdown.roomCharges += amount;
        break;
      case TransactionCategory.SERVICE_CHARGE:
        summary.breakdown.serviceCharges += amount;
        break;
      case TransactionCategory.SURCHARGE:
        summary.breakdown.surcharges += amount;
        break;
      case TransactionCategory.PENALTY:
        summary.breakdown.penalties += amount;
        break;
      case TransactionCategory.DEPOSIT:
        summary.breakdown.deposits += amount;
        break;
      case TransactionCategory.PAYMENT:
        summary.breakdown.payments += amount;
        break;
      case TransactionCategory.REFUND:
        summary.breakdown.refunds += amount;
        break;
      case TransactionCategory.DISCOUNT:
        summary.breakdown.discounts += amount;
        break;
    }
  }

  return summary;
};

export default {
  createGuestFolio,
  queryGuestFolios,
  getGuestFolioById,
  updateGuestFolio,
  closeFolio,
  addTransaction,
  addRoomCharge,
  addServiceCharge,
  addPayment,
  addDeposit,
  addRefund,
  addDiscount,
  voidTransaction,
  getFolioSummary
};
