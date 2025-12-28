import Joi from 'joi';

// Custom validators
export const password: Joi.CustomValidator<string> = (value, helpers) => {
  if (value.length < 8) {
    return helpers.error('password must be at least 8 characters');
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.error('password must contain at least 1 letter and 1 number');
  }
  return value;
};

export const phoneNumber: Joi.CustomValidator<string> = (value, helpers) => {
  if (!value.match(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)) {
    return helpers.error('invalid phone number format');
  }
  return value;
};

export const dateString: Joi.CustomValidator<string> = (value, helpers) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return helpers.error('invalid date format');
  }
  return value;
};

export const positiveNumber: Joi.CustomValidator<number> = (value, helpers) => {
  if (value < 0) {
    return helpers.error('value must be positive');
  }
  return value;
};

export const decimalNumber: Joi.CustomValidator<string> = (value, helpers) => {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return helpers.error('invalid decimal format (max 2 decimal places)');
  }
  return value;
};

// Pagination validators
export const page = Joi.number().integer().min(1).default(1);
export const perPage = Joi.number().integer().min(1).max(100).default(10);

export const paginationQuery = {
  page: page.optional(),
  perPage: perPage.optional()
};

// Validation schemas
const getPromotions = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    code: Joi.string().optional(),
    description: Joi.string().optional(),
    maxDiscount: Joi.number().positive().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional()
  })
};

export default {
  getPromotions
};
