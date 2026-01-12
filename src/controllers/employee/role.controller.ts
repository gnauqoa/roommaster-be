// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/utils/catchAsync';
import { RoleService } from '@/services';
import { sendData, sendNoContent } from '@/utils/responseWrapper';
import pick from '@/utils/pick';

@Injectable()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  createRole = catchAsync(async (req: Request, res: Response) => {
    const role = await this.roleService.createRole(req.body);
    sendData(res, role, httpStatus.CREATED);
  });

  getRoles = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['search', 'isActive']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

    // Convert string query params
    if (options.page) options.page = Number(options.page);
    if (options.limit) options.limit = Number(options.limit);
    if (filters.isActive !== undefined) {
      filters.isActive = filters.isActive === 'true';
    }

    const result = await this.roleService.getAllRoles(filters, options);
    sendData(res, result);
  });

  getRole = catchAsync(async (req: Request, res: Response) => {
    const role = await this.roleService.getRoleById(req.params.roleId);
    sendData(res, role);
  });

  updateRole = catchAsync(async (req: Request, res: Response) => {
    const role = await this.roleService.updateRole(req.params.roleId, req.body);
    sendData(res, role);
  });

  deleteRole = catchAsync(async (req: Request, res: Response) => {
    await this.roleService.deleteRole(req.params.roleId);
    sendNoContent(res);
  });

  getRolePermissions = catchAsync(async (req: Request, res: Response) => {
    const permissions = await this.roleService.getRolePermissions(req.params.roleId);
    sendData(res, permissions);
  });
}

export default RoleController;
