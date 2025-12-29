// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { RoomService } from 'services';
import { sendData, sendNoContent } from 'utils/responseWrapper';
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
}

export default RoomController;
