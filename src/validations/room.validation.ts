import Joi from 'joi';
import { RoomStatus } from '@prisma/client';

const createRoom = {
  body: Joi.object().keys({
    roomNumber: Joi.string().required().max(50),
    floor: Joi.number().integer().required(),
    code: Joi.string().optional().max(50),
    roomTypeId: Joi.string().required(),
    status: Joi.string()
      .valid(...Object.values(RoomStatus))
      .optional()
  })
};

const getRooms = {
  query: Joi.object().keys({
    search: Joi.string().optional(),
    status: Joi.string()
      .valid(...Object.values(RoomStatus))
      .optional(),
    floor: Joi.number().integer().optional(),
    roomTypeId: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string()
      .valid('roomNumber', 'floor', 'status', 'createdAt', 'updatedAt')
      .optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

const getRoom = {
  params: Joi.object().keys({
    roomId: Joi.string().required()
  })
};

const updateRoom = {
  params: Joi.object().keys({
    roomId: Joi.string().required()
  }),
  body: Joi.object()
    .keys({
      roomNumber: Joi.string().max(50),
      floor: Joi.number().integer(),
      code: Joi.string().max(50),
      roomTypeId: Joi.string(),
      status: Joi.string().valid(...Object.values(RoomStatus))
    })
    .min(1)
};

const deleteRoom = {
  params: Joi.object().keys({
    roomId: Joi.string().required()
  })
};

const searchRooms = {
  query: Joi.object().keys({
    search: Joi.string().optional(),
    floor: Joi.number().integer().optional(),
    roomTypeId: Joi.string().optional(),
    minCapacity: Joi.number().integer().min(1).optional(),
    maxCapacity: Joi.number().integer().min(1).optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().valid('roomNumber', 'floor', 'code', 'createdAt', 'updatedAt').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

export default {
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  searchRooms
};
