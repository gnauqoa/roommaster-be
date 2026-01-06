import { APP_SETTING_KEYS } from '@/constants/app-settings.constant';

export const ConfigKey = APP_SETTING_KEYS;
export type ConfigKey = (typeof ConfigKey)[keyof typeof ConfigKey];

export enum FeeType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
  HOURLY = 'HOURLY'
}

export interface TimeConfig {
  hour: number;
  minute: number;
  gracePeriodMinutes: number;
}

export interface FeeConfig {
  enabled: boolean;
  type: FeeType;
  amount: number;
  applyAfterGracePeriod: boolean;
}

export type CheckInTimeConfig = TimeConfig;
export type CheckOutTimeConfig = TimeConfig;
export type EarlyCheckInFeeConfig = FeeConfig;
export type LateCheckOutFeeConfig = FeeConfig;

export interface DepositPercentageConfig {
  percentage: number; // 0-100, e.g., 50 = 50%
}
