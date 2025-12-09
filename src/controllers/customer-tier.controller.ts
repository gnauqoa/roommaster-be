import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { customerTierService } from '../services';
import pick from '../utils/pick';

const createCustomerTier = catchAsync(async (req: Request, res: Response) => {
  const tier = await customerTierService.createCustomerTier(req.body);
  res.status(httpStatus.CREATED).send(tier);
});

const getCustomerTiers = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'sortBy', 'sortType', 'limit', 'page']);
  const result = await customerTierService.queryCustomerTiers(filter);
  res.send(result);
});

const getCustomerTier = catchAsync(async (req: Request, res: Response) => {
  const tier = await customerTierService.getCustomerTierById(Number(req.params.tierId));
  res.send(tier);
});

const updateCustomerTier = catchAsync(async (req: Request, res: Response) => {
  const tier = await customerTierService.updateCustomerTier(Number(req.params.tierId), req.body);
  res.send(tier);
});

const deleteCustomerTier = catchAsync(async (req: Request, res: Response) => {
  await customerTierService.deleteCustomerTier(Number(req.params.tierId));
  res.status(httpStatus.NO_CONTENT).send();
});

const checkUpgrade = catchAsync(async (req: Request, res: Response) => {
  const result = await customerTierService.checkAndUpgradeCustomerTier(
    Number(req.params.customerId)
  );
  res.send(result);
});

const batchUpgrade = catchAsync(async (req: Request, res: Response) => {
  const result = await customerTierService.batchUpgradeCustomerTiers();
  res.send(result);
});

export default {
  createCustomerTier,
  getCustomerTiers,
  getCustomerTier,
  updateCustomerTier,
  deleteCustomerTier,
  checkUpgrade,
  batchUpgrade
};
