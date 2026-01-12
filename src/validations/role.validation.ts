import Joi from 'joi';

const createRole = {
  body: Joi.object().keys({
    name: Joi.string().required().max(50).messages({
      'any.required': 'Role name is required',
      'string.empty': 'Role name cannot be empty',
      'string.max': 'Role name cannot exceed 50 characters'
    }),
    description: Joi.string().optional().max(255),
    permissionIds: Joi.array().items(Joi.string()).optional()
  })
};

const getRoles = {
  query: Joi.object().keys({
    search: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string()
      .valid('name', 'description', 'isActive', 'createdAt', 'updatedAt')
      .optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

const getRole = {
  params: Joi.object().keys({
    roleId: Joi.string().required()
  })
};

const updateRole = {
  params: Joi.object().keys({
    roleId: Joi.string().required()
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().max(50),
      description: Joi.string().max(255),
      isActive: Joi.boolean(),
      permissionIds: Joi.array().items(Joi.string())
    })
    .min(1)
};

const deleteRole = {
  params: Joi.object().keys({
    roleId: Joi.string().required()
  })
};

const getRolePermissions = {
  params: Joi.object().keys({
    roleId: Joi.string().required()
  })
};

export default {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
  getRolePermissions
};
