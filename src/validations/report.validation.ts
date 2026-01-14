import Joi from 'joi';

// ==================== ROOM AVAILABILITY REPORTS ====================

const checkRoomAvailability = {
  query: Joi.object().keys({
    checkInDate: Joi.date().iso().required(),
    checkOutDate: Joi.date().iso().min(Joi.ref('checkInDate')).required(),
    roomTypeId: Joi.string().optional(),
    capacity: Joi.number().integer().min(1).optional(),
    floor: Joi.number().integer().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional()
  })
};

const getOccupancyForecast = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    groupBy: Joi.string().valid('day', 'week', 'month').default('day').optional()
  })
};

// ==================== CUSTOMER REPORTS ====================

const getCustomerStayHistory = {
  query: Joi.object().keys({
    fromDate: Joi.date().iso().optional(),
    toDate: Joi.date().iso().min(Joi.ref('fromDate')).optional(),
    rankId: Joi.string().optional(),
    minStays: Joi.number().integer().min(1).optional(),
    minTotalSpent: Joi.number().min(0).optional(),
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(20).optional(),
    sortBy: Joi.string()
      .valid('totalSpent', 'totalStays', 'lastVisit')
      .default('totalSpent')
      .optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional()
  })
};

const getFirstTimeGuests = {
  query: Joi.object().keys({
    fromDate: Joi.date().iso().required(),
    toDate: Joi.date().iso().min(Joi.ref('fromDate')).required(),
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(20).optional()
  })
};

const getCustomerLifetimeValue = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100).default(50).optional()
  })
};

const getCustomerRankDistribution = {
  query: Joi.object().keys({})
};

// ==================== EMPLOYEE REPORTS ====================

const getEmployeeBookingPerformance = {
  query: Joi.object().keys({
    fromDate: Joi.date().iso().required(),
    toDate: Joi.date().iso().min(Joi.ref('fromDate')).required(),
    employeeId: Joi.string().optional(),
    sortBy: Joi.string()
      .valid('totalBookings', 'totalRevenue', 'totalTransactions')
      .default('totalRevenue')
      .optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional()
  })
};

const getEmployeeServicePerformance = {
  query: Joi.object().keys({
    fromDate: Joi.date().iso().required(),
    toDate: Joi.date().iso().min(Joi.ref('fromDate')).required(),
    employeeId: Joi.string().optional()
  })
};

const getEmployeeActivitySummary = {
  query: Joi.object().keys({
    fromDate: Joi.date().iso().optional(),
    toDate: Joi.date().iso().min(Joi.ref('fromDate')).optional(),
    employeeId: Joi.string().optional(),
    activityTypes: Joi.string().optional() // Comma-separated list
  })
};

// ==================== SERVICE REPORTS ====================

const getServiceUsageStatistics = {
  query: Joi.object().keys({
    fromDate: Joi.date().iso().required(),
    toDate: Joi.date().iso().min(Joi.ref('fromDate')).required(),
    serviceId: Joi.string().optional(),
    status: Joi.string().valid('PENDING', 'TRANSFERRED', 'COMPLETED', 'CANCELLED').optional()
  })
};

const getTopServicesByRevenue = {
  query: Joi.object().keys({
    fromDate: Joi.date().iso().required(),
    toDate: Joi.date().iso().min(Joi.ref('fromDate')).required(),
    limit: Joi.number().integer().min(1).max(50).default(10).optional()
  })
};

const getServicePerformanceTrend = {
  query: Joi.object().keys({
    fromDate: Joi.date().iso().required(),
    toDate: Joi.date().iso().min(Joi.ref('fromDate')).required(),
    groupBy: Joi.string().valid('day', 'week', 'month').default('day').optional(),
    serviceId: Joi.string().optional()
  })
};

// ==================== REVENUE REPORTS ====================

const getRevenueSummary = {
  query: Joi.object().keys({
    fromDate: Joi.date().iso().required(),
    toDate: Joi.date().iso().min(Joi.ref('fromDate')).required(),
    groupBy: Joi.string().valid('day', 'week', 'month', 'quarter', 'year').default('day').optional()
  })
};

const getRevenueByRoomType = {
  query: Joi.object().keys({
    fromDate: Joi.date().iso().required(),
    toDate: Joi.date().iso().min(Joi.ref('fromDate')).required()
  })
};

const getPaymentMethodDistribution = {
  query: Joi.object().keys({
    fromDate: Joi.date().iso().required(),
    toDate: Joi.date().iso().min(Joi.ref('fromDate')).required()
  })
};

const getPromotionEffectiveness = {
  query: Joi.object().keys({
    fromDate: Joi.date().iso().required(),
    toDate: Joi.date().iso().min(Joi.ref('fromDate')).required()
  })
};

export default {
  // Room reports
  checkRoomAvailability,
  getOccupancyForecast,

  // Customer reports
  getCustomerStayHistory,
  getFirstTimeGuests,
  getCustomerLifetimeValue,
  getCustomerRankDistribution,

  // Employee reports
  getEmployeeBookingPerformance,
  getEmployeeServicePerformance,
  getEmployeeActivitySummary,

  // Service reports
  getServiceUsageStatistics,
  getTopServicesByRevenue,
  getServicePerformanceTrend,

  // Revenue reports
  getRevenueSummary,
  getRevenueByRoomType,
  getPaymentMethodDistribution,
  getPromotionEffectiveness
};
