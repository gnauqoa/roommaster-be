import Joi from 'joi';
import { password } from './common.validation';

const createEmployee = {
  body: Joi.object().keys({
    name: Joi.string().required().max(100),
    username: Joi.string().required().max(50),
    password: Joi.string().required().custom(password),
    roleId: Joi.string().required().messages({
      'any.required': 'Role is required',
      'string.empty': 'Role cannot be empty'
    })
  })
};

const getEmployees = {
  query: Joi.object().keys({
    search: Joi.string().optional(),
    roleId: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().valid('name', 'username', 'roleId', 'createdAt', 'updatedAt').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

const getEmployee = {
  params: Joi.object().keys({
    employeeId: Joi.string().required()
  })
};

const updateEmployee = {
  params: Joi.object().keys({
    employeeId: Joi.string().required()
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().max(100),
      roleId: Joi.string()
    })
    .min(1)
};

const deleteEmployee = {
  params: Joi.object().keys({
    employeeId: Joi.string().required()
  })
};

const login = {
  body: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().required()
  })
};

const forgotPassword = {
  body: Joi.object().keys({
    username: Joi.string().required()
  })
};

const updateProfile = {
  body: Joi.object()
    .keys({
      name: Joi.string().max(100)
    })
    .min(1)
};

export default {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  login,
  forgotPassword,
  updateProfile
};
