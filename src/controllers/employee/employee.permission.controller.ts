// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import catchAsync from '@/utils/catchAsync';
import { PermissionService } from '@/services';
import { sendData } from '@/utils/responseWrapper';
import pick from '@/utils/pick';

@Injectable()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  getPermissions = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['search', 'type', 'subject']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

    // Convert string query params
    if (options.page) options.page = Number(options.page);
    if (options.limit) options.limit = Number(options.limit);

    const result = await this.permissionService.getAllPermissions(filters, options);
    sendData(res, result);
  });

  getPermission = catchAsync(async (req: Request, res: Response) => {
    const permission = await this.permissionService.getPermissionById(req.params.permissionId);
    sendData(res, permission);
  });

  getPermissionsGrouped = catchAsync(async (req: Request, res: Response) => {
    const grouped = await this.permissionService.getPermissionsGroupedBySubject();
    sendData(res, grouped);
  });

  getScreenPermissions = catchAsync(async (req: Request, res: Response) => {
    const screens = await this.permissionService.getScreenPermissions();
    sendData(res, screens);
  });

  getActionPermissions = catchAsync(async (req: Request, res: Response) => {
    const actions = await this.permissionService.getActionPermissions();
    sendData(res, actions);
  });
}

export default PermissionController;
