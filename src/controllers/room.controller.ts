import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import RoomService from 'services/room.service';
import { Injectable } from 'core/decorators';

// Room Type Controllers

@Injectable()
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  createRoomType = catchAsync(async (req, res) => {
    const roomType = await this.roomService.createRoomType(req.body);
    res.status(httpStatus.CREATED).send(roomType);
  });

  getRoomTypes = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'isActive']);
    const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
    const result = await this.roomService.queryRoomTypes(filter, options);
    res.send(result);
  });

  getRoomType = catchAsync(async (req, res) => {
    const roomType = await this.roomService.getRoomTypeById(Number(req.params.roomTypeId));
    if (!roomType) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room type not found');
    }
    res.send(roomType);
  });

  updateRoomType = catchAsync(async (req, res) => {
    const roomType = await this.roomService.updateRoomTypeById(
      Number(req.params.roomTypeId),
      req.body
    );
    res.send(roomType);
  });

  deleteRoomType = catchAsync(async (req, res) => {
    await this.roomService.deleteRoomTypeById(Number(req.params.roomTypeId));
    res.status(httpStatus.NO_CONTENT).send();
  });

  // Room Controllers
  createRoom = catchAsync(async (req, res) => {
    const room = await this.roomService.createRoom(req.body);
    res.status(httpStatus.CREATED).send(room);
  });

  getRooms = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['roomNumber', 'roomTypeId', 'floor', 'status', 'isActive']);
    const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
    const result = await this.roomService.queryRooms(filter, options);
    res.send(result);
  });

  getRoom = catchAsync(async (req, res) => {
    const room = await this.roomService.getRoomById(Number(req.params.roomId));
    if (!room) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
    }
    res.send(room);
  });

  updateRoom = catchAsync(async (req, res) => {
    const room = await this.roomService.updateRoomById(Number(req.params.roomId), req.body);
    res.send(room);
  });

  updateRoomStatus = catchAsync(async (req, res) => {
    const room = await this.roomService.updateRoomStatus(
      Number(req.params.roomId),
      req.body.status
    );
    res.send(room);
  });

  deleteRoom = catchAsync(async (req, res) => {
    await this.roomService.deleteRoomById(Number(req.params.roomId));
    res.status(httpStatus.NO_CONTENT).send();
  });

  // Availability
  checkAvailability = catchAsync(async (req, res) => {
    const { checkInDate, checkOutDate, roomTypeId } = req.query;
    const availability = await this.roomService.checkAvailability(
      new Date(checkInDate as string),
      new Date(checkOutDate as string),
      roomTypeId ? Number(roomTypeId) : undefined
    );
    res.send(availability);
  });

  getAvailableRooms = catchAsync(async (req, res) => {
    const { checkInDate, checkOutDate, roomTypeId } = req.query;
    const rooms = await this.roomService.getAvailableRooms(
      new Date(checkInDate as string),
      new Date(checkOutDate as string),
      roomTypeId ? Number(roomTypeId) : undefined
    );
    res.send(rooms);
  });
}

export default RoomController;
