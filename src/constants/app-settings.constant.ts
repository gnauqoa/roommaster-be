/**
 * App Setting Keys
 * Centralized constants for app setting keys to ensure consistency across the application
 */

export const APP_SETTING_KEYS = {
  CHECKIN_TIME: 'checkin_time',
  CHECKOUT_TIME: 'checkout_time',
  DEPOSIT_PERCENTAGE: 'deposit_percentage',
  PENALTY_SERVICE_ID: 'penalty_service_id',
  SURCHARGE_SERVICE_ID: 'surcharge_service_id'
} as const;

export type AppSettingKey = (typeof APP_SETTING_KEYS)[keyof typeof APP_SETTING_KEYS];
