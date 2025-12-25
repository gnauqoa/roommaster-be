import express from 'express';
import { authEmployee } from 'middlewares/auth';
import validate from 'middlewares/validate';
import { roomTypeValidation } from 'validations';
import { container, TOKENS } from 'core/container';
import { RoomTypeService } from 'services';
import { RoomTypeController } from 'controllers/employee/roomType.controller';

const roomTypeRoute = express.Router();

// Manually instantiate controller with dependencies
const roomTypeService = container.resolve<RoomTypeService>(TOKENS.RoomTypeService);
const roomTypeController = new RoomTypeController(roomTypeService);

roomTypeRoute
  .route('/')
  .post(
    authEmployee,
    validate(roomTypeValidation.createRoomType),
    roomTypeController.createRoomType
  )
  .get(authEmployee, validate(roomTypeValidation.getRoomTypes), roomTypeController.getRoomTypes);

roomTypeRoute
  .route('/:roomTypeId')
  .get(authEmployee, validate(roomTypeValidation.getRoomType), roomTypeController.getRoomType)
  .put(authEmployee, validate(roomTypeValidation.updateRoomType), roomTypeController.updateRoomType)
  .delete(
    authEmployee,
    validate(roomTypeValidation.deleteRoomType),
    roomTypeController.deleteRoomType
  );

export default roomTypeRoute;
