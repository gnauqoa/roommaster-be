// Class exports for DI
export { AuthController } from './auth.controller';
export { EmployeeController } from './employee.controller';

// Re-export getters from bootstrap for convenience
export { getAuthController, getEmployeeController } from 'core/bootstrap';

// Note: The following controllers need to be converted to class-based pattern
// For now, they are exported as default objects for backward compatibility
export { default as roomController } from './room.controller';
export { default as customerController } from './customer.controller';
export { default as reservationController } from './reservation.controller';
export { default as stayRecordController } from './stay-record.controller';
export { default as folioController } from './folio.controller';
export { default as serviceController } from './service.controller';
export { default as housekeepingController } from './housekeeping.controller';
export { default as invoiceController } from './invoice.controller';
export { default as inspectionController } from './inspection.controller';
export { default as customerTierController } from './customer-tier.controller';
export { default as shiftController } from './shift.controller';
export { default as nightlyController } from './nightly.controller';
export { default as reportController } from './report.controller';
