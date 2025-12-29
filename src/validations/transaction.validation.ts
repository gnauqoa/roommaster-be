import { PaymentMethod, TransactionType, TransactionStatus } from '@prisma/client';
import Joi from 'joi';

const promotionApplication = Joi.object({
  customerPromotionId: Joi.string().required(),
  bookingRoomId: Joi.string().optional(),
  serviceUsageId: Joi.string().optional()
});

const createTransaction = {
  body: Joi.object().keys({
    bookingId: Joi.string().optional(),
    bookingRoomIds: Joi.array().items(Joi.string()).optional(),
    serviceUsageId: Joi.string().optional(),
    paymentMethod: Joi.string()
      .valid(...Object.values(PaymentMethod))
      .required(),
    transactionType: Joi.string()
      .valid(...Object.values(TransactionType))
      .required(),
    transactionRef: Joi.string().optional(),
    description: Joi.string().optional(),
    promotionApplications: Joi.array().items(promotionApplication).optional()
  })
};

const getTransactions = {
  query: Joi.object().keys({
    // Pagination
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'occurredAt', 'amount').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),

    // Filters
    bookingId: Joi.string().optional(),
    status: Joi.string()
      .valid(...Object.values(TransactionStatus))
      .optional(),
    type: Joi.string()
      .valid(...Object.values(TransactionType))
      .optional(),
    method: Joi.string()
      .valid(...Object.values(PaymentMethod))
      .optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    search: Joi.string().optional()
  })
};

const getTransactionById = {
  params: Joi.object().keys({
    transactionId: Joi.string().required()
  })
};

const getTransactionDetails = {
  query: Joi.object().keys({
    // Pagination
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string()
      .valid('createdAt', 'baseAmount', 'amount', 'discountAmount')
      .default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),

    // Filters
    transactionId: Joi.string().optional(),
    bookingRoomId: Joi.string().optional(),
    serviceUsageId: Joi.string().optional(),
    minBaseAmount: Joi.number().min(0).optional(),
    maxBaseAmount: Joi.number().min(0).optional(),
    minAmount: Joi.number().min(0).optional(),
    maxAmount: Joi.number().min(0).optional(),
    minDiscountAmount: Joi.number().min(0).optional(),
    maxDiscountAmount: Joi.number().min(0).optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional()
  })
};

export default {
  createTransaction,
  getTransactions,
  getTransactionById,
  getTransactionDetails
};
