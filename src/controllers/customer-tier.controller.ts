import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import CustomerTierService from '../services/customer-tier.service';
import pick from '../utils/pick';
import { Injectable } from 'core/decorators';

@Injectable()
export class CustomerTierController {
  constructor(private readonly customerTierService: CustomerTierService) {}

  createCustomerTier = catchAsync(async (req: Request, res: Response) => {
    const tier = await this.customerTierService.createCustomerTier(req.body);
    res.status(httpStatus.CREATED).send(tier);
  });

  getCustomerTiers = catchAsync(async (req: Request, res: Response) => {
    const filter = pick(req.query, ['name', 'sortBy', 'sortType', 'limit', 'page']);
    const result = await this.customerTierService.queryCustomerTiers(filter);
    res.send(result);
  });

  getCustomerTier = catchAsync(async (req: Request, res: Response) => {
    const tier = await this.customerTierService.getCustomerTierById(Number(req.params.tierId));
    res.send(tier);
  });

  updateCustomerTier = catchAsync(async (req: Request, res: Response) => {
    const tier = await this.customerTierService.updateCustomerTier(
      Number(req.params.tierId),
      req.body
    );
    res.send(tier);
  });

  deleteCustomerTier = catchAsync(async (req: Request, res: Response) => {
    await this.customerTierService.deleteCustomerTier(Number(req.params.tierId));
    res.status(httpStatus.NO_CONTENT).send();
  });

  checkUpgrade = catchAsync(async (req: Request, res: Response) => {
    const result = await this.customerTierService.checkAndUpgradeCustomerTier(
      Number(req.params.customerId)
    );
    res.send(result);
  });

  batchUpgrade = catchAsync(async (req: Request, res: Response) => {
    const result = await this.customerTierService.batchUpgradeCustomerTiers();
    res.send(result);
  });
}

export default CustomerTierController;
