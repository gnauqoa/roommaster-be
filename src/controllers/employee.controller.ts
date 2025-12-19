import { Request, Response } from 'express';
import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import { EmployeeService } from 'services/employee.service';
import exclude from 'utils/exclude';
import { Injectable } from 'core/decorators';

@Injectable()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  createEmployee = catchAsync(async (req: Request, res: Response) => {
    const employee = await this.employeeService.createEmployee(req.body);
    res.status(httpStatus.CREATED).send(exclude(employee, ['passwordHash']));
  });

  getEmployees = catchAsync(async (req: Request, res: Response) => {
    const filter = pick(req.query, ['code', 'name', 'email', 'role', 'isActive']);
    const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
    const result = await this.employeeService.queryEmployees(filter, options);
    res.send(result);
  });

  getEmployee = catchAsync(async (req: Request, res: Response) => {
    const employee = await this.employeeService.getEmployeeById(Number(req.params.employeeId));
    if (!employee) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
    }
    res.send(exclude(employee, ['passwordHash']));
  });

  updateEmployee = catchAsync(async (req: Request, res: Response) => {
    const employee = await this.employeeService.updateEmployeeById(
      Number(req.params.employeeId),
      req.body
    );
    res.send(exclude(employee, ['passwordHash']));
  });

  deleteEmployee = catchAsync(async (req: Request, res: Response) => {
    await this.employeeService.deleteEmployeeById(Number(req.params.employeeId));
    res.status(httpStatus.NO_CONTENT).send();
  });
}

export default EmployeeController;
