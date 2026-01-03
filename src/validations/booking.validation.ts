import { PaymentMethod } from '@prisma/client';
import Joi from 'joi';

const createBooking = {
  body: Joi.object().keys({
    rooms: Joi.array()
      .items(
        Joi.object().keys({
          roomTypeId: Joi.string().required(),
          count: Joi.number().integer().min(1).required()
        })
      )
      .min(1)
      .required(),
    checkInDate: Joi.date().iso().required(),
    checkOutDate: Joi.date().iso().greater(Joi.ref('checkInDate')).required(),
    totalGuests: Joi.number().integer().min(1).required()
  })
};

const checkIn = {
  body: Joi.object().keys({
    bookingId: Joi.string().required(),
    bookingRoomId: Joi.string().required(),
    guests: Joi.array()
      .items(
        Joi.object().keys({
          customerId: Joi.string().required(),
          isPrimary: Joi.boolean().default(false)
        })
      )
      .min(1)
      .required()
  })
};

const checkInRooms = {
  body: Joi.object().keys({
    checkInInfo: Joi.array()
      .items(
        Joi.object().keys({
          bookingRoomId: Joi.string().required(),
          customerIds: Joi.array().items(Joi.string()).min(1).required()
        })
      )
      .min(1)
      .required()
  })
};

const checkOutRooms = {
  body: Joi.object().keys({
    bookingRoomIds: Joi.array().items(Joi.string()).min(1).required()
  })
};

const createTransaction = {
  body: Joi.object().keys({
    bookingId: Joi.string().required(),
    transactionType: Joi.string()
      .valid('DEPOSIT', 'ROOM_CHARGE', 'SERVICE_CHARGE', 'REFUND', 'ADJUSTMENT')
      .required(),
    amount: Joi.number().required(), // Can be positive or negative for adjustments
    method: Joi.string()
      .valid(...Object.values(PaymentMethod))
      .required(),
    bookingRoomId: Joi.string().optional(),
    transactionRef: Joi.string().optional(),
    description: Joi.string().optional()
  })
};

const getBookings = {
  query: Joi.object().keys({
    search: Joi.string(),
    status: Joi.string(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    page: Joi.number().integer(),
    limit: Joi.number().integer(),
    sortBy: Joi.string(),
    sortOrder: Joi.string()
  })
};

const getBooking = {
  params: Joi.object().keys({
    id: Joi.string().required()
  })
};

const cancelBooking = {
  params: Joi.object().keys({
    id: Joi.string().required()
  })
};

const updateBooking = {
  params: Joi.object().keys({
    id: Joi.string().required()
  }),
  body: Joi.object().keys({
    checkInDate: Joi.date().iso(),
    checkOutDate: Joi.date().iso().greater(Joi.ref('checkInDate')),
    totalGuests: Joi.number().integer().min(1),
    status: Joi.string().valid('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'),
    rooms: Joi.array().items(
      Joi.object().keys({
        roomTypeId: Joi.string().required(),
        count: Joi.number().integer().min(1).required()
      })
    )
  })
};

const createBookingEmployee = {
  body: Joi.object()
    .keys({
      customerId: Joi.string().optional(),
      customer: Joi.object()
        .keys({
          fullName: Joi.string().required(),
          phone: Joi.string().required(),
          email: Joi.string().email().optional(),
          idNumber: Joi.string().optional(),
          address: Joi.string().optional()
        })
        .optional(),
      rooms: Joi.array()
        .items(
          Joi.object().keys({
            roomTypeId: Joi.string().required(),
            count: Joi.number().integer().min(1).required()
          })
        )
        .min(1)
        .required(),
      checkInDate: Joi.date().iso().required(),
      checkOutDate: Joi.date().iso().greater(Joi.ref('checkInDate')).required(),
      totalGuests: Joi.number().integer().min(1).required()
    })
    .xor('customerId', 'customer')
};

export default {
  createBooking,
  checkIn,
  checkInRooms,
  checkOutRooms,
  createTransaction,
  getBookings,
  getBooking,
  cancelBooking,
  updateBooking,
  createBookingEmployee
};
