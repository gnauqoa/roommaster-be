/**
 * System permission constants using RESOURCE.ACTION pattern
 * These are stored in the database (SystemFunction table) and assigned to UserGroups
 * Actions: create, read, update, delete (CRUD)
 */
export const PERMISSIONS = {
  // Employee management
  EMPLOYEE_CREATE: 'employee.create',
  EMPLOYEE_READ: 'employee.read',
  EMPLOYEE_UPDATE: 'employee.update',
  EMPLOYEE_DELETE: 'employee.delete',

  // Room management
  ROOM_CREATE: 'room.create',
  ROOM_READ: 'room.read',
  ROOM_UPDATE: 'room.update',
  ROOM_DELETE: 'room.delete',

  // Room type management
  ROOM_TYPE_CREATE: 'room_type.create',
  ROOM_TYPE_READ: 'room_type.read',
  ROOM_TYPE_UPDATE: 'room_type.update',
  ROOM_TYPE_DELETE: 'room_type.delete',

  // Service management
  SERVICE_CREATE: 'service.create',
  SERVICE_READ: 'service.read',
  SERVICE_UPDATE: 'service.update',
  SERVICE_DELETE: 'service.delete',

  // Customer management
  CUSTOMER_CREATE: 'customer.create',
  CUSTOMER_READ: 'customer.read',
  CUSTOMER_UPDATE: 'customer.update',
  CUSTOMER_DELETE: 'customer.delete',

  // Customer tier management
  CUSTOMER_TIER_CREATE: 'customer_tier.create',
  CUSTOMER_TIER_READ: 'customer_tier.read',
  CUSTOMER_TIER_UPDATE: 'customer_tier.update',
  CUSTOMER_TIER_DELETE: 'customer_tier.delete',

  // Reservation management
  RESERVATION_CREATE: 'reservation.create',
  RESERVATION_READ: 'reservation.read',
  RESERVATION_UPDATE: 'reservation.update',
  RESERVATION_DELETE: 'reservation.delete',

  // Stay record management
  STAY_RECORD_CREATE: 'stay_record.create',
  STAY_RECORD_READ: 'stay_record.read',
  STAY_RECORD_UPDATE: 'stay_record.update',
  STAY_RECORD_DELETE: 'stay_record.delete',

  // Folio management
  FOLIO_CREATE: 'folio.create',
  FOLIO_READ: 'folio.read',
  FOLIO_UPDATE: 'folio.update',
  FOLIO_DELETE: 'folio.delete',

  // Payment management
  PAYMENT_CREATE: 'payment.create',
  PAYMENT_READ: 'payment.read',
  PAYMENT_UPDATE: 'payment.update',
  PAYMENT_DELETE: 'payment.delete',

  // Housekeeping management
  HOUSEKEEPING_CREATE: 'housekeeping.create',
  HOUSEKEEPING_READ: 'housekeeping.read',
  HOUSEKEEPING_UPDATE: 'housekeeping.update',
  HOUSEKEEPING_DELETE: 'housekeeping.delete',

  // Shift management
  SHIFT_CREATE: 'shift.create',
  SHIFT_READ: 'shift.read',
  SHIFT_UPDATE: 'shift.update',
  SHIFT_DELETE: 'shift.delete',

  // Shift session management
  SHIFT_SESSION_MANAGE: 'shift_session.manage',
  SHIFT_SESSION_READ: 'shift_session.read',
  SHIFT_SESSION_APPROVE: 'shift_session.approve',

  // Promotion management
  PROMOTION_CREATE: 'promotion.create',
  PROMOTION_READ: 'promotion.read',
  PROMOTION_UPDATE: 'promotion.update',
  PROMOTION_DELETE: 'promotion.delete',

  // Rate policy management
  RATE_POLICY_CREATE: 'rate_policy.create',
  RATE_POLICY_READ: 'rate_policy.read',
  RATE_POLICY_UPDATE: 'rate_policy.update',
  RATE_POLICY_DELETE: 'rate_policy.delete',

  // Invoice management
  INVOICE_CREATE: 'invoice.create',
  INVOICE_READ: 'invoice.read',
  INVOICE_UPDATE: 'invoice.update',
  INVOICE_DELETE: 'invoice.delete',

  // Room inspection management
  INSPECTION_CREATE: 'inspection.create',
  INSPECTION_READ: 'inspection.read',
  INSPECTION_UPDATE: 'inspection.update',

  // Report management
  REPORT_READ: 'report.read',

  // Nightly job management
  NIGHTLY_JOB_RUN: 'nightly_job.run',

  // User group management
  USER_GROUP_CREATE: 'user_group.create',
  USER_GROUP_READ: 'user_group.read',
  USER_GROUP_UPDATE: 'user_group.update',
  USER_GROUP_DELETE: 'user_group.delete',

  // System parameter management
  SYSTEM_PARAMETER_READ: 'system_parameter.read',
  SYSTEM_PARAMETER_UPDATE: 'system_parameter.update'
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
