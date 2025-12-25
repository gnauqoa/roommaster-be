import Joi from 'joi';
import { password } from './custom.validation';

const createCustomer = {
  body: Joi.object().keys({
    fullName: Joi.string().required().max(100),
    phone: Joi.string().required().max(20),
    password: Joi.string().required().custom(password),
    email: Joi.string().email().optional(),
    idNumber: Joi.string().optional().max(20),
    address: Joi.string().optional()
  })
};

const getCustomers = {
  query: Joi.object().keys({
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().valid('fullName', 'phone', 'email', 'createdAt', 'updatedAt').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

const getCustomer = {
  params: Joi.object().keys({
    customerId: Joi.string().required()
  })
};

const updateCustomer = {
  params: Joi.object().keys({
    customerId: Joi.string().required()
  }),
  body: Joi.object()
    .keys({
      fullName: Joi.string().max(100),
      email: Joi.string().email(),
      idNumber: Joi.string().max(20),
      address: Joi.string()
    })
    .min(1)
};

const deleteCustomer = {
  params: Joi.object().keys({
    customerId: Joi.string().required()
  })
};

const register = {
  body: Joi.object().keys({
    fullName: Joi.string().required().max(100),
    phone: Joi.string().required().max(20),
    password: Joi.string().required().custom(password),
    email: Joi.string().email().optional(),
    idNumber: Joi.string().optional().max(20),
    address: Joi.string().optional()
  })
};

const login = {
  body: Joi.object().keys({
    phone: Joi.string().required(),
    password: Joi.string().required()
  })
};

const forgotPassword = {
  body: Joi.object().keys({
    phone: Joi.string().required()
  })
};

const updateProfile = {
  body: Joi.object()
    .keys({
      fullName: Joi.string().max(100),
      email: Joi.string().email(),
      idNumber: Joi.string().max(20),
      address: Joi.string()
    })
    .min(1)
};

export default {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  register,
  login,
  forgotPassword,
  updateProfile
};
