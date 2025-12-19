import { FolioType, FolioStatus, TransactionType, TransactionCategory } from '@prisma/client';
import Joi from 'joi';

// Guest Folio validations
const createGuestFolio = {
  body: Joi.object().keys({
    reservationId: Joi.number().integer().allow(null),
    stayRecordId: Joi.number().integer().allow(null),
    stayDetailId: Joi.number().integer().allow(null),
    billToCustomerId: Joi.number().integer().required(),
    folioType: Joi.string()
      .valid(...Object.values(FolioType))
      .default(FolioType.GUEST),
    notes: Joi.string().allow('', null)
  })
};

const getGuestFolios = {
  query: Joi.object().keys({
    code: Joi.string(),
    reservationId: Joi.number().integer(),
    stayRecordId: Joi.number().integer(),
    stayDetailId: Joi.number().integer(),
    billToCustomerId: Joi.number().integer(),
    folioType: Joi.string().valid(...Object.values(FolioType)),
    status: Joi.string().valid(...Object.values(FolioStatus)),
    fromDate: Joi.date(),
    toDate: Joi.date(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getGuestFolio = {
  params: Joi.object().keys({
    folioId: Joi.number().integer().required()
  })
};

const updateGuestFolio = {
  params: Joi.object().keys({
    folioId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      billToCustomerId: Joi.number().integer(),
      notes: Joi.string().allow('', null)
    })
    .min(1)
};

const closeFolio = {
  params: Joi.object().keys({
    folioId: Joi.number().integer().required()
  })
};

// Folio Transaction validations
const addTransaction = {
  params: Joi.object().keys({
    folioId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    description: Joi.string().allow('', null),
    transactionType: Joi.string()
      .valid(...Object.values(TransactionType))
      .required(),
    category: Joi.string()
      .valid(...Object.values(TransactionCategory))
      .required(),
    amount: Joi.number().positive().required(),
    quantity: Joi.number().integer().min(1).default(1),
    unitPrice: Joi.number().positive().allow(null),
    serviceId: Joi.number().integer().allow(null),
    promotionId: Joi.number().integer().allow(null),
    paymentMethodId: Joi.number().integer().allow(null),
    stayDetailId: Joi.number().integer().allow(null),
    postingDate: Joi.date().default(new Date())
  })
};

const addRoomCharge = {
  params: Joi.object().keys({
    folioId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    stayDetailId: Joi.number().integer().required(),
    amount: Joi.number().positive().required(),
    postingDate: Joi.date().default(new Date()),
    description: Joi.string().allow('', null)
  })
};

const addServiceCharge = {
  params: Joi.object().keys({
    folioId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    serviceId: Joi.number().integer().required(),
    quantity: Joi.number().integer().min(1).default(1),
    unitPrice: Joi.number().positive().allow(null),
    stayDetailId: Joi.number().integer().allow(null),
    postingDate: Joi.date().default(new Date()),
    description: Joi.string().allow('', null)
  })
};

const addPayment = {
  params: Joi.object().keys({
    folioId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    amount: Joi.number().positive().required(),
    paymentMethodId: Joi.number().integer().required(),
    description: Joi.string().allow('', null)
  })
};

const addDeposit = {
  params: Joi.object().keys({
    folioId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    amount: Joi.number().positive().required(),
    paymentMethodId: Joi.number().integer().required(),
    description: Joi.string().allow('', null)
  })
};

const addRefund = {
  params: Joi.object().keys({
    folioId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    amount: Joi.number().positive().required(),
    paymentMethodId: Joi.number().integer().required(),
    description: Joi.string().allow('', null)
  })
};

const addDiscount = {
  params: Joi.object().keys({
    folioId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    amount: Joi.number().positive().required(),
    promotionId: Joi.number().integer().allow(null),
    description: Joi.string().allow('', null)
  })
};

const voidTransaction = {
  params: Joi.object().keys({
    folioId: Joi.number().integer().required(),
    transactionId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    reason: Joi.string().required()
  })
};

const getTransactions = {
  params: Joi.object().keys({
    folioId: Joi.number().integer().required()
  }),
  query: Joi.object().keys({
    transactionType: Joi.string().valid(...Object.values(TransactionType)),
    category: Joi.string().valid(...Object.values(TransactionCategory)),
    fromDate: Joi.date(),
    toDate: Joi.date(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const transferTransaction = {
  params: Joi.object().keys({
    folioId: Joi.number().integer().required(),
    transactionId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    targetFolioId: Joi.number().integer().required()
  })
};

const getFolioSummary = {
  params: Joi.object().keys({
    folioId: Joi.number().integer().required()
  })
};

export default {
  createGuestFolio,
  getGuestFolios,
  getGuestFolio,
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
  getTransactions,
  transferTransaction,
  getFolioSummary
};
