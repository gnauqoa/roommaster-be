/**
 * Configuration file for API documentation generator
 */

export interface ApiDocsConfig {
  // Authentication credentials
  auth: {
    email: string;
    password: string;
  };

  // Sample data for testing different endpoints
  sampleData: {
    [endpoint: string]: any;
  };

  // Endpoints to skip (if they cause issues or are deprecated)
  skipEndpoints: string[];

  // Custom descriptions for endpoints
  descriptions: {
    [endpoint: string]: string;
  };

  // Request timeout in milliseconds
  timeout: number;

  // Delay between requests in milliseconds
  delayBetweenRequests: number;
}

export const config: ApiDocsConfig = {
  auth: {
    email: 'admin@hotel.com',
    password: 'password123'
  },

  sampleData: {
    // Auth endpoints
    'POST /v1/auth/register': {
      email: 'newuser@hotel.com',
      password: 'Password123!',
      name: 'New User',
      role: 'receptionist'
    },
    'POST /v1/auth/login': {
      email: 'admin@hotel.com',
      password: 'password123'
    },
    'POST /v1/auth/refresh-tokens': {
      refreshToken: 'sample-refresh-token'
    },
    'POST /v1/auth/forgot-password': {
      email: 'admin@hotel.com'
    },
    'POST /v1/auth/reset-password': {
      token: 'sample-reset-token',
      password: 'NewPassword123!'
    },

    // Employee endpoints
    'POST /v1/employees': {
      email: 'employee@hotel.com',
      name: 'John Doe',
      password: 'Password123!',
      phoneNumber: '+1234567890',
      role: 'receptionist'
    },
    'PATCH /v1/employees/:id': {
      name: 'John Doe Updated',
      phoneNumber: '+1234567890'
    },

    // Room endpoints
    'POST /v1/rooms/types': {
      code: 'DELUXE',
      name: 'Deluxe Room',
      basePrice: 150.0,
      maxGuests: 2,
      description: 'A comfortable deluxe room with city view'
    },
    'PATCH /v1/rooms/types/:id': {
      basePrice: 160.0,
      description: 'Updated deluxe room description'
    },
    'POST /v1/rooms': {
      roomNumber: '201',
      floor: 2,
      roomTypeId: 1,
      status: 'AVAILABLE'
    },
    'PATCH /v1/rooms/:id': {
      status: 'MAINTENANCE'
    },

    // Customer endpoints
    'POST /v1/customers': {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phoneNumber: '+1987654321',
      idNumber: 'ID123456',
      address: '123 Main St, City, Country',
      dateOfBirth: '1990-01-01'
    },
    'PATCH /v1/customers/:id': {
      phoneNumber: '+1987654322',
      address: '456 Oak Ave, City, Country'
    },

    // Reservation endpoints
    'POST /v1/reservations': {
      customerId: 1,
      roomTypeId: 1,
      checkIn: '2025-12-20',
      checkOut: '2025-12-25',
      numberOfGuests: 2,
      specialRequests: 'Late check-in requested'
    },
    'PATCH /v1/reservations/:id': {
      specialRequests: 'Updated special requests',
      numberOfGuests: 3
    },
    'POST /v1/reservations/:id/check-in': {
      roomId: 1
    },

    // Service endpoints
    'POST /v1/services': {
      name: 'Room Service',
      description: 'Food and beverage delivery to room',
      price: 25.0,
      category: 'FOOD_BEVERAGE'
    },
    'PATCH /v1/services/:id': {
      price: 30.0,
      description: 'Updated room service'
    },

    // Folio endpoints
    'POST /v1/folios/:folioId/charges': {
      serviceId: 1,
      quantity: 2,
      description: 'Room service - breakfast'
    },
    'POST /v1/folios/:folioId/payments': {
      amount: 100.0,
      paymentMethod: 'CASH',
      referenceNumber: 'CASH001'
    },

    // Housekeeping endpoints
    'POST /v1/housekeeping/tasks': {
      roomId: 1,
      assignedTo: 1,
      taskType: 'CLEANING',
      priority: 'MEDIUM',
      notes: 'Standard cleaning required'
    },
    'PATCH /v1/housekeeping/tasks/:taskId': {
      status: 'IN_PROGRESS',
      notes: 'Cleaning in progress'
    },

    // Inspection endpoints
    'POST /v1/inspections': {
      roomId: 1,
      inspectorId: 1,
      inspectionType: 'ROUTINE',
      notes: 'Routine inspection'
    },
    'POST /v1/inspections/:id/items': {
      item: 'Bathroom',
      status: 'PASS',
      notes: 'Clean and well-maintained'
    },

    // Customer Tier endpoints
    'POST /v1/customer-tiers': {
      name: 'Gold',
      minSpending: 1000.0,
      discountPercentage: 10,
      benefits: 'Free breakfast, room upgrade'
    },
    'PATCH /v1/customer-tiers/:id': {
      discountPercentage: 15,
      benefits: 'Free breakfast, room upgrade, late checkout'
    },

    // Shift endpoints
    'POST /v1/shifts': {
      employeeId: 1,
      startTime: '2025-12-15T08:00:00Z',
      endTime: '2025-12-15T16:00:00Z',
      shiftType: 'MORNING'
    },
    'PATCH /v1/shifts/:id': {
      notes: 'Shift completed successfully'
    }
  },

  skipEndpoints: [
    // Add any endpoints that should be skipped
    // Example: 'DELETE /v1/employees/:id'
  ],

  descriptions: {
    'POST /v1/auth/login': 'Authenticate a user and receive JWT tokens for subsequent requests',
    'POST /v1/auth/register': 'Register a new employee account in the system',
    'GET /v1/rooms': 'Retrieve a list of all rooms with optional filtering',
    'GET /v1/reservations': 'Get all reservations with optional date and status filters',
    'POST /v1/reservations/:id/check-in': 'Check in a guest to their reserved room',
    'POST /v1/folios/:folioId/charges': 'Add a charge to a guest folio',
    'POST /v1/folios/:folioId/payments': 'Record a payment against a folio',
    'GET /v1/reports/revenue': 'Generate revenue report for specified date range',
    'POST /v1/nightly/run': 'Execute the nightly batch process (room status updates, etc.)'
  },

  timeout: 5000,
  delayBetweenRequests: 100
};

export default config;
