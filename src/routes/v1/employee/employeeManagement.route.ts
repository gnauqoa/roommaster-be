import express from 'express';
import { authEmployee } from 'middlewares/auth';
import validate from 'middlewares/validate';
import { employeeValidation } from 'validations';
import { container, TOKENS } from 'core/container';
import { EmployeeService } from 'services';
import { EmployeeManagementController } from 'controllers/employee/employeeManagement.controller';

const employeeManagementRoute = express.Router();

// Manually instantiate controller with dependencies
const employeeService = container.resolve<EmployeeService>(TOKENS.EmployeeService);
const employeeManagementController = new EmployeeManagementController(employeeService);

employeeManagementRoute
  .route('/')
  .post(
    authEmployee,
    validate(employeeValidation.createEmployee),
    employeeManagementController.createEmployee
  )
  .get(
    authEmployee,
    validate(employeeValidation.getEmployees),
    employeeManagementController.getEmployees
  );

employeeManagementRoute
  .route('/:employeeId')
  .get(
    authEmployee,
    validate(employeeValidation.getEmployee),
    employeeManagementController.getEmployee
  )
  .put(
    authEmployee,
    validate(employeeValidation.updateEmployee),
    employeeManagementController.updateEmployee
  )
  .delete(
    authEmployee,
    validate(employeeValidation.deleteEmployee),
    employeeManagementController.deleteEmployee
  );

export default employeeManagementRoute;
