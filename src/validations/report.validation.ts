import Joi from 'joi';

const createSnapshot = {
  body: Joi.object().keys({
    date: Joi.date().optional()
  })
};

const getSnapshot = {
  query: Joi.object().keys({
    date: Joi.date().optional()
  })
};

const getSnapshots = {
  query: Joi.object().keys({
    fromDate: Joi.date(),
    toDate: Joi.date()
  })
};

const getOccupancyReport = {
  query: Joi.object().keys({
    fromDate: Joi.date(),
    toDate: Joi.date()
  })
};

const getRevenueReport = {
  query: Joi.object().keys({
    fromDate: Joi.date(),
    toDate: Joi.date()
  })
};

const getBookingReport = {
  query: Joi.object().keys({
    fromDate: Joi.date(),
    toDate: Joi.date()
  })
};

const getRevenueByRoomType = {
  query: Joi.object().keys({
    fromDate: Joi.date(),
    toDate: Joi.date()
  })
};

export default {
  createSnapshot,
  getSnapshot,
  getSnapshots,
  getOccupancyReport,
  getRevenueReport,
  getBookingReport,
  getRevenueByRoomType
};
