import Joi from 'joi';
import { FeeType } from '@/services/app-setting.types';

const timeConfig = {
  body: Joi.object({
    hour: Joi.number().integer().min(0).max(23).required(),
    minute: Joi.number().integer().min(0).max(59).required(),
    gracePeriodMinutes: Joi.number().integer().min(0).max(240).required()
  })
};

const feeConfig = {
  body: Joi.object({
    enabled: Joi.boolean().required(),
    type: Joi.string()
      .valid(...Object.values(FeeType))
      .required(),
    amount: Joi.number().min(0).required(),
    applyAfterGracePeriod: Joi.boolean().required()
  })
};

const updateCheckInTime = timeConfig;
const updateCheckOutTime = timeConfig;
const updateEarlyCheckInFee = feeConfig;
const updateLateCheckOutFee = feeConfig;

const updateDepositPercentage = {
  body: Joi.object({
    percentage: Joi.number().min(0).max(100).required()
  })
};

export default {
  updateCheckInTime,
  updateCheckOutTime,
  updateEarlyCheckInFee,
  updateLateCheckOutFee,
  updateDepositPercentage
};
