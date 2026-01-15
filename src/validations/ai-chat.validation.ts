import Joi from 'joi';

const chat = {
  body: Joi.object().keys({
    messages: Joi.array()
      .items(
        Joi.object().keys({
          role: Joi.string().valid('user', 'assistant', 'system').required(),
          content: Joi.string().required().allow('')
        })
      )
      .required()
      .min(1)
      .messages({
        'array.min': 'At least one message is required',
        'any.required': 'Messages array is required'
      })
  })
};

export default {
  chat
};
