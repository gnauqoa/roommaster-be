import Joi from 'joi';

const createRoomTag = {
  body: Joi.object().keys({
    name: Joi.string().required().max(100),
    description: Joi.string().optional().max(500)
  })
};

const getRoomTag = {
  params: Joi.object().keys({
    tagId: Joi.string().required()
  })
};

const updateRoomTag = {
  params: Joi.object().keys({
    tagId: Joi.string().required()
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().max(100),
      description: Joi.string().max(500)
    })
    .min(1)
};

const deleteRoomTag = {
  params: Joi.object().keys({
    tagId: Joi.string().required()
  })
};

export default {
  createRoomTag,
  getRoomTag,
  updateRoomTag,
  deleteRoomTag
};
