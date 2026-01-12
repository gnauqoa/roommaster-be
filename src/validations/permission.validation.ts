import Joi from 'joi';
import { PermissionType } from '@prisma/client';

const getPermissions = {
  query: Joi.object().keys({
    search: Joi.string().optional(),
    type: Joi.string()
      .valid(...Object.values(PermissionType))
      .optional(),
    subject: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(500).optional(),
    sortBy: Joi.string()
      .valid('name', 'type', 'subject', 'action', 'createdAt', 'updatedAt')
      .optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

const getPermission = {
  params: Joi.object().keys({
    permissionId: Joi.string().required()
  })
};

export default {
  getPermissions,
  getPermission
};
