import { PromotionType, PromotionScope } from '@prisma/client';
import Joi from 'joi';

const createPromotion = {
  body: Joi.object().keys({
    code: Joi.string().required(),
    description: Joi.string().optional(),
    type: Joi.string()
      .valid(...Object.values(PromotionType))
      .required(),
    scope: Joi.string()
      .valid(...Object.values(PromotionScope))
      .optional(),
    value: Joi.number().positive().required(),
    maxDiscount: Joi.number().positive().optional(),
    minBookingAmount: Joi.number().min(0).optional(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    totalQty: Joi.number().integer().positive().optional(),
    perCustomerLimit: Joi.number().integer().positive().optional()
  })
};

const updatePromotion = {
  params: Joi.object().keys({
    id: Joi.string().required()
  }),
  body: Joi.object().keys({
    code: Joi.string().optional(),
    description: Joi.string().optional(),
    value: Joi.number().positive().optional(),
    maxDiscount: Joi.number().positive().optional(),
    minBookingAmount: Joi.number().min(0).optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    totalQty: Joi.number().integer().positive().optional(),
    remainingQty: Joi.number().integer().min(0).optional(),
    perCustomerLimit: Joi.number().integer().positive().optional(),
    disabledAt: Joi.date().iso().optional().allow(null)
  })
};

const claimPromotion = {
  body: Joi.object().keys({
    promotionCode: Joi.string().required()
  })
};

export default {
  createPromotion,
  updatePromotion,
  claimPromotion
};
