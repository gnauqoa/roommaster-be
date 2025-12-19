import { PromotionType, PromotionStatus, RatePolicyLoop } from '@prisma/client';
import Joi from 'joi';

// Promotion validations
const createPromotion = {
  body: Joi.object().keys({
    code: Joi.string().required().max(20),
    name: Joi.string().required().max(200),
    voucherCode: Joi.string().max(50).allow('', null),
    fromDate: Joi.date().required(),
    toDate: Joi.date().required().greater(Joi.ref('fromDate')),
    promotionType: Joi.string()
      .valid(...Object.values(PromotionType))
      .required(),
    discountValue: Joi.number().positive().required(),
    discountUnit: Joi.string().max(10).allow('', null),
    maxDiscountAmount: Joi.number().positive().allow(null),
    minimumNights: Joi.number().integer().min(1).allow(null),
    status: Joi.string()
      .valid(...Object.values(PromotionStatus))
      .default(PromotionStatus.ACTIVE)
  })
};

const getPromotions = {
  query: Joi.object().keys({
    code: Joi.string(),
    name: Joi.string(),
    promotionType: Joi.string().valid(...Object.values(PromotionType)),
    status: Joi.string().valid(...Object.values(PromotionStatus)),
    fromDate: Joi.date(),
    toDate: Joi.date(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getPromotion = {
  params: Joi.object().keys({
    promotionId: Joi.number().integer().required()
  })
};

const updatePromotion = {
  params: Joi.object().keys({
    promotionId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      code: Joi.string().max(20),
      name: Joi.string().max(200),
      voucherCode: Joi.string().max(50).allow('', null),
      fromDate: Joi.date(),
      toDate: Joi.date(),
      promotionType: Joi.string().valid(...Object.values(PromotionType)),
      discountValue: Joi.number().positive(),
      discountUnit: Joi.string().max(10).allow('', null),
      maxDiscountAmount: Joi.number().positive().allow(null),
      minimumNights: Joi.number().integer().min(1).allow(null),
      status: Joi.string().valid(...Object.values(PromotionStatus))
    })
    .min(1)
};

const deletePromotion = {
  params: Joi.object().keys({
    promotionId: Joi.number().integer().required()
  })
};

const validateVoucher = {
  body: Joi.object().keys({
    voucherCode: Joi.string().required(),
    checkInDate: Joi.date().required(),
    checkOutDate: Joi.date().required(),
    totalAmount: Joi.number().positive().required()
  })
};

// Rate Policy validations
const createRatePolicy = {
  body: Joi.object().keys({
    code: Joi.string().required().max(20),
    name: Joi.string().required().max(100),
    roomTypeId: Joi.number().integer().required(),
    fromDate: Joi.date().required(),
    toDate: Joi.date().required().greater(Joi.ref('fromDate')),
    loop: Joi.string()
      .valid(...Object.values(RatePolicyLoop))
      .default(RatePolicyLoop.NONE),
    price: Joi.number().positive().required(),
    priority: Joi.number().integer().min(0).default(0)
  })
};

const getRatePolicies = {
  query: Joi.object().keys({
    code: Joi.string(),
    name: Joi.string(),
    roomTypeId: Joi.number().integer(),
    loop: Joi.string().valid(...Object.values(RatePolicyLoop)),
    fromDate: Joi.date(),
    toDate: Joi.date(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getRatePolicy = {
  params: Joi.object().keys({
    ratePolicyId: Joi.number().integer().required()
  })
};

const updateRatePolicy = {
  params: Joi.object().keys({
    ratePolicyId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      code: Joi.string().max(20),
      name: Joi.string().max(100),
      roomTypeId: Joi.number().integer(),
      fromDate: Joi.date(),
      toDate: Joi.date(),
      loop: Joi.string().valid(...Object.values(RatePolicyLoop)),
      price: Joi.number().positive(),
      priority: Joi.number().integer().min(0)
    })
    .min(1)
};

const deleteRatePolicy = {
  params: Joi.object().keys({
    ratePolicyId: Joi.number().integer().required()
  })
};

const calculateRate = {
  query: Joi.object().keys({
    roomTypeId: Joi.number().integer().required(),
    checkInDate: Joi.date().required(),
    checkOutDate: Joi.date().required().greater(Joi.ref('checkInDate')),
    numberOfGuests: Joi.number().integer().min(1).default(1)
  })
};

export default {
  createPromotion,
  getPromotions,
  getPromotion,
  updatePromotion,
  deletePromotion,
  validateVoucher,
  createRatePolicy,
  getRatePolicies,
  getRatePolicy,
  updateRatePolicy,
  deleteRatePolicy,
  calculateRate
};
