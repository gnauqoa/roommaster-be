import { ShiftSessionStatus } from '@prisma/client';
import Joi from 'joi';

// Work Shift validations
const createWorkShift = {
  body: Joi.object().keys({
    code: Joi.string().required().max(20),
    name: Joi.string().required().max(100),
    startTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required(),
    endTime: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
  })
};

const getWorkShifts = {
  query: Joi.object().keys({
    code: Joi.string(),
    name: Joi.string(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getWorkShift = {
  params: Joi.object().keys({
    shiftId: Joi.number().integer().required()
  })
};

const updateWorkShift = {
  params: Joi.object().keys({
    shiftId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      code: Joi.string().max(20),
      name: Joi.string().max(100),
      startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    })
    .min(1)
};

const deleteWorkShift = {
  params: Joi.object().keys({
    shiftId: Joi.number().integer().required()
  })
};

// Work Schedule validations
const createWorkSchedule = {
  body: Joi.object().keys({
    employeeId: Joi.number().integer().required(),
    shiftId: Joi.number().integer().required(),
    workDate: Joi.date().required()
  })
};

const getWorkSchedules = {
  query: Joi.object().keys({
    employeeId: Joi.number().integer(),
    shiftId: Joi.number().integer(),
    fromDate: Joi.date(),
    toDate: Joi.date(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getWorkSchedule = {
  params: Joi.object().keys({
    scheduleId: Joi.number().integer().required()
  })
};

const updateWorkSchedule = {
  params: Joi.object().keys({
    scheduleId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      employeeId: Joi.number().integer(),
      shiftId: Joi.number().integer(),
      workDate: Joi.date()
    })
    .min(1)
};

const deleteWorkSchedule = {
  params: Joi.object().keys({
    scheduleId: Joi.number().integer().required()
  })
};

const bulkCreateSchedules = {
  body: Joi.object().keys({
    schedules: Joi.array()
      .items(
        Joi.object().keys({
          employeeId: Joi.number().integer().required(),
          shiftId: Joi.number().integer().required(),
          workDate: Joi.date().required()
        })
      )
      .min(1)
      .required()
  })
};

// Shift Session validations
const openShiftSession = {
  body: Joi.object().keys({
    shiftId: Joi.number().integer().required(),
    openingBalance: Joi.number().min(0).required(),
    notes: Joi.string().allow('', null)
  })
};

const getShiftSessions = {
  query: Joi.object().keys({
    employeeId: Joi.number().integer(),
    shiftId: Joi.number().integer(),
    status: Joi.string().valid(...Object.values(ShiftSessionStatus)),
    fromDate: Joi.date(),
    toDate: Joi.date(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getShiftSession = {
  params: Joi.object().keys({
    sessionId: Joi.number().integer().required()
  })
};

const closeShiftSession = {
  params: Joi.object().keys({
    sessionId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    closingBalance: Joi.number().min(0).required(),
    notes: Joi.string().allow('', null)
  })
};

const approveShiftSession = {
  params: Joi.object().keys({
    sessionId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    notes: Joi.string().allow('', null)
  })
};

const getMyCurrentSession = {
  query: Joi.object().keys({})
};

export default {
  createWorkShift,
  getWorkShifts,
  getWorkShift,
  updateWorkShift,
  deleteWorkShift,
  createWorkSchedule,
  getWorkSchedules,
  getWorkSchedule,
  updateWorkSchedule,
  deleteWorkSchedule,
  bulkCreateSchedules,
  openShiftSession,
  getShiftSessions,
  getShiftSession,
  closeShiftSession,
  approveShiftSession,
  getMyCurrentSession
};
