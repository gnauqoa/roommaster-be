import { HousekeepingStatus, RoomStatus } from '@prisma/client';
import Joi from 'joi';

const createHousekeepingLog = {
  body: Joi.object().keys({
    roomId: Joi.number().integer().required(),
    employeeId: Joi.number().integer().required(),
    priority: Joi.number().integer().min(0).max(1).default(0),
    notes: Joi.string().allow('', null)
  })
};

const getHousekeepingLogs = {
  query: Joi.object().keys({
    roomId: Joi.number().integer(),
    employeeId: Joi.number().integer(),
    status: Joi.string().valid(...Object.values(HousekeepingStatus)),
    priority: Joi.number().integer().min(0).max(1),
    fromDate: Joi.date(),
    toDate: Joi.date(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getHousekeepingLog = {
  params: Joi.object().keys({
    logId: Joi.number().integer().required()
  })
};

const updateHousekeepingLog = {
  params: Joi.object().keys({
    logId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      employeeId: Joi.number().integer(),
      priority: Joi.number().integer().min(0).max(1),
      notes: Joi.string().allow('', null)
    })
    .min(1)
};

const startCleaning = {
  params: Joi.object().keys({
    logId: Joi.number().integer().required()
  })
};

const completeCleaning = {
  params: Joi.object().keys({
    logId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    notes: Joi.string().allow('', null)
  })
};

const inspectRoom = {
  params: Joi.object().keys({
    logId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    passed: Joi.boolean().required(),
    notes: Joi.string().allow('', null)
  })
};

const assignHousekeeper = {
  params: Joi.object().keys({
    logId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    employeeId: Joi.number().integer().required()
  })
};

const bulkAssign = {
  body: Joi.object().keys({
    roomIds: Joi.array().items(Joi.number().integer()).min(1).required(),
    employeeId: Joi.number().integer().required(),
    priority: Joi.number().integer().min(0).max(1).default(0)
  })
};

const getPendingRooms = {
  query: Joi.object().keys({
    floor: Joi.number().integer(),
    priority: Joi.number().integer().min(0).max(1),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getMyTasks = {
  query: Joi.object().keys({
    status: Joi.string().valid(...Object.values(HousekeepingStatus)),
    date: Joi.date().default(new Date()),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

export default {
  createHousekeepingLog,
  getHousekeepingLogs,
  getHousekeepingLog,
  updateHousekeepingLog,
  startCleaning,
  completeCleaning,
  inspectRoom,
  assignHousekeeper,
  bulkAssign,
  getPendingRooms,
  getMyTasks
};
