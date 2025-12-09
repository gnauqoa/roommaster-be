import Joi from 'joi';

// System Parameter validations
const createSystemParameter = {
  body: Joi.object().keys({
    name: Joi.string().required().max(100),
    value: Joi.string().required(),
    description: Joi.string().allow('', null)
  })
};

const getSystemParameters = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getSystemParameter = {
  params: Joi.object().keys({
    parameterId: Joi.number().integer().required()
  })
};

const getSystemParameterByName = {
  params: Joi.object().keys({
    name: Joi.string().required()
  })
};

const updateSystemParameter = {
  params: Joi.object().keys({
    parameterId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().max(100),
      value: Joi.string(),
      description: Joi.string().allow('', null)
    })
    .min(1)
};

const deleteSystemParameter = {
  params: Joi.object().keys({
    parameterId: Joi.number().integer().required()
  })
};

// User Group validations
const createUserGroup = {
  body: Joi.object().keys({
    code: Joi.string().required().max(20),
    name: Joi.string().required().max(100),
    description: Joi.string().allow('', null)
  })
};

const getUserGroups = {
  query: Joi.object().keys({
    code: Joi.string(),
    name: Joi.string(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getUserGroup = {
  params: Joi.object().keys({
    groupId: Joi.number().integer().required()
  })
};

const updateUserGroup = {
  params: Joi.object().keys({
    groupId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      code: Joi.string().max(20),
      name: Joi.string().max(100),
      description: Joi.string().allow('', null)
    })
    .min(1)
};

const deleteUserGroup = {
  params: Joi.object().keys({
    groupId: Joi.number().integer().required()
  })
};

// System Function validations
const createSystemFunction = {
  body: Joi.object().keys({
    code: Joi.string().required().max(50),
    name: Joi.string().required().max(100),
    functionKey: Joi.string().required().max(100)
  })
};

const getSystemFunctions = {
  query: Joi.object().keys({
    code: Joi.string(),
    name: Joi.string(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getSystemFunction = {
  params: Joi.object().keys({
    functionId: Joi.number().integer().required()
  })
};

const updateSystemFunction = {
  params: Joi.object().keys({
    functionId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      code: Joi.string().max(50),
      name: Joi.string().max(100),
      functionKey: Joi.string().max(100)
    })
    .min(1)
};

const deleteSystemFunction = {
  params: Joi.object().keys({
    functionId: Joi.number().integer().required()
  })
};

// Permission validations
const assignPermission = {
  body: Joi.object().keys({
    groupId: Joi.number().integer().required(),
    functionId: Joi.number().integer().required()
  })
};

const getPermissions = {
  query: Joi.object().keys({
    groupId: Joi.number().integer(),
    functionId: Joi.number().integer(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const removePermission = {
  params: Joi.object().keys({
    permissionId: Joi.number().integer().required()
  })
};

const bulkAssignPermissions = {
  body: Joi.object().keys({
    groupId: Joi.number().integer().required(),
    functionIds: Joi.array().items(Joi.number().integer()).min(1).required()
  })
};

const getGroupPermissions = {
  params: Joi.object().keys({
    groupId: Joi.number().integer().required()
  })
};

export default {
  createSystemParameter,
  getSystemParameters,
  getSystemParameter,
  getSystemParameterByName,
  updateSystemParameter,
  deleteSystemParameter,
  createUserGroup,
  getUserGroups,
  getUserGroup,
  updateUserGroup,
  deleteUserGroup,
  createSystemFunction,
  getSystemFunctions,
  getSystemFunction,
  updateSystemFunction,
  deleteSystemFunction,
  assignPermission,
  getPermissions,
  removePermission,
  bulkAssignPermissions,
  getGroupPermissions
};
