import express from 'express';
import authRoute from './auth.route';
import employeeRoute from './employee.route';
import roomRoute from './room.route';
import customerRoute from './customer.route';
import reservationRoute from './reservation.route';
import stayRecordRoute from './stay-record.route';
import folioRoute from './folio.route';
import serviceRoute from './service.route';
import housekeepingRoute from './housekeeping.route';
import invoiceRoute from './invoice.route';
import inspectionRoute from './inspection.route';
import customerTierRoute from './customer-tier.route';
import shiftRoute from './shift.route';
import reportRoute from './report.route';
import nightlyRoute from './nightly.route';
import docsRoute from './docs.route';
import config from 'config/env';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute
  },
  {
    path: '/employees',
    route: employeeRoute
  },
  {
    path: '/rooms',
    route: roomRoute
  },
  {
    path: '/customers',
    route: customerRoute
  },
  {
    path: '/reservations',
    route: reservationRoute
  },
  {
    path: '/stay-records',
    route: stayRecordRoute
  },
  {
    path: '/folios',
    route: folioRoute
  },
  {
    path: '/services',
    route: serviceRoute
  },
  {
    path: '/housekeeping',
    route: housekeepingRoute
  },
  {
    path: '/invoices',
    route: invoiceRoute
  },
  {
    path: '/inspections',
    route: inspectionRoute
  },
  {
    path: '/customer-tiers',
    route: customerTierRoute
  },
  {
    path: '/shifts',
    route: shiftRoute
  },
  {
    path: '/reports',
    route: reportRoute
  },
  {
    path: '/nightly',
    route: nightlyRoute
  }
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
