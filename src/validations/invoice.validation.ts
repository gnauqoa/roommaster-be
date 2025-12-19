import Joi from 'joi';

const createInvoice = {
  body: Joi.object().keys({
    guestFolioId: Joi.number().integer().required(),
    invoiceToCustomerId: Joi.number().integer().required(),
    taxId: Joi.string().max(50).allow('', null),
    transactionIds: Joi.array().items(Joi.number().integer()).min(1).required()
  })
};

const getInvoices = {
  query: Joi.object().keys({
    code: Joi.string(),
    guestFolioId: Joi.number().integer(),
    invoiceToCustomerId: Joi.number().integer(),
    employeeId: Joi.number().integer(),
    fromDate: Joi.date(),
    toDate: Joi.date(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getInvoice = {
  params: Joi.object().keys({
    invoiceId: Joi.number().integer().required()
  })
};

const voidInvoice = {
  params: Joi.object().keys({
    invoiceId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    reason: Joi.string().required()
  })
};

const printInvoice = {
  params: Joi.object().keys({
    invoiceId: Joi.number().integer().required()
  })
};

const getDailyRevenue = {
  query: Joi.object().keys({
    date: Joi.date().default(new Date())
  })
};

const getRevenueReport = {
  query: Joi.object().keys({
    fromDate: Joi.date().required(),
    toDate: Joi.date().required(),
    groupBy: Joi.string().valid('day', 'week', 'month').default('day')
  })
};

const getOccupancyReport = {
  query: Joi.object().keys({
    fromDate: Joi.date().required(),
    toDate: Joi.date().required(),
    roomTypeId: Joi.number().integer()
  })
};

export default {
  createInvoice,
  getInvoices,
  getInvoice,
  voidInvoice,
  printInvoice,
  getDailyRevenue,
  getRevenueReport,
  getOccupancyReport
};
