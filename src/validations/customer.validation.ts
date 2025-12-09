import { CustomerType } from '@prisma/client';
import Joi from 'joi';
import { phoneNumber } from './custom.validation';

const createCustomer = {
  body: Joi.object().keys({
    code: Joi.string().required().max(20),
    tierId: Joi.number().integer().allow(null),
    fullName: Joi.string().required().max(200),
    phone: Joi.string().custom(phoneNumber).max(20),
    email: Joi.string().email().max(255),
    idNumber: Joi.string().max(50),
    nationality: Joi.string().max(100),
    address: Joi.string().allow('', null),
    customerType: Joi.string()
      .valid(...Object.values(CustomerType))
      .default(CustomerType.INDIVIDUAL)
  })
};

const getCustomers = {
  query: Joi.object().keys({
    code: Joi.string(),
    fullName: Joi.string(),
    phone: Joi.string(),
    email: Joi.string(),
    idNumber: Joi.string(),
    customerType: Joi.string().valid(...Object.values(CustomerType)),
    tierId: Joi.number().integer(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getCustomer = {
  params: Joi.object().keys({
    customerId: Joi.number().integer().required()
  })
};

const updateCustomer = {
  params: Joi.object().keys({
    customerId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      code: Joi.string().max(20),
      tierId: Joi.number().integer().allow(null),
      fullName: Joi.string().max(200),
      phone: Joi.string().custom(phoneNumber).max(20),
      email: Joi.string().email().max(255),
      idNumber: Joi.string().max(50),
      nationality: Joi.string().max(100),
      address: Joi.string().allow('', null),
      customerType: Joi.string().valid(...Object.values(CustomerType)),
      loyaltyPoints: Joi.number().integer().min(0)
    })
    .min(1)
};

const deleteCustomer = {
  params: Joi.object().keys({
    customerId: Joi.number().integer().required()
  })
};

const searchCustomers = {
  query: Joi.object().keys({
    q: Joi.string().required().min(2),
    limit: Joi.number().integer().min(1).max(20).default(10)
  })
};

// Customer Tier validations
const createCustomerTier = {
  body: Joi.object().keys({
    code: Joi.string().required().max(20),
    name: Joi.string().required().max(100),
    pointsRequired: Joi.number().integer().min(0).default(0),
    roomDiscountFactor: Joi.number().min(0).max(100).required(),
    serviceDiscountFactor: Joi.number().min(0).max(100).required()
  })
};

const getCustomerTiers = {
  query: Joi.object().keys({
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
      code: Joi.string().max(20),
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

export default {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  createCustomerTier,
  getCustomerTiers,
  getCustomerTier,
  updateCustomerTier,
  deleteCustomerTier
};
