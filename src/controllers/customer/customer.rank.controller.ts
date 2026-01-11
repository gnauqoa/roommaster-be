// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../types/express.d.ts" />
import { Injectable } from '@/core/decorators';
import { Request, Response } from 'express';
import catchAsync from '@/utils/catchAsync';
import CustomerRankService from '@/services/customer-rank.service';
import { sendData } from '@/utils/responseWrapper';

@Injectable()
export class CustomerRankController {
  constructor(private readonly customerRankService: CustomerRankService) {}

  /**
   * Get all customer ranks
   * GET /v1/customer/ranks
   * Public endpoint for customers to see available tiers and benefits
   */
  getRanks = catchAsync(async (req: Request, res: Response) => {
    const ranks = await this.customerRankService.getRanks();
    // Don't expose internal stats like customer count to public
    const publicRanks = ranks.map((rank) => ({
      id: rank.id,
      name: rank.name,
      displayName: rank.displayName,
      description: rank.description,
      minSpending: rank.minSpending,
      maxSpending: rank.maxSpending,
      benefits: rank.benefits,
      color: rank.color
    }));
    sendData(res, publicRanks);
  });

  /**
   * Get rank details by ID
   * GET /v1/customer/ranks/:id
   */
  getRankById = catchAsync(async (req: Request, res: Response) => {
    const rank = await this.customerRankService.getRankById(req.params.id);
    sendData(res, {
      id: rank.id,
      name: rank.name,
      displayName: rank.displayName,
      description: rank.description,
      minSpending: rank.minSpending,
      maxSpending: rank.maxSpending,
      benefits: rank.benefits,
      color: rank.color
    });
  });
}

export default CustomerRankController;
