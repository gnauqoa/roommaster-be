import { ReservationStatus } from '@prisma/client';
import Joi from 'joi';

const reservationDetailSchema = Joi.object().keys({
  roomTypeId: Joi.number().integer().required(),
  quantity: Joi.number().integer().min(1).default(1),
  expectedRate: Joi.number().positive().allow(null),
  numberOfGuests: Joi.number().integer().min(1).default(1),
  notes: Joi.string().allow('', null)
});

const createReservation = {
  body: Joi.object().keys({
    customerId: Joi.number().integer().required(),
    expectedArrival: Joi.date().required(),
    expectedDeparture: Joi.date().required().greater(Joi.ref('expectedArrival')),
    numberOfGuests: Joi.number().integer().min(1).default(1),
    depositRequired: Joi.number().min(0).allow(null),
    source: Joi.string().max(50).allow('', null),
    notes: Joi.string().allow('', null),
    reservationDetails: Joi.array().items(reservationDetailSchema).min(1).required()
  })
};

const getReservations = {
  query: Joi.object().keys({
    code: Joi.string(),
    customerId: Joi.number().integer(),
    status: Joi.string().valid(...Object.values(ReservationStatus)),
    expectedArrival: Joi.date(),
    expectedDeparture: Joi.date(),
    fromDate: Joi.date(),
    toDate: Joi.date(),
    source: Joi.string(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getReservation = {
  params: Joi.object().keys({
    reservationId: Joi.number().integer().required()
  })
};

const updateReservation = {
  params: Joi.object().keys({
    reservationId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      customerId: Joi.number().integer(),
      expectedArrival: Joi.date(),
      expectedDeparture: Joi.date(),
      numberOfGuests: Joi.number().integer().min(1),
      depositRequired: Joi.number().min(0).allow(null),
      depositPaid: Joi.number().min(0),
      status: Joi.string().valid(...Object.values(ReservationStatus)),
      source: Joi.string().max(50).allow('', null),
      notes: Joi.string().allow('', null)
    })
    .min(1)
};

const cancelReservation = {
  params: Joi.object().keys({
    reservationId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    reason: Joi.string().allow('', null)
  })
};

const confirmReservation = {
  params: Joi.object().keys({
    reservationId: Joi.number().integer().required()
  })
};

const addReservationDetail = {
  params: Joi.object().keys({
    reservationId: Joi.number().integer().required()
  }),
  body: reservationDetailSchema
};

const updateReservationDetail = {
  params: Joi.object().keys({
    reservationId: Joi.number().integer().required(),
    detailId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      roomTypeId: Joi.number().integer(),
      quantity: Joi.number().integer().min(1),
      expectedRate: Joi.number().positive().allow(null),
      numberOfGuests: Joi.number().integer().min(1),
      notes: Joi.string().allow('', null)
    })
    .min(1)
};

const deleteReservationDetail = {
  params: Joi.object().keys({
    reservationId: Joi.number().integer().required(),
    detailId: Joi.number().integer().required()
  })
};

const getTodayArrivals = {
  query: Joi.object().keys({
    date: Joi.date().default(new Date()),
    status: Joi.string().valid(...Object.values(ReservationStatus)),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getTodayDepartures = {
  query: Joi.object().keys({
    date: Joi.date().default(new Date()),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const checkInReservation = {
  params: Joi.object().keys({
    reservationId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    roomAssignments: Joi.array()
      .items(
        Joi.object().keys({
          roomId: Joi.number().integer().required(),
          expectedCheckOut: Joi.date().required(),
          lockedRate: Joi.number().min(0),
          numberOfGuests: Joi.number().integer().min(1),
          notes: Joi.string()
        })
      )
      .min(1)
      .required(),
    notes: Joi.string()
  })
};

export default {
  createReservation,
  getReservations,
  getReservation,
  updateReservation,
  cancelReservation,
  confirmReservation,
  addReservationDetail,
  updateReservationDetail,
  deleteReservationDetail,
  getTodayArrivals,
  getTodayDepartures,
  checkInReservation
};
