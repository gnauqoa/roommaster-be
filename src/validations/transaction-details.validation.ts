import Joi from 'joi';

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
  getTransactionDetails
};
