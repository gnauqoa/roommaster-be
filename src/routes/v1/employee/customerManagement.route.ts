import express from 'express';
import { authEmployee } from 'middlewares/auth';
import validate from 'middlewares/validate';
import { customerValidation } from 'validations';
import { container, TOKENS } from 'core/container';
import { CustomerService } from 'services';
import { CustomerManagementController } from 'controllers/employee/customerManagement.controller';

const customerManagementRoute = express.Router();

// Manually instantiate controller with dependencies
const customerService = container.resolve<CustomerService>(TOKENS.CustomerService);
const customerManagementController = new CustomerManagementController(customerService);

customerManagementRoute
  .route('/')
  .post(
    authEmployee,
    validate(customerValidation.createCustomer),
    customerManagementController.createCustomer
  )
  .get(
    authEmployee,
    validate(customerValidation.getCustomers),
    customerManagementController.getCustomers
  );

customerManagementRoute
  .route('/:customerId')
  .get(
    authEmployee,
    validate(customerValidation.getCustomer),
    customerManagementController.getCustomer
  )
  .put(
    authEmployee,
    validate(customerValidation.updateCustomer),
    customerManagementController.updateCustomer
  )
  .delete(
    authEmployee,
    validate(customerValidation.deleteCustomer),
    customerManagementController.deleteCustomer
  );

export default customerManagementRoute;
