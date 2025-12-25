import express from 'express';
import { authEmployee } from 'middlewares/auth';
import validate from 'middlewares/validate';
import { roomValidation } from 'validations';
import { container, TOKENS } from 'core/container';
import { RoomService } from 'services';
import { RoomController } from 'controllers/employee/room.controller';

const roomRoute = express.Router();

// Manually instantiate controller with dependencies
const roomService = container.resolve<RoomService>(TOKENS.RoomService);
const roomController = new RoomController(roomService);

roomRoute
  .route('/')
  .post(authEmployee, validate(roomValidation.createRoom), roomController.createRoom)
  .get(authEmployee, validate(roomValidation.getRooms), roomController.getRooms);

roomRoute
  .route('/:roomId')
  .get(authEmployee, validate(roomValidation.getRoom), roomController.getRoom)
  .put(authEmployee, validate(roomValidation.updateRoom), roomController.updateRoom)
  .delete(authEmployee, validate(roomValidation.deleteRoom), roomController.deleteRoom);

export default roomRoute;
