import httpStatus from 'http-status';
import pick from 'utils/pick';
import ApiError from 'utils/ApiError';
import catchAsync from 'utils/catchAsync';
import { employeeService } from 'services';
import exclude from 'utils/exclude';

const createEmployee = catchAsync(async (req, res) => {
  const employee = await employeeService.createEmployee(req.body);
  res.status(httpStatus.CREATED).send(exclude(employee, ['passwordHash']));
});

const getEmployees = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['code', 'name', 'email', 'role', 'isActive']);
  const options = pick(req.query, ['sortBy', 'sortType', 'limit', 'page']);
  const result = await employeeService.queryEmployees(filter, options);
  res.send(result);
});

const getEmployee = catchAsync(async (req, res) => {
  const employee = await employeeService.getEmployeeById(Number(req.params.employeeId));
  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Employee not found');
  }
  res.send(exclude(employee, ['passwordHash']));
});

const updateEmployee = catchAsync(async (req, res) => {
  const employee = await employeeService.updateEmployeeById(
    Number(req.params.employeeId),
    req.body
  );
  res.send(exclude(employee, ['passwordHash']));
});

const deleteEmployee = catchAsync(async (req, res) => {
  await employeeService.deleteEmployeeById(Number(req.params.employeeId));
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee
};
