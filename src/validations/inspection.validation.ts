import Joi from 'joi';

const createInspection = {
  params: Joi.object().keys({
    stayDetailId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    hasDamages: Joi.boolean().default(false),
    damageNotes: Joi.string().allow('', null),
    damageAmount: Joi.number().min(0).default(0),
    hasMissingItems: Joi.boolean().default(false),
    missingItems: Joi.string().allow('', null),
    missingAmount: Joi.number().min(0).default(0),
    hasViolations: Joi.boolean().default(false),
    violationNotes: Joi.string().allow('', null),
    penaltyAmount: Joi.number().min(0).default(0),
    notes: Joi.string().allow('', null)
  })
};

const getInspection = {
  params: Joi.object().keys({
    stayDetailId: Joi.number().integer().required()
  })
};

const updateInspection = {
  params: Joi.object().keys({
    stayDetailId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    isApproved: Joi.boolean(),
    notes: Joi.string().allow('', null)
  })
};

const canCheckout = {
  params: Joi.object().keys({
    stayDetailId: Joi.number().integer().required()
  })
};

export default {
  createInspection,
  getInspection,
  updateInspection,
  canCheckout
};
