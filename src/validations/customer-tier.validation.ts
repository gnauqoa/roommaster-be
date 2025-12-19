import Joi from 'joi';

const createCustomerTier = {
  body: Joi.object().keys({
    code: Joi.string().max(20).required(),
    name: Joi.string().max(100).required(),
    pointsRequired: Joi.number().integer().min(0).default(0),
    roomDiscountFactor: Joi.number().min(0).max(100).default(0),
    serviceDiscountFactor: Joi.number().min(0).max(100).default(0)
  })
};

const getCustomerTiers = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getCustomerTier = {
  params: Joi.object().keys({
    tierId: Joi.number().integer().required()
  })
};

const updateCustomerTier = {
  params: Joi.object().keys({
    tierId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().max(100),
      pointsRequired: Joi.number().integer().min(0),
      roomDiscountFactor: Joi.number().min(0).max(100),
      serviceDiscountFactor: Joi.number().min(0).max(100)
    })
    .min(1)
};

const deleteCustomerTier = {
  params: Joi.object().keys({
    tierId: Joi.number().integer().required()
  })
};

const checkUpgrade = {
  params: Joi.object().keys({
    customerId: Joi.number().integer().required()
  })
};

export default {
  createCustomerTier,
  getCustomerTiers,
  getCustomerTier,
  updateCustomerTier,
  deleteCustomerTier,
  checkUpgrade
};
