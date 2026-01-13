import Joi from 'joi';

// ==================== ROOM AVAILABILITY REPORTS ====================

const checkRoomAvailability = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    roomTypeId: Joi.string().optional()
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
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(20).optional(),
    sortBy: Joi.string()
      .valid('totalSpent', 'totalNights', 'lastStayDate')
      .default('totalSpent')
      .optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc').optional()
  })
};

const getFirstTimeGuests = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
  })
};

const getCustomerLifetimeValue = {
  query: Joi.object().keys({
    minSpent: Joi.number().min(0).optional(),
    minBookings: Joi.number().integer().min(1).optional()
  })
};

const getCustomerRankDistribution = {
  query: Joi.object().keys({})
};

// ==================== EMPLOYEE REPORTS ====================

const getEmployeeBookingPerformance = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    employeeId: Joi.string().optional()
  })
};

const getEmployeeServicePerformance = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    employeeId: Joi.string().optional()
  })
};

const getEmployeeActivitySummary = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    employeeId: Joi.string().optional(),
    activityTypes: Joi.string().optional() // Comma-separated list
  })
};

// ==================== SERVICE REPORTS ====================

const getServiceUsageStatistics = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    serviceId: Joi.string().optional()
  })
};

const getTopServicesByRevenue = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    limit: Joi.number().integer().min(1).max(50).default(10).optional()
  })
};

const getServicePerformanceTrend = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    groupBy: Joi.string().valid('day', 'week', 'month').default('month').optional(),
    serviceId: Joi.string().optional()
  })
};

// ==================== REVENUE REPORTS ====================

const getRevenueSummary = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    groupBy: Joi.string()
      .valid('day', 'week', 'month', 'quarter', 'year')
      .default('month')
      .optional()
  })
};

const getRevenueByRoomType = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  })
};

const getPaymentMethodDistribution = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  })
};

const getPromotionEffectiveness = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    promotionId: Joi.string().optional()
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
