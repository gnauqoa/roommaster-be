/**
 * App Setting Keys
 * Centralized constants for app setting keys to ensure consistency across the application
 */

export const APP_SETTING_KEYS = {
  CHECKIN_TIME: 'checkin_time',
  CHECKOUT_TIME: 'checkout_time',
  DEPOSIT_PERCENTAGE: 'deposit_percentage',
  PAYMENT_QR_CODE: 'payment_qr_code'
} as const;

export type AppSettingKey = (typeof APP_SETTING_KEYS)[keyof typeof APP_SETTING_KEYS];
