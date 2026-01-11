import express from 'express';
import EmployeeCustomerRankController from '@/controllers/employee/employee.customer-rank.controller';
import validate from '@/middlewares/validate';
import Joi from 'joi';
import { authEmployee } from '@/middlewares/auth';
import { container, TOKENS } from '@/core/container';
import CustomerRankService from '@/services/customer-rank.service';

// Inline validation schemas
const customerRankValidation = {
  createRank: {
    body: Joi.object().keys({
      name: Joi.string().required(),
      displayName: Joi.string().required(),
      description: Joi.string().optional(),
      minSpending: Joi.number().min(0).required(),
      maxSpending: Joi.number().min(0).optional(),
      benefits: Joi.string().optional(),
      color: Joi.string().optional()
    })
  },
  updateRank: {
    body: Joi.object().keys({
      name: Joi.string().optional(),
      displayName: Joi.string().optional(),
      description: Joi.string().optional(),
      minSpending: Joi.number().min(0).optional(),
      maxSpending: Joi.number().min(0).optional(),
      benefits: Joi.string().optional(),
      color: Joi.string().optional()
    })
  }
};

export default function createEmployeeCustomerRankRoutes(): express.Router {
  const router = express.Router();

  // Resolve service from container
  const customerRankService = container.resolve<CustomerRankService>(TOKENS.CustomerRankService);
  const controller = new EmployeeCustomerRankController(customerRankService);

  // All routes require authentication
  router.use(authEmployee);

  // Statistics route must come before :id route
  router.get('/statistics', controller.getRankStatistics);

  router.get('/', controller.getRanks);
  router.post('/', validate(customerRankValidation.createRank), controller.createRank);
  router.get('/:id', controller.getRankById);
  router.put('/:id', validate(customerRankValidation.updateRank), controller.updateRank);
  router.delete('/:id', controller.deleteRank);

  return router;
}
