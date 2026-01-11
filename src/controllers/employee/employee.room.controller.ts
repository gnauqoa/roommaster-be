// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/utils/catchAsync';
import { RoomService } from '@/services';
import { sendData, sendNoContent } from '@/utils/responseWrapper';
import pick from '@/utils/pick';

@Injectable()
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  createRoom = catchAsync(async (req: Request, res: Response) => {
    const room = await this.roomService.createRoom(req.body);
    sendData(res, room, httpStatus.CREATED);
  });

  getRooms = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['search', 'status', 'floor', 'roomTypeId']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

    // Convert string query params to numbers
    if (filters.floor) filters.floor = Number(filters.floor);
    if (options.page) options.page = Number(options.page);
    if (options.limit) options.limit = Number(options.limit);

    const result = await this.roomService.getAllRooms(filters, options);
    sendData(res, result);
  });

  getRoom = catchAsync(async (req: Request, res: Response) => {
    const room = await this.roomService.getRoomById(req.params.roomId);
    sendData(res, room);
  });

  updateRoom = catchAsync(async (req: Request, res: Response) => {
    const room = await this.roomService.updateRoom(req.params.roomId, req.body);
    sendData(res, room);
  });

  deleteRoom = catchAsync(async (req: Request, res: Response) => {
    await this.roomService.deleteRoom(req.params.roomId);
    sendNoContent(res);
  });

  /**
   * Search rooms available for specific date range
   * GET /employee/rooms/available
   * Primary endpoint for employees to search rooms when creating bookings
   */
  searchAvailableRoomsByDate = catchAsync(async (req: Request, res: Response) => {
    const {
      checkInDate,
      checkOutDate,
      search,
      floor,
      roomTypeId,
      minCapacity,
      maxCapacity,
      minPrice,
      maxPrice,
      page,
      limit,
      sortBy,
      sortOrder
    } = req.query;

    const filters = {
      checkInDate: checkInDate as string,
      checkOutDate: checkOutDate as string,
      search: search as string,
      floor: floor ? parseInt(floor as string) : undefined,
      roomTypeId: roomTypeId as string,
      minCapacity: minCapacity ? parseInt(minCapacity as string) : undefined,
      maxCapacity: maxCapacity ? parseInt(maxCapacity as string) : undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined
    };

    const options = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      sortBy: (sortBy as string) || 'roomNumber',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'asc'
    };

    const result = await this.roomService.searchAvailableRoomsByDate(filters, options);
    sendData(res, result);
  });

  /**
   * Check if a specific room is available for a date range
   * GET /employee/rooms/:roomId/availability
   */
  checkRoomAvailability = catchAsync(async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const { checkInDate, checkOutDate } = req.query;

    const result = await this.roomService.isRoomAvailableForDates(
      roomId,
      new Date(checkInDate as string),
      new Date(checkOutDate as string)
    );

    sendData(res, result);
  });

  /**
   * Bulk check availability for multiple rooms
   * POST /employee/rooms/check-availability
   * Useful for validating selected rooms before creating a booking
   */
  checkMultipleRoomsAvailability = catchAsync(async (req: Request, res: Response) => {
    const { roomIds, checkInDate, checkOutDate } = req.body;

    const result = await this.roomService.checkMultipleRoomsAvailability(
      roomIds,
      new Date(checkInDate),
      new Date(checkOutDate)
    );

    sendData(res, result);
  });
}

export default RoomController;
