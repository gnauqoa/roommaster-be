// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '@/utils/catchAsync';
import CustomerRankService from '@/services/customer-rank.service';
import { sendData } from '@/utils/responseWrapper';

@Injectable()
export class EmployeeCustomerRankController {
  constructor(private readonly customerRankService: CustomerRankService) {}

  /**
   * Get all customer ranks
   * GET /employee/ranks
   */
  getRanks = catchAsync(async (req: Request, res: Response) => {
    const ranks = await this.customerRankService.getRanks();
    sendData(res, ranks);
  });

  /**
   * Get rank by ID
   * GET /employee/ranks/:id
   */
  getRankById = catchAsync(async (req: Request, res: Response) => {
    const rank = await this.customerRankService.getRankById(req.params.id);
    sendData(res, rank);
  });

  /**
   * Create new rank
   * POST /employee/ranks
   */
  createRank = catchAsync(async (req: Request, res: Response) => {
    const rank = await this.customerRankService.createRank(req.body);
    sendData(res, rank, httpStatus.CREATED);
  });

  /**
   * Update rank
   * PUT /employee/ranks/:id
   */
  updateRank = catchAsync(async (req: Request, res: Response) => {
    const rank = await this.customerRankService.updateRank(req.params.id, req.body);
    sendData(res, rank);
  });

  /**
   * Delete rank
   * DELETE /employee/ranks/:id
   */
  deleteRank = catchAsync(async (req: Request, res: Response) => {
    const result = await this.customerRankService.deleteRank(req.params.id);
    sendData(res, result);
  });

  /**
   * Get rank statistics
   * GET /employee/ranks/statistics
   */
  getRankStatistics = catchAsync(async (req: Request, res: Response) => {
    const stats = await this.customerRankService.getRankStatistics();
    sendData(res, stats);
  });

  /**
   * Set customer rank manually
   * PUT /employee/customers/:customerId/rank
   */
  setCustomerRank = catchAsync(async (req: Request, res: Response) => {
    const { customerId } = req.params;
    const { rankId } = req.body;
    const employeeId = (req as any).user?.id || ''; // From auth middleware

    await this.customerRankService.setCustomerRank(customerId, rankId, employeeId);
    sendData(res, { message: 'Customer rank updated successfully' });
  });
}

export default EmployeeCustomerRankController;
