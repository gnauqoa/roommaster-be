import Joi from 'joi';
import { ActivityType } from '@prisma/client';

const getActivities = {
  query: Joi.object().keys({
    type: Joi.string()
      .valid(...Object.values(ActivityType))
      .optional(),
    customerId: Joi.string().optional(),
    employeeId: Joi.string().optional(),
    bookingRoomId: Joi.string().optional(),
    serviceUsageId: Joi.string().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().valid('createdAt', 'type', 'updatedAt').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  })
};

const getActivity = {
  params: Joi.object().keys({
    activityId: Joi.string().required()
  })
};

export default {
  getActivities,
  getActivity
};
