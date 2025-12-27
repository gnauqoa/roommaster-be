import Joi from 'joi';

const createRoomType = {
  body: Joi.object().keys({
    name: Joi.string().required().max(100),
    capacity: Joi.number().integer().min(1).required(),
    pricePerNight: Joi.number().min(0).required(),
    amenities: Joi.object().optional()
  })
};

const getRoomTypes = {
  query: Joi.object().keys({
    search: Joi.string().optional(),
    minCapacity: Joi.number().integer().min(1).optional(),
    maxCapacity: Joi.number().integer().min(1).optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string()
      .valid('name', 'capacity', 'pricePerNight', 'createdAt', 'updatedAt')
      .optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

const getRoomType = {
  params: Joi.object().keys({
    roomTypeId: Joi.string().required()
  })
};

const updateRoomType = {
  params: Joi.object().keys({
    roomTypeId: Joi.string().required()
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().max(100),
      capacity: Joi.number().integer().min(1),
      pricePerNight: Joi.number().min(0),
      amenities: Joi.object()
    })
    .min(1)
};

const deleteRoomType = {
  params: Joi.object().keys({
    roomTypeId: Joi.string().required()
  })
};

export default {
  createRoomType,
  getRoomTypes,
  getRoomType,
  updateRoomType,
  deleteRoomType
};
