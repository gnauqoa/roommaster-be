import express from 'express';
import CustomerRankController from '@/controllers/customer/customer.rank.controller';
import { container, TOKENS } from '@/core/container';
import CustomerRankService from '@/services/customer-rank.service';

export default function createCustomerRankRoutes(): express.Router {
  const router = express.Router();

  const customerRankService = container.resolve<CustomerRankService>(TOKENS.CustomerRankService);
  const controller = new CustomerRankController(customerRankService);

  /**
   * @swagger
   * /customer/ranks:
   *   get:
   *     summary: Get all VIP ranks
   *     tags: [Customer - Ranks]
   *     responses:
   *       200:
   *         description: List of all VIP ranks with benefits
   */
  router.get('/', controller.getRanks);

  /**
   * @swagger
   * /customer/ranks/{id}:
   *   get:
   *     summary: Get rank details
   *     tags: [Customer - Ranks]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Rank details
   */
  router.get('/:id', controller.getRankById);

  return router;
}
