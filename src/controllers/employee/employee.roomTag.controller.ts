import { Injectable } from 'core/decorators';
import { Request, Response } from 'express';
import catchAsync from 'utils/catchAsync';
import { RoomTagService } from 'services/roomTag.service';
import { sendData } from 'utils/responseWrapper';

@Injectable()
export class EmployeeRoomTagController {
  constructor(private readonly roomTagService: RoomTagService) {}

  /**
   * Create a new room tag
   * POST /employee-api/v1/room-tags
   */
  createRoomTag = catchAsync(async (req: Request, res: Response) => {
    const tag = await this.roomTagService.createRoomTag(req.body);
    sendData(res, tag, 201);
  });

  /**
   * Get all room tags
   * GET /employee-api/v1/room-tags
   */
  getRoomTags = catchAsync(async (_req: Request, res: Response) => {
    const tags = await this.roomTagService.getAllRoomTags();
    sendData(res, tags);
  });

  /**
   * Get room tag by ID
   * GET /employee-api/v1/room-tags/:tagId
   */
  getRoomTag = catchAsync(async (req: Request, res: Response) => {
    const tag = await this.roomTagService.getRoomTagById(req.params.tagId);
    sendData(res, tag);
  });

  /**
   * Update room tag
   * PATCH /employee-api/v1/room-tags/:tagId
   */
  updateRoomTag = catchAsync(async (req: Request, res: Response) => {
    const tag = await this.roomTagService.updateRoomTag(req.params.tagId, req.body);
    sendData(res, tag);
  });

  /**
   * Delete room tag
   * DELETE /employee-api/v1/room-tags/:tagId
   */
  deleteRoomTag = catchAsync(async (req: Request, res: Response) => {
    await this.roomTagService.deleteRoomTag(req.params.tagId);
    sendData(res, { message: 'Room tag deleted successfully' });
  });
}

export default EmployeeRoomTagController;
