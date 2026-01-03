import { PaymentMethod, TransactionType } from '@prisma/client';
import Joi from 'joi';

// ==================== SERVICE USAGE VALIDATIONS ====================

const createServiceUsage = {
  body: Joi.object().keys({
    bookingId: Joi.string().optional(), // Optional for customers (auto-detected)
    bookingRoomId: Joi.string().optional(),
    serviceId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required()
  })
};

const updateServiceUsage = {
  params: Joi.object().keys({
    id: Joi.string().required()
  }),
  body: Joi.object().keys({
    quantity: Joi.number().integer().min(1).optional(),
    status: Joi.string().valid('PENDING', 'COMPLETED', 'CANCELLED').optional()
  })
};

// ==================== TRANSACTION VALIDATIONS (Employee Only) ====================

const createTransactionWithAllocation = {
  body: Joi.object().keys({
    bookingId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    paymentMethod: Joi.string()
      .valid(...Object.values(PaymentMethod))
      .required(),
    transactionType: Joi.string()
      .valid(...Object.values(TransactionType))
      .required(),
    allocations: Joi.array()
      .items(
        Joi.object().keys({
          bookingRoomId: Joi.string().optional(),
          serviceUsageId: Joi.string().optional(),
          splitAmount: Joi.number().positive().required()
        })
      )
      .min(1)
      .required(),
    transactionRef: Joi.string().optional(),
    description: Joi.string().optional()
  })
};

const getServiceUsages = {
  query: Joi.object().keys({
    bookingId: Joi.string(),
    bookingRoomId: Joi.string(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    sortBy: Joi.string(),
    sortOrder: Joi.string()
  })
};

const deleteServiceUsage = {
  params: Joi.object().keys({
    id: Joi.string().required()
  })
};

export default {
  createServiceUsage,
  updateServiceUsage,
  createTransactionWithAllocation,
  getServiceUsages,
  deleteServiceUsage
};
