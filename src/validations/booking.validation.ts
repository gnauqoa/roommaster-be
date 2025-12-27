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

export default {
  createBooking,
  checkIn,
  checkInRooms,
  checkOutRooms,
  createTransaction
};
