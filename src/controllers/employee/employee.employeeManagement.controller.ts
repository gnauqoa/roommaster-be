// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from 'core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from 'utils/catchAsync';
import { EmployeeService } from 'services';
import { sendData, sendNoContent } from 'utils/responseWrapper';
import exclude from 'utils/exclude';
import pick from 'utils/pick';

@Injectable()
export class EmployeeManagementController {
  constructor(private readonly employeeService: EmployeeService) {}

  createEmployee = catchAsync(async (req: Request, res: Response) => {
    const employee = await this.employeeService.createEmployee(req.body);
    const employeeWithoutPassword = exclude(employee, ['password']);
    sendData(res, employeeWithoutPassword, httpStatus.CREATED);
  });

  getEmployees = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, ['search', 'role']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);

    // Convert string query params to numbers
    if (options.page) options.page = Number(options.page);
    if (options.limit) options.limit = Number(options.limit);

    const result = await this.employeeService.getAllEmployees(filters, options);
    sendData(res, result);
  });

  getEmployee = catchAsync(async (req: Request, res: Response) => {
    const employee = await this.employeeService.getEmployeeById(req.params.employeeId);
    const employeeWithoutPassword = exclude(employee, ['password']);
    sendData(res, employeeWithoutPassword);
  });

  updateEmployee = catchAsync(async (req: Request, res: Response) => {
    const employee = await this.employeeService.updateEmployee(req.params.employeeId, req.body);
    const employeeWithoutPassword = exclude(employee, ['password']);
    sendData(res, employeeWithoutPassword);
  });

  deleteEmployee = catchAsync(async (req: Request, res: Response) => {
    await this.employeeService.deleteEmployee(req.params.employeeId);
    sendNoContent(res);
  });
}

export default EmployeeManagementController;
