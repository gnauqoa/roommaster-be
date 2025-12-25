import Joi from 'joi';

const createHotelService = {
  body: Joi.object().keys({
    name: Joi.string().required().max(100),
    price: Joi.number().min(0).required(),
    unit: Joi.string().max(50).optional(),
    isActive: Joi.boolean().optional()
  })
};

const getHotelServices = {
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

const getHotelService = {
  params: Joi.object().keys({
    serviceId: Joi.string().required()
  })
};

const updateHotelService = {
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

const deleteHotelService = {
  params: Joi.object().keys({
    serviceId: Joi.string().required()
  })
};

export default {
  createHotelService,
  getHotelServices,
  getHotelService,
  updateHotelService,
  deleteHotelService
};
