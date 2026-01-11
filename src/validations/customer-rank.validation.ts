import Joi from 'joi';

export const customerRankValidation = {
  createRank: {
    body: Joi.object().keys({
      name: Joi.string().required(),
      displayName: Joi.string().required(),
      description: Joi.string().optional(),
      minSpending: Joi.number().min(0).required(),
      maxSpending: Joi.number().min(0).optional(),
      benefits: Joi.string().optional(),
      color: Joi.string().optional()
    })
  },

  updateRank: {
    body: Joi.object().keys({
      name: Joi.string().optional(),
      displayName: Joi.string().optional(),
      description: Joi.string().optional(),
      minSpending: Joi.number().min(0).optional(),
      maxSpending: Joi.number().min(0).optional(),
      benefits: Joi.string().optional(),
      color: Joi.string().optional()
    })
  },

  setCustomerRank: {
    body: Joi.object().keys({
      rankId: Joi.string().allow(null).required()
    })
  }
};

export default customerRankValidation;
