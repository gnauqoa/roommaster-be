import Joi from 'joi';
import { RoomStatus } from '@prisma/client';

const createRoom = {
  body: Joi.object().keys({
    roomNumber: Joi.string().required().max(50),
    floor: Joi.number().integer().required(),
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

export default {
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom
};
