import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import { roomService } from 'services';

// Room Type Controllers
const createRoomType = catchAsync(async (req, res) => {
  const roomType = await roomService.createRoomType(req.body);
  res.status(httpStatus.CREATED).send(roomType);
});

const getRoomTypes = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'isActive']);
  const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
  const result = await roomService.queryRoomTypes(filter, options);
  res.send(result);
});

const getRoomType = catchAsync(async (req, res) => {
  const roomType = await roomService.getRoomTypeById(Number(req.params.roomTypeId));
  if (!roomType) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room type not found');
  }
  res.send(roomType);
});

const updateRoomType = catchAsync(async (req, res) => {
  const roomType = await roomService.updateRoomTypeById(Number(req.params.roomTypeId), req.body);
  res.send(roomType);
});

const deleteRoomType = catchAsync(async (req, res) => {
  await roomService.deleteRoomTypeById(Number(req.params.roomTypeId));
  res.status(httpStatus.NO_CONTENT).send();
});

// Room Controllers
const createRoom = catchAsync(async (req, res) => {
  const room = await roomService.createRoom(req.body);
  res.status(httpStatus.CREATED).send(room);
});

const getRooms = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['roomNumber', 'roomTypeId', 'floor', 'status', 'isActive']);
  const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
  const result = await roomService.queryRooms(filter, options);
  res.send(result);
});

const getRoom = catchAsync(async (req, res) => {
  const room = await roomService.getRoomById(Number(req.params.roomId));
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Room not found');
  }
  res.send(room);
});

const updateRoom = catchAsync(async (req, res) => {
  const room = await roomService.updateRoomById(Number(req.params.roomId), req.body);
  res.send(room);
});

const updateRoomStatus = catchAsync(async (req, res) => {
  const room = await roomService.updateRoomStatus(Number(req.params.roomId), req.body.status);
  res.send(room);
});

const deleteRoom = catchAsync(async (req, res) => {
  await roomService.deleteRoomById(Number(req.params.roomId));
  res.status(httpStatus.NO_CONTENT).send();
});

// Availability
const checkAvailability = catchAsync(async (req, res) => {
  const { checkInDate, checkOutDate, roomTypeId } = req.query;
  const availability = await roomService.checkAvailability(
    new Date(checkInDate as string),
    new Date(checkOutDate as string),
    roomTypeId ? Number(roomTypeId) : undefined
  );
  res.send(availability);
});

const getAvailableRooms = catchAsync(async (req, res) => {
  const { checkInDate, checkOutDate, roomTypeId } = req.query;
  const rooms = await roomService.getAvailableRooms(
    new Date(checkInDate as string),
    new Date(checkOutDate as string),
    roomTypeId ? Number(roomTypeId) : undefined
  );
  res.send(rooms);
});

export default {
  createRoomType,
  getRoomTypes,
  getRoomType,
  updateRoomType,
  deleteRoomType,
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  updateRoomStatus,
  deleteRoom,
  checkAvailability,
  getAvailableRooms
};
