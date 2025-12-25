import express from 'express';
import { authEmployee } from 'middlewares/auth';
import validate from 'middlewares/validate';
import { hotelServiceValidation } from 'validations';
import { container, TOKENS } from 'core/container';
import { HotelServiceService } from 'services';
import { HotelServiceController } from 'controllers/employee/hotelService.controller';

const hotelServiceRoute = express.Router();

// Manually instantiate controller with dependencies
const hotelServiceService = container.resolve<HotelServiceService>(TOKENS.HotelServiceService);
const hotelServiceController = new HotelServiceController(hotelServiceService);

hotelServiceRoute
  .route('/')
  .post(
    authEmployee,
    validate(hotelServiceValidation.createHotelService),
    hotelServiceController.createHotelService
  )
  .get(
    authEmployee,
    validate(hotelServiceValidation.getHotelServices),
    hotelServiceController.getHotelServices
  );

hotelServiceRoute
  .route('/:serviceId')
  .get(
    authEmployee,
    validate(hotelServiceValidation.getHotelService),
    hotelServiceController.getHotelService
  )
  .put(
    authEmployee,
    validate(hotelServiceValidation.updateHotelService),
    hotelServiceController.updateHotelService
  )
  .delete(
    authEmployee,
    validate(hotelServiceValidation.deleteHotelService),
    hotelServiceController.deleteHotelService
  );

export default hotelServiceRoute;
