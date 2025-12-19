import { RoomStatus } from '@prisma/client';
import Joi from 'joi';

const createRoomType = {
  body: Joi.object().keys({
    code: Joi.string().required().max(20),
    name: Joi.string().required().max(100),
    baseCapacity: Joi.number().integer().required().min(1),
    maxCapacity: Joi.number().integer().required().min(1),
    amenities: Joi.string().allow('', null),
    rackRate: Joi.number().required().positive(),
    extraPersonFee: Joi.number().min(0).default(0),
    description: Joi.string().allow('', null)
  })
};

const getRoomTypes = {
  query: Joi.object().keys({
    code: Joi.string(),
    name: Joi.string(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getRoomType = {
  params: Joi.object().keys({
    roomTypeId: Joi.number().integer().required()
  })
};

const updateRoomType = {
  params: Joi.object().keys({
    roomTypeId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      code: Joi.string().max(20),
      name: Joi.string().max(100),
      baseCapacity: Joi.number().integer().min(1),
      maxCapacity: Joi.number().integer().min(1),
      amenities: Joi.string().allow('', null),
      rackRate: Joi.number().positive(),
      extraPersonFee: Joi.number().min(0),
      description: Joi.string().allow('', null)
    })
    .min(1)
};

const deleteRoomType = {
  params: Joi.object().keys({
    roomTypeId: Joi.number().integer().required()
  })
};

// Room validations
const createRoom = {
  body: Joi.object().keys({
    code: Joi.string().required().max(20),
    name: Joi.string().required().max(100),
    floor: Joi.number().integer().allow(null),
    roomTypeId: Joi.number().integer().required(),
    status: Joi.string()
      .valid(...Object.values(RoomStatus))
      .default(RoomStatus.AVAILABLE),
    notes: Joi.string().allow('', null)
  })
};

const getRooms = {
  query: Joi.object().keys({
    code: Joi.string(),
    name: Joi.string(),
    floor: Joi.number().integer(),
    roomTypeId: Joi.number().integer(),
    status: Joi.string().valid(...Object.values(RoomStatus)),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getRoom = {
  params: Joi.object().keys({
    roomId: Joi.number().integer().required()
  })
};

const updateRoom = {
  params: Joi.object().keys({
    roomId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      code: Joi.string().max(20),
      name: Joi.string().max(100),
      floor: Joi.number().integer().allow(null),
      roomTypeId: Joi.number().integer(),
      status: Joi.string().valid(...Object.values(RoomStatus)),
      notes: Joi.string().allow('', null)
    })
    .min(1)
};

const deleteRoom = {
  params: Joi.object().keys({
    roomId: Joi.number().integer().required()
  })
};

const updateRoomStatus = {
  params: Joi.object().keys({
    roomId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    status: Joi.string()
      .valid(...Object.values(RoomStatus))
      .required()
  })
};

const getAvailableRooms = {
  query: Joi.object().keys({
    checkInDate: Joi.date().required(),
    checkOutDate: Joi.date().required().greater(Joi.ref('checkInDate')),
    roomTypeId: Joi.number().integer(),
    numberOfGuests: Joi.number().integer().min(1)
  })
};

export default {
  createRoomType,
  getRoomTypes,
  getRoomType,
  updateRoomType,
  deleteRoomType,
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
  getAvailableRooms
};
