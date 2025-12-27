// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from 'core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { RoomTypeService } from 'services';
import { sendData, sendNoContent } from 'utils/responseWrapper';
import pick from 'utils/pick';

@Injectable()
export class RoomTypeController {
  constructor(private readonly roomTypeService: RoomTypeService) {}

  createRoomType = catchAsync(async (req: Request, res: Response) => {
    const roomType = await this.roomTypeService.createRoomType(req.body);
    sendData(res, roomType, httpStatus.CREATED);
  });

  getRoomTypes = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, [
      'search',
      'minCapacity',
      'maxCapacity',
      'minPrice',
      'maxPrice'
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

    // Convert string query params to numbers
    if (filters.minCapacity) filters.minCapacity = Number(filters.minCapacity);
    if (filters.maxCapacity) filters.maxCapacity = Number(filters.maxCapacity);
    if (filters.minPrice) filters.minPrice = Number(filters.minPrice);
    if (filters.maxPrice) filters.maxPrice = Number(filters.maxPrice);
    if (options.page) options.page = Number(options.page);
    if (options.limit) options.limit = Number(options.limit);

    const result = await this.roomTypeService.getAllRoomTypes(filters, options);
    sendData(res, result);
  });

  getRoomType = catchAsync(async (req: Request, res: Response) => {
    const roomType = await this.roomTypeService.getRoomTypeById(req.params.roomTypeId);
    sendData(res, roomType);
  });

  updateRoomType = catchAsync(async (req: Request, res: Response) => {
    const roomType = await this.roomTypeService.updateRoomType(req.params.roomTypeId, req.body);
    sendData(res, roomType);
  });

  deleteRoomType = catchAsync(async (req: Request, res: Response) => {
    await this.roomTypeService.deleteRoomType(req.params.roomTypeId);
    sendNoContent(res);
  });
}

export default RoomTypeController;
