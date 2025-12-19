import Joi from 'joi';
import { password } from './custom.validation';

const login = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required()
  })
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required()
  })
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required()
  })
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required()
  })
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required()
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password)
  })
};

const changePassword = {
  body: Joi.object().keys({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required().custom(password)
  })
};

const getProfile = {};

const updateProfile = {
  body: Joi.object()
    .keys({
      name: Joi.string().max(100),
      phone: Joi.string().max(20)
    })
    .min(1)
};

export default {
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile
};
