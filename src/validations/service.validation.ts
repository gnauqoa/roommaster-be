import Joi from 'joi';

const createService = {
  body: Joi.object().keys({
    name: Joi.string().required().max(100),
    price: Joi.number().min(0).required(),
    unit: Joi.string().max(50).optional(),
    isActive: Joi.boolean().optional()
  })
};

const getServices = {
  query: Joi.object().keys({
    search: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string()
      .valid('name', 'price', 'unit', 'isActive', 'createdAt', 'updatedAt')
      .optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

const getService = {
  params: Joi.object().keys({
    serviceId: Joi.string().required()
  })
};

const updateService = {
  params: Joi.object().keys({
    serviceId: Joi.string().required()
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().max(100),
      price: Joi.number().min(0),
      unit: Joi.string().max(50),
      isActive: Joi.boolean()
    })
    .min(1)
};

const deleteService = {
  params: Joi.object().keys({
    serviceId: Joi.string().required()
  })
};

export default {
  createService,
  getServices,
  getService,
  updateService,
  deleteService
};
