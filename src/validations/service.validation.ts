import { ServiceGroup } from '@prisma/client';
import Joi from 'joi';

const createService = {
  body: Joi.object().keys({
    code: Joi.string().required().max(20),
    name: Joi.string().required().max(100),
    unitPrice: Joi.number().positive().required(),
    unit: Joi.string().max(50).allow('', null),
    serviceGroup: Joi.string()
      .valid(...Object.values(ServiceGroup))
      .default(ServiceGroup.OTHER),
    allowPromotion: Joi.boolean().default(true),
    allowDiscount: Joi.boolean().default(true),
    isActive: Joi.boolean().default(true),
    notes: Joi.string().allow('', null)
  })
};

const getServices = {
  query: Joi.object().keys({
    code: Joi.string(),
    name: Joi.string(),
    serviceGroup: Joi.string().valid(...Object.values(ServiceGroup)),
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getService = {
  params: Joi.object().keys({
    serviceId: Joi.number().integer().required()
  })
};

const updateService = {
  params: Joi.object().keys({
    serviceId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      code: Joi.string().max(20),
      name: Joi.string().max(100),
      unitPrice: Joi.number().positive(),
      unit: Joi.string().max(50).allow('', null),
      serviceGroup: Joi.string().valid(...Object.values(ServiceGroup)),
      allowPromotion: Joi.boolean(),
      allowDiscount: Joi.boolean(),
      isActive: Joi.boolean(),
      notes: Joi.string().allow('', null)
    })
    .min(1)
};

const deleteService = {
  params: Joi.object().keys({
    serviceId: Joi.number().integer().required()
  })
};

// Payment Method validations
const createPaymentMethod = {
  body: Joi.object().keys({
    code: Joi.string().required().max(20),
    name: Joi.string().required().max(100),
    transactionFee: Joi.number().min(0).allow(null)
  })
};

const getPaymentMethods = {
  query: Joi.object().keys({
    code: Joi.string(),
    name: Joi.string(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getPaymentMethod = {
  params: Joi.object().keys({
    paymentMethodId: Joi.number().integer().required()
  })
};

const updatePaymentMethod = {
  params: Joi.object().keys({
    paymentMethodId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      code: Joi.string().max(20),
      name: Joi.string().max(100),
      transactionFee: Joi.number().min(0).allow(null)
    })
    .min(1)
};

const deletePaymentMethod = {
  params: Joi.object().keys({
    paymentMethodId: Joi.number().integer().required()
  })
};

export default {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  createPaymentMethod,
  getPaymentMethods,
  getPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
};
