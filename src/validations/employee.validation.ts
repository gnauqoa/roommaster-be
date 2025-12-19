import Joi from 'joi';
import { password, phoneNumber } from './custom.validation';

const createEmployee = {
  body: Joi.object().keys({
    code: Joi.string().required().max(20),
    name: Joi.string().required().max(100),
    email: Joi.string().required().email().max(255),
    phone: Joi.string().custom(phoneNumber).max(20),
    userGroupId: Joi.number().integer(),
    password: Joi.string().required().custom(password),
    isActive: Joi.boolean().default(true)
  })
};

const getEmployees = {
  query: Joi.object().keys({
    code: Joi.string(),
    name: Joi.string(),
    email: Joi.string(),
    userGroupId: Joi.number().integer(),
    isActive: Joi.boolean(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getEmployee = {
  params: Joi.object().keys({
    employeeId: Joi.number().integer().required()
  })
};

const updateEmployee = {
  params: Joi.object().keys({
    employeeId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      code: Joi.string().max(20),
      name: Joi.string().max(100),
      email: Joi.string().email().max(255),
      phone: Joi.string().custom(phoneNumber).max(20),
      userGroupId: Joi.number().integer().allow(null),
      password: Joi.string().custom(password),
      isActive: Joi.boolean()
    })
    .min(1)
};

const deleteEmployee = {
  params: Joi.object().keys({
    employeeId: Joi.number().integer().required()
  })
};

export default {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee
};
