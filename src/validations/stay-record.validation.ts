import { StayRecordStatus } from '@prisma/client';
import Joi from 'joi';

const guestInResidenceSchema = Joi.object().keys({
  fullName: Joi.string().required().max(200),
  idType: Joi.string().max(20).allow('', null),
  idNumber: Joi.string().max(50).allow('', null),
  dateOfBirth: Joi.date().allow(null),
  nationality: Joi.string().max(100).allow('', null),
  address: Joi.string().allow('', null),
  phone: Joi.string().max(20).allow('', null),
  isMainGuest: Joi.boolean().default(false)
});

const stayDetailSchema = Joi.object().keys({
  roomId: Joi.number().integer().required(),
  expectedCheckOut: Joi.date().required(),
  numberOfGuests: Joi.number().integer().min(1).default(1),
  notes: Joi.string().allow('', null),
  guests: Joi.array().items(guestInResidenceSchema)
});

// Walk-in check-in (no reservation)
const createStayRecord = {
  body: Joi.object().keys({
    customerId: Joi.number().integer().required(),
    notes: Joi.string().allow('', null),
    stayDetails: Joi.array().items(stayDetailSchema).min(1).required()
  })
};

// Check-in from reservation
const checkInFromReservation = {
  body: Joi.object().keys({
    reservationId: Joi.number().integer().required(),
    roomAssignments: Joi.array()
      .items(
        Joi.object().keys({
          roomId: Joi.number().integer().required(),
          guests: Joi.array().items(guestInResidenceSchema)
        })
      )
      .min(1)
      .required(),
    notes: Joi.string().allow('', null)
  })
};

const getStayRecords = {
  query: Joi.object().keys({
    code: Joi.string(),
    customerId: Joi.number().integer(),
    reservationId: Joi.number().integer(),
    status: Joi.string().valid(...Object.values(StayRecordStatus)),
    fromDate: Joi.date(),
    toDate: Joi.date(),
    sortBy: Joi.string(),
    sortType: Joi.string().valid('asc', 'desc'),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

const getStayRecord = {
  params: Joi.object().keys({
    stayRecordId: Joi.number().integer().required()
  })
};

const updateStayRecord = {
  params: Joi.object().keys({
    stayRecordId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      notes: Joi.string().allow('', null)
    })
    .min(1)
};

const checkOut = {
  params: Joi.object().keys({
    stayRecordId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    stayDetailIds: Joi.array().items(Joi.number().integer()).min(1)
  })
};

const checkOutRoom = {
  params: Joi.object().keys({
    stayRecordId: Joi.number().integer().required(),
    stayDetailId: Joi.number().integer().required()
  })
};

const addStayDetail = {
  params: Joi.object().keys({
    stayRecordId: Joi.number().integer().required()
  }),
  body: stayDetailSchema
};

const updateStayDetail = {
  params: Joi.object().keys({
    stayRecordId: Joi.number().integer().required(),
    stayDetailId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      expectedCheckOut: Joi.date(),
      numberOfGuests: Joi.number().integer().min(1),
      notes: Joi.string().allow('', null)
    })
    .min(1)
};

const addGuestToRoom = {
  params: Joi.object().keys({
    stayRecordId: Joi.number().integer().required(),
    stayDetailId: Joi.number().integer().required()
  }),
  body: guestInResidenceSchema
};

const updateGuest = {
  params: Joi.object().keys({
    stayRecordId: Joi.number().integer().required(),
    stayDetailId: Joi.number().integer().required(),
    guestId: Joi.number().integer().required()
  }),
  body: Joi.object()
    .keys({
      fullName: Joi.string().max(200),
      idType: Joi.string().max(20).allow('', null),
      idNumber: Joi.string().max(50).allow('', null),
      dateOfBirth: Joi.date().allow(null),
      nationality: Joi.string().max(100).allow('', null),
      address: Joi.string().allow('', null),
      phone: Joi.string().max(20).allow('', null),
      isMainGuest: Joi.boolean()
    })
    .min(1)
};

const removeGuest = {
  params: Joi.object().keys({
    stayRecordId: Joi.number().integer().required(),
    stayDetailId: Joi.number().integer().required(),
    guestId: Joi.number().integer().required()
  })
};

const moveRoom = {
  params: Joi.object().keys({
    stayRecordId: Joi.number().integer().required(),
    stayDetailId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    newRoomId: Joi.number().integer().required(),
    reason: Joi.string().allow('', null)
  })
};

const extendStay = {
  params: Joi.object().keys({
    stayRecordId: Joi.number().integer().required(),
    stayDetailId: Joi.number().integer().required()
  }),
  body: Joi.object().keys({
    newExpectedCheckOut: Joi.date().required()
  })
};

const getCurrentGuests = {
  query: Joi.object().keys({
    roomId: Joi.number().integer(),
    floor: Joi.number().integer(),
    limit: Joi.number().integer().min(1).max(100),
    page: Joi.number().integer().min(1)
  })
};

export default {
  createStayRecord,
  checkInFromReservation,
  getStayRecords,
  getStayRecord,
  updateStayRecord,
  checkOut,
  checkOutRoom,
  addStayDetail,
  updateStayDetail,
  addGuestToRoom,
  updateGuest,
  removeGuest,
  moveRoom,
  extendStay,
  getCurrentGuests
};
