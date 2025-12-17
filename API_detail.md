# Mock Data for Hotel Management System API

This file contains mock data for the API routes documented in `API_DOCUMENTATION.md`.

## Authentication

### POST /v1/auth/login

**Request Body:**

```json
{
  "email": "admin@hotel.com",
  "password": "password123"
}
```

**Success Response (200):**

```json
{
  "employee": {
    "id": 6,
    "code": "EMP001",
    "name": "Admin User",
    "email": "admin@hotel.com",
    "phone": "0123456789",
    "userGroupId": 1,
    "isActive": true,
    "createdAt": "2025-12-14T07:29:18.129Z",
    "updatedAt": "2025-12-14T07:29:18.129Z"
  },
  "tokens": {
    "access": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjYsImlhdCI6MTc2NTY5ODY2OSwiZXhwIjoxNzY1NzAwNDY5LCJ0eXBlIjoiQUNDRVNTIn0.lLkHOlNmGO4r4W1x0m85lIkGf8EsTaJCAyfBVyVmaHQ",
      "expires": "2025-12-14T08:21:09.359Z"
    },
    "refresh": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjYsImlhdCI6MTc2NTY5ODY2OSwiZXhwIjoxNzY8MjkwNjY5LCJ0eXBlIjoiUkVGUkVTSCJ9.tpOg654Q0to0D8VO1aIQiZvjYu2zxCnAGidPi-KB7aY",
      "expires": "2026-01-13T07:51:09.364Z"
    }
  }
}
```

### POST /v1/auth/logout

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjYsImlhdCI6MTc2NTY5ODY2OSwiZXhwIjoxNzY8MjkwNjY5LCJ0eXBlIjoiUkVGUkVTSCJ9.tpOg654Q0to0D8VO1aIQiZvjYu2zxCnAGidPi-KB7aY"
}
```

**Success Response (204):**
(No Content)

### POST /v1/auth/refresh-tokens

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjYsImlhdCI6MTc2NTY5ODY2OSwiZXhwIjoxNzY8MjkwNjY5LCJ0eXBlIjoiUkVGUkVTSCJ9.tpOg654Q0to0D8VO1aIQiZvjYu2zxCnAGidPi-KB7aY"
}
```

**Success Response (200):**

```json
{
  "access": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjYsImlhdCI6MTc2NTY5ODY2OSwiZXhwIjoxNzY1NzAwNDY5LCJ0eXBlIjoiQUNDRVNTIn0.newAccessToken",
    "expires": "2025-12-14T09:21:09.359Z"
  },
  "refresh": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjYsImlhdCI6MTc2NTY5ODY2OSwiZXhwIjoxNzY8MjkwNjY5LCJ0eXBlIjoiUkVGUkVTSCJ9.newRefreshToken",
    "expires": "2026-01-13T08:51:09.364Z"
  }
}
```

### POST /v1/auth/change-password

**Request Body:**

```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword456"
}
```

**Success Response (204):**
(No Content)

### GET /v1/auth/me

**Success Response (200):**

```json
{
  "id": 6,
  "code": "EMP001",
  "name": "Admin User",
  "email": "admin@hotel.com",
  "phone": "0123456789",
  "userGroupId": 1,
  "isActive": true,
  "createdAt": "2025-12-14T07:29:18.129Z",
  "updatedAt": "2025-12-14T07:29:18.129Z",
  "userGroup": {
    "id": 1,
    "code": "ADMIN_GROUP",
    "name": "Administrator",
    "description": "Full system access with all permissions",
    "createdAt": "2025-12-14T05:55:42.091Z",
    "updatedAt": "2025-12-14T05:55:42.091Z"
  }
}
```

## Customer Tiers

### POST /v1/customer-tiers/

**Request Body:**

```json
{
  "code": "DIAMOND",
  "name": "Diamond",
  "pointsRequired": 5000,
  "roomDiscountFactor": 30,
  "serviceDiscountFactor": 25
}
```

**Success Response (201):**

```json
{
  "id": 6,
  "code": "DIAMOND",
  "name": "Diamond",
  "pointsRequired": 5000,
  "roomDiscountFactor": "30",
  "serviceDiscountFactor": "25",
  "createdAt": "2025-12-14T08:00:00.000Z",
  "updatedAt": "2025-12-14T08:00:00.000Z"
}
```

### GET /v1/customer-tiers/

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 3,
      "code": "GOLD",
      "name": "Gold",
      "pointsRequired": 500,
      "roomDiscountFactor": "10",
      "serviceDiscountFactor": "7",
      "createdAt": "2025-12-14T05:55:42.797Z",
      "updatedAt": "2025-12-14T05:55:42.797Z",
      "_count": {
        "customers": 10
      }
    },
    {
      "id": 4,
      "code": "PLATINUM",
      "name": "Platinum",
      "pointsRequired": 1500,
      "roomDiscountFactor": "15",
      "serviceDiscountFactor": "12",
      "createdAt": "2025-12-14T05:55:42.802Z",
      "updatedAt": "2025-12-14T05:55:42.802Z",
      "_count": {
        "customers": 5
      }
    }
  ],
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "totalResults": 2
}
```

### GET /v1/customer-tiers/:tierId

**Success Response (200):**

```json
{
  "id": 3,
  "code": "GOLD",
  "name": "Gold",
  "pointsRequired": 500,
  "roomDiscountFactor": "10",
  "serviceDiscountFactor": "7",
  "createdAt": "2025-12-14T05:55:42.797Z",
  "updatedAt": "2025-12-14T05:55:42.797Z",
  "_count": {
    "customers": 10
  }
}
```

### PATCH /v1/customer-tiers/:tierId

**Request Body:**

```json
{
  "name": "Gold Plus",
  "roomDiscountFactor": 12
}
```

**Success Response (200):**

```json
{
  "id": 3,
  "code": "GOLD",
  "name": "Gold Plus",
  "pointsRequired": 500,
  "roomDiscountFactor": "12",
  "serviceDiscountFactor": "7",
  "createdAt": "2025-12-14T05:55:42.797Z",
  "updatedAt": "2025-12-14T08:10:00.000Z"
}
```

### DELETE /v1/customer-tiers/:tierId

**Success Response (204):**
(No Content)

### POST /v1/customer-tiers/upgrade/:customerId

**Success Response (200):**

```json
{
  "upgraded": true,
  "oldTier": "SILVER",
  "newTier": "GOLD"
}
```

### POST /v1/customer-tiers/batch-upgrade

**Success Response (200):**

```json
{
  "totalCustomers": 150,
  "upgraded": 5,
  "upgrades": [
    {
      "customerId": 101,
      "oldTier": "SILVER",
      "newTier": "GOLD"
    },
    {
      "customerId": 205,
      "oldTier": "GOLD",
      "newTier": "PLATINUM"
    }
  ]
}
```

## Customers

### POST /v1/customers/

**Request Body:**

```json
{
  "code": "CUST002",
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "0987654321",
  "idNumber": "123456789",
  "nationality": "USA",
  "address": "123 Main St, New York",
  "customerType": "INDIVIDUAL"
}
```

**Success Response (201):**

```json
{
  "id": 6,
  "code": "CUST002",
  "tierId": 1,
  "fullName": "Jane Doe",
  "phone": "0987654321",
  "email": "jane.doe@example.com",
  "idNumber": "123456789",
  "nationality": "USA",
  "address": "123 Main St, New York",
  "customerType": "INDIVIDUAL",
  "loyaltyPoints": 0,
  "totalSpending": "0",
  "totalNights": 0,
  "lastStayDate": null,
  "createdAt": "2025-12-14T08:15:00.000Z",
  "updatedAt": "2025-12-14T08:15:00.000Z"
}
```

### GET /v1/customers/

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 5,
      "code": "TA001",
      "tierId": 3,
      "fullName": "Travel Agent XYZ",
      "phone": "0284567890",
      "email": "booking@travelxyz.com",
      "idNumber": "9876543210",
      "nationality": "Vietnam",
      "address": "321 Pasteur, Q.3, TP.HCM",
      "customerType": "TRAVEL_AGENT",
      "loyaltyPoints": 1200,
      "totalSpending": "50000000",
      "totalNights": 50,
      "lastStayDate": null,
      "createdAt": "2025-12-14T05:55:42.849Z",
      "updatedAt": "2025-12-14T05:55:42.849Z",
      "tier": {
        "id": 3,
        "code": "GOLD",
        "name": "Gold",
        "pointsRequired": 500,
        "roomDiscountFactor": "10",
        "serviceDiscountFactor": "7",
        "createdAt": "2025-12-14T05:55:42.797Z",
        "updatedAt": "2025-12-14T05:55:42.797Z"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### GET /v1/customers/search

**Query Parameters:** `q=Travel`

**Success Response (200):**

```json
[
  {
    "id": 5,
    "code": "TA001",
    "fullName": "Travel Agent XYZ",
    "email": "booking@travelxyz.com",
    "phone": "0284567890"
  }
]
```

### GET /v1/customers/:customerId

**Success Response (200):**

```json
{
  "id": 5,
  "code": "TA001",
  "tierId": 3,
  "fullName": "Travel Agent XYZ",
  "phone": "0284567890",
  "email": "booking@travelxyz.com",
  "idNumber": "9876543210",
  "nationality": "Vietnam",
  "address": "321 Pasteur, Q.3, TP.HCM",
  "customerType": "TRAVEL_AGENT",
  "loyaltyPoints": 1200,
  "totalSpending": "50000000",
  "totalNights": 50,
  "lastStayDate": null,
  "createdAt": "2025-12-14T05:55:42.849Z",
  "updatedAt": "2025-12-14T05:55:42.849Z",
  "tier": {
    "id": 3,
    "code": "GOLD",
    "name": "Gold",
    "pointsRequired": 500,
    "roomDiscountFactor": "10",
    "serviceDiscountFactor": "7",
    "createdAt": "2025-12-14T05:55:42.797Z",
    "updatedAt": "2025-12-14T05:55:42.797Z"
  }
}
```

### PATCH /v1/customers/:customerId

**Request Body:**

```json
{
  "phone": "0999888777",
  "address": "New Address, HCMC"
}
```

**Success Response (200):**

```json
{
  "id": 5,
  "code": "TA001",
  "tierId": 3,
  "fullName": "Travel Agent XYZ",
  "phone": "0999888777",
  "email": "booking@travelxyz.com",
  "idNumber": "9876543210",
  "nationality": "Vietnam",
  "address": "New Address, HCMC",
  "customerType": "TRAVEL_AGENT",
  "loyaltyPoints": 1200,
  "totalSpending": "50000000",
  "totalNights": 50,
  "lastStayDate": null,
  "createdAt": "2025-12-14T05:55:42.849Z",
  "updatedAt": "2025-12-14T08:20:00.000Z"
}
```

### DELETE /v1/customers/:customerId

**Success Response (204):**
(No Content)

## Employees

### POST /v1/employees/

**Request Body:**

```json
{
  "code": "EMP006",
  "name": "New Receptionist",
  "email": "reception@hotel.com",
  "password": "password123",
  "phone": "0123456799",
  "userGroupId": 2
}
```

**Success Response (201):**

```json
{
  "id": 7,
  "code": "EMP006",
  "name": "New Receptionist",
  "email": "reception@hotel.com",
  "phone": "0123456799",
  "userGroupId": 2,
  "isActive": true,
  "createdAt": "2025-12-14T08:25:00.000Z",
  "updatedAt": "2025-12-14T08:25:00.000Z"
}
```

### GET /v1/employees/

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 6,
      "code": "EMP001",
      "name": "Admin User",
      "email": "admin@hotel.com",
      "phone": "0123456789",
      "userGroupId": 1,
      "isActive": true,
      "createdAt": "2025-12-14T07:29:18.129Z",
      "updatedAt": "2025-12-14T07:29:18.129Z",
      "userGroup": {
        "id": 1,
        "code": "ADMIN_GROUP",
        "name": "Administrator",
        "description": "Full system access with all permissions",
        "createdAt": "2025-12-14T05:55:42.091Z",
        "updatedAt": "2025-12-14T05:55:42.091Z"
      }
    },
    {
      "id": 5,
      "code": "EMP005",
      "name": "Restaurant Waiter",
      "email": "waiter@hotel.com",
      "phone": "0123456793",
      "userGroupId": 5,
      "isActive": true,
      "createdAt": "2025-12-14T05:55:42.779Z",
      "updatedAt": "2025-12-14T05:55:42.779Z",
      "userGroup": {
        "id": 5,
        "code": "WAITER_GROUP",
        "name": "Waiter",
        "description": "Food & Beverage service operations",
        "createdAt": "2025-12-14T05:55:42.107Z",
        "updatedAt": "2025-12-14T05:55:42.107Z"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 2
  }
}
```

### GET /v1/employees/:employeeId

**Success Response (200):**

```json
{
  "id": 5,
  "code": "EMP005",
  "name": "Restaurant Waiter",
  "email": "waiter@hotel.com",
  "phone": "0123456793",
  "userGroupId": 5,
  "isActive": true,
  "createdAt": "2025-12-14T05:55:42.779Z",
  "updatedAt": "2025-12-14T05:55:42.779Z",
  "userGroup": {
    "id": 5,
    "code": "WAITER_GROUP",
    "name": "Waiter",
    "description": "Food & Beverage service operations",
    "createdAt": "2025-12-14T05:55:42.107Z",
    "updatedAt": "2025-12-14T05:55:42.107Z"
  }
}
```

### PATCH /v1/employees/:employeeId

**Request Body:**

```json
{
  "isActive": false
}
```

**Success Response (200):**

```json
{
  "id": 5,
  "code": "EMP005",
  "name": "Restaurant Waiter",
  "email": "waiter@hotel.com",
  "phone": "0123456793",
  "userGroupId": 5,
  "isActive": false,
  "createdAt": "2025-12-14T05:55:42.779Z",
  "updatedAt": "2025-12-14T08:30:00.000Z"
}
```

### DELETE /v1/employees/:employeeId

**Success Response (204):**
(No Content)

## Folios

### POST /v1/folios/

**Request Body:**

```json
{
  "billToCustomerId": 5,
  "notes": "Folio for Travel Agent XYZ"
}
```

**Success Response (201):**

```json
{
  "id": 10,
  "code": "FOL-20251214-001",
  "billToCustomerId": 5,
  "status": "OPEN",
  "totalAmount": "0",
  "paidAmount": "0",
  "balance": "0",
  "notes": "Folio for Travel Agent XYZ",
  "createdAt": "2025-12-14T08:35:00.000Z",
  "updatedAt": "2025-12-14T08:35:00.000Z"
}
```

### GET /v1/folios/

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 10,
      "code": "FOL-20251214-001",
      "billToCustomerId": 5,
      "status": "OPEN",
      "totalAmount": "1500000",
      "paidAmount": "500000",
      "balance": "1000000",
      "notes": "Folio for Travel Agent XYZ",
      "createdAt": "2025-12-14T08:35:00.000Z",
      "updatedAt": "2025-12-14T08:35:00.000Z",
      "customer": {
        "id": 5,
        "fullName": "Travel Agent XYZ"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### GET /v1/folios/:folioId

**Success Response (200):**

```json
{
  "id": 10,
  "code": "FOL-20251214-001",
  "billToCustomerId": 5,
  "status": "OPEN",
  "totalAmount": "1500000",
  "paidAmount": "500000",
  "balance": "1000000",
  "notes": "Folio for Travel Agent XYZ",
  "createdAt": "2025-12-14T08:35:00.000Z",
  "updatedAt": "2025-12-14T08:35:00.000Z",
  "customer": {
    "id": 5,
    "fullName": "Travel Agent XYZ",
    "email": "booking@travelxyz.com"
  },
  "transactions": [
    {
      "id": 1,
      "type": "CHARGE",
      "amount": "1500000",
      "description": "Room Charge - Room 201",
      "createdAt": "2025-12-14T09:00:00.000Z"
    },
    {
      "id": 2,
      "type": "PAYMENT",
      "amount": "500000",
      "description": "Deposit - Cash",
      "createdAt": "2025-12-14T08:40:00.000Z"
    }
  ]
}
```

### PATCH /v1/folios/:folioId

**Request Body:**

```json
{
  "notes": "Updated notes"
}
```

**Success Response (200):**

```json
{
  "id": 10,
  "notes": "Updated notes",
  "updatedAt": "2025-12-14T09:10:00.000Z"
}
```

### GET /v1/folios/:folioId/summary

**Success Response (200):**

```json
{
  "folioId": 10,
  "totalCharges": "1500000",
  "totalPayments": "500000",
  "balance": "1000000",
  "chargesByServiceGroup": {
    "ROOM_CHARGE": "1200000",
    "F_AND_B": "300000"
  }
}
```

### POST /v1/folios/:folioId/close

**Success Response (200):**

```json
{
  "id": 10,
  "status": "CLOSED",
  "updatedAt": "2025-12-14T12:00:00.000Z"
}
```

### POST /v1/folios/:folioId/room-charges

**Request Body:**

```json
{
  "stayDetailId": 1,
  "amount": 1200000
}
```

**Success Response (200):**

```json
{
  "id": 3,
  "folioId": 10,
  "type": "CHARGE",
  "amount": "1200000",
  "description": "Room Charge",
  "createdAt": "2025-12-14T09:00:00.000Z"
}
```

### POST /v1/folios/:folioId/service-charges

**Request Body:**

```json
{
  "serviceId": 7,
  "quantity": 2
}
```

**Success Response (200):**

```json
{
  "id": 4,
  "folioId": 10,
  "type": "CHARGE",
  "amount": "90000",
  "description": "Beer (Bottle) x 2",
  "createdAt": "2025-12-14T09:30:00.000Z"
}
```

### POST /v1/folios/:folioId/payments

**Request Body:**

```json
{
  "amount": 500000,
  "paymentMethodId": 1,
  "referenceNumber": "REF123"
}
```

**Success Response (200):**

```json
{
  "id": 5,
  "folioId": 10,
  "type": "PAYMENT",
  "amount": "500000",
  "description": "Payment - Cash",
  "createdAt": "2025-12-14T10:00:00.000Z"
}
```

### POST /v1/folios/:folioId/deposits

**Request Body:**

```json
{
  "amount": 200000,
  "paymentMethodId": 2
}
```

**Success Response (200):**

```json
{
  "id": 6,
  "folioId": 10,
  "type": "PAYMENT",
  "amount": "200000",
  "description": "Deposit - Credit Card",
  "createdAt": "2025-12-14T10:15:00.000Z"
}
```

### POST /v1/folios/:folioId/refunds

**Request Body:**

```json
{
  "amount": 100000,
  "paymentMethodId": 1,
  "reason": "Overcharge"
}
```

**Success Response (200):**

```json
{
  "id": 7,
  "folioId": 10,
  "type": "REFUND",
  "amount": "100000",
  "description": "Refund - Cash (Overcharge)",
  "createdAt": "2025-12-14T10:30:00.000Z"
}
```

### POST /v1/folios/:folioId/discounts

**Request Body:**

```json
{
  "amount": 50000,
  "reason": "Loyalty Discount"
}
```

**Success Response (200):**

```json
{
  "id": 8,
  "folioId": 10,
  "type": "DISCOUNT",
  "amount": "50000",
  "description": "Discount - Loyalty Discount",
  "createdAt": "2025-12-14T10:45:00.000Z"
}
```

### POST /v1/folios/transactions/:transactionId/void

**Request Body:**

```json
{
  "folioId": 10,
  "reason": "Mistake entry"
}
```

**Success Response (200):**

```json
{
  "id": 4,
  "isVoided": true,
  "voidReason": "Mistake entry",
  "voidedAt": "2025-12-14T11:00:00.000Z"
}
```

## Housekeeping

### POST /v1/housekeeping/

**Request Body:**

```json
{
  "roomId": 5,
  "employeeId": 5,
  "notes": "Regular cleaning"
}
```

**Success Response (201):**

```json
{
  "id": 1,
  "roomId": 5,
  "assignedToId": 5,
  "status": "PENDING",
  "notes": "Regular cleaning",
  "createdAt": "2025-12-14T08:00:00.000Z"
}
```

### GET /v1/housekeeping/

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 1,
      "roomId": 5,
      "assignedToId": 5,
      "status": "PENDING",
      "room": {
        "code": "201",
        "name": "Room 201"
      },
      "assignedTo": {
        "name": "Restaurant Waiter"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### GET /v1/housekeeping/pending

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 5,
      "code": "201",
      "status": "DIRTY"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### GET /v1/housekeeping/my-tasks

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 1,
      "roomId": 5,
      "status": "PENDING",
      "room": {
        "code": "201"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### GET /v1/housekeeping/:logId

**Success Response (200):**

```json
{
  "id": 1,
  "roomId": 5,
  "assignedToId": 5,
  "status": "PENDING",
  "notes": "Regular cleaning",
  "createdAt": "2025-12-14T08:00:00.000Z"
}
```

### POST /v1/housekeeping/:logId/start

**Success Response (200):**

```json
{
  "id": 1,
  "status": "IN_PROGRESS",
  "startTime": "2025-12-14T08:30:00.000Z"
}
```

### POST /v1/housekeeping/:logId/complete

**Success Response (200):**

```json
{
  "id": 1,
  "status": "COMPLETED",
  "endTime": "2025-12-14T09:00:00.000Z"
}
```

### POST /v1/housekeeping/:logId/inspect

**Request Body:**

```json
{
  "passed": true,
  "notes": "Clean and tidy"
}
```

**Success Response (200):**

```json
{
  "id": 1,
  "status": "INSPECTED",
  "inspectedBy": 6,
  "inspectionNotes": "Clean and tidy",
  "inspectedAt": "2025-12-14T09:15:00.000Z"
}
```

### POST /v1/housekeeping/:logId/assign

**Request Body:**

```json
{
  "employeeId": 5
}
```

**Success Response (200):**

```json
{
  "id": 1,
  "assignedToId": 5,
  "updatedAt": "2025-12-14T08:05:00.000Z"
}
```

### POST /v1/housekeeping/bulk-assign

**Request Body:**

```json
{
  "roomIds": [5, 6],
  "employeeId": 5
}
```

**Success Response (200):**

```json
{
  "count": 2,
  "message": "Assigned 2 rooms to employee"
}
```

## Inspections

### POST /v1/inspections/:stayDetailId

**Request Body:**

```json
{
  "notes": "Room in good condition",
  "damages": []
}
```

**Success Response (201):**

```json
{
  "id": 1,
  "stayDetailId": 10,
  "inspectorId": 6,
  "notes": "Room in good condition",
  "createdAt": "2025-12-14T11:00:00.000Z"
}
```

### GET /v1/inspections/:stayDetailId

**Success Response (200):**

```json
{
  "id": 1,
  "stayDetailId": 10,
  "inspectorId": 6,
  "notes": "Room in good condition",
  "damages": []
}
```

### PATCH /v1/inspections/:stayDetailId

**Request Body:**

```json
{
  "notes": "Found a broken glass"
}
```

**Success Response (200):**

```json
{
  "id": 1,
  "notes": "Found a broken glass",
  "updatedAt": "2025-12-14T11:05:00.000Z"
}
```

### GET /v1/inspections/:stayDetailId/can-checkout

**Success Response (200):**

```json
{
  "canCheckout": true
}
```

## Invoices

### POST /v1/invoices/

**Request Body:**

```json
{
  "guestFolioId": 10,
  "invoiceToCustomerId": 5,
  "transactionIds": [1, 3, 4]
}
```

**Success Response (201):**

```json
{
  "id": 1,
  "invoiceNumber": "INV-20251214-001",
  "guestFolioId": 10,
  "invoiceToCustomerId": 5,
  "totalAmount": "2790000",
  "status": "ISSUED",
  "createdAt": "2025-12-14T12:00:00.000Z"
}
```

### GET /v1/invoices/

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 1,
      "invoiceNumber": "INV-20251214-001",
      "totalAmount": "2790000",
      "status": "ISSUED",
      "customer": {
        "fullName": "Travel Agent XYZ"
      }
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "totalResults": 1
}
```

### GET /v1/invoices/:invoiceId

**Success Response (200):**

```json
{
  "id": 1,
  "invoiceNumber": "INV-20251214-001",
  "guestFolioId": 10,
  "invoiceToCustomerId": 5,
  "totalAmount": "2790000",
  "status": "ISSUED",
  "createdAt": "2025-12-14T12:00:00.000Z",
  "items": [
    {
      "description": "Room Charge",
      "amount": "1500000"
    },
    {
      "description": "Room Charge",
      "amount": "1200000"
    },
    {
      "description": "Beer (Bottle) x 2",
      "amount": "90000"
    }
  ]
}
```

### GET /v1/invoices/:invoiceId/print

**Success Response (200):**
(HTML Content or PDF Stream)

## Nightly Operations

### POST /v1/nightly/run-all

**Request Body:**

```json
{}
```

**Success Response (200):**

```json
{
  "roomCharges": {
    "date": "2025-12-13T17:00:00.000Z",
    "totalProcessed": 5,
    "successful": 5,
    "failed": 0,
    "details": []
  },
  "extraPersonCharges": {
    "date": "2025-12-13T17:00:00.000Z",
    "totalWithExtraGuests": 1,
    "successful": 1,
    "failed": 0,
    "details": []
  },
  "noShowMarking": {
    "date": "2025-12-12T17:00:00.000Z",
    "markedAsNoShow": 0
  },
  "snapshot": {
    "id": 1,
    "snapshotDate": "2025-12-13T00:00:00.000Z",
    "totalRooms": 13,
    "availableRooms": 7,
    "occupiedRooms": 3,
    "reservedRooms": 2,
    "outOfOrderRooms": 1,
    "occupancyRate": "25",
    "roomRevenue": "5000000",
    "serviceRevenue": "500000",
    "totalRevenue": "5500000",
    "createdAt": "2025-12-14T07:29:59.322Z"
  }
}
```

### POST /v1/nightly/room-charges

**Success Response (200):**

```json
{
  "date": "2025-12-13T17:00:00.000Z",
  "totalProcessed": 5,
  "successful": 5,
  "failed": 0,
  "details": []
}
```

### POST /v1/nightly/extra-person-charges

**Success Response (200):**

```json
{
  "date": "2025-12-13T17:00:00.000Z",
  "totalWithExtraGuests": 1,
  "successful": 1,
  "failed": 0,
  "details": []
}
```

### POST /v1/nightly/no-show

**Success Response (200):**

```json
{
  "date": "2025-12-12T17:00:00.000Z",
  "markedAsNoShow": 0
}
```

### POST /v1/nightly/daily-snapshot

**Success Response (201):**

```json
{
  "id": 1,
  "snapshotDate": "2025-12-13T00:00:00.000Z",
  "totalRooms": 13,
  "occupancyRate": "25",
  "totalRevenue": "5500000",
  "createdAt": "2025-12-14T07:29:59.322Z"
}
```

## Reports

### GET /v1/reports/daily-snapshot

**Query Parameters:** `date=2025-12-13`

**Success Response (200):**

```json
{
  "id": 1,
  "snapshotDate": "2025-12-13T00:00:00.000Z",
  "totalRooms": 14,
  "availableRooms": 8,
  "occupiedRooms": 3,
  "reservedRooms": 2,
  "outOfOrderRooms": 1,
  "occupancyRate": "23.08",
  "roomRevenue": "5000000",
  "serviceRevenue": "500000",
  "totalRevenue": "5500000",
  "createdAt": "2025-12-14T07:29:59.322Z"
}
```

### GET /v1/reports/snapshots

**Query Parameters:** `startDate=2025-12-01&endDate=2025-12-13`

**Success Response (200):**

```json
{
  "results": [
    {
      "snapshotDate": "2025-12-13T00:00:00.000Z",
      "occupancyRate": "23.08",
      "totalRevenue": "5500000"
    },
    {
      "snapshotDate": "2025-12-12T00:00:00.000Z",
      "occupancyRate": "20.00",
      "totalRevenue": "4500000"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 2
  }
}
```

### GET /v1/reports/occupancy

**Query Parameters:** `startDate=2025-12-01&endDate=2025-12-13`

**Success Response (200):**

```json
{
  "averageOccupancy": "21.54",
  "dailyOccupancy": [
    {
      "date": "2025-12-13",
      "rate": "23.08"
    },
    {
      "date": "2025-12-12",
      "rate": "20.00"
    }
  ]
}
```

### GET /v1/reports/revenue

**Query Parameters:** `startDate=2025-12-01&endDate=2025-12-13`

**Success Response (200):**

```json
{
  "totalRevenue": "10000000",
  "roomRevenue": "9000000",
  "serviceRevenue": "1000000",
  "dailyRevenue": [
    {
      "date": "2025-12-13",
      "total": "5500000"
    },
    {
      "date": "2025-12-12",
      "total": "4500000"
    }
  ]
}
```

### GET /v1/reports/revenue-by-room-type

**Query Parameters:** `startDate=2025-12-01&endDate=2025-12-13`

**Success Response (200):**

```json
[
  {
    "roomType": "Standard Room",
    "revenue": "2000000"
  },
  {
    "roomType": "Deluxe Room",
    "revenue": "5000000"
  }
]
```

### GET /v1/reports/bookings

**Query Parameters:** `startDate=2025-12-01&endDate=2025-12-13`

**Success Response (200):**

```json
{
  "totalBookings": 10,
  "confirmed": 8,
  "cancelled": 2,
  "sourceBreakdown": {
    "WALK_IN": 5,
    "ONLINE": 3,
    "AGENT": 2
  }
}
```

### GET /v1/reports/dashboard

**Success Response (200):**

```json
{
  "date": "2025-12-14T17:00:00.000Z",
  "rooms": {
    "total": 13,
    "available": 7,
    "occupied": 3,
    "reserved": 2,
    "cleaning": 0,
    "outOfOrder": 1,
    "occupancyRate": 25
  },
  "todayActivity": {
    "arrivals": 2,
    "departures": 1,
    "currentGuests": 5,
    "pendingHousekeeping": 1
  },
  "finance": {
    "todayRevenue": "1500000",
    "todayPayments": "500000"
  },
  "comparison": null
}
```

## Reservations

### POST /v1/reservations/

**Request Body:**

```json
{
  "customerId": 5,
  "expectedArrival": "2025-12-20T14:00:00.000Z",
  "expectedDeparture": "2025-12-22T12:00:00.000Z",
  "reservationDetails": [
    {
      "roomTypeId": 2,
      "numberOfRooms": 1,
      "numberOfGuests": 2
    }
  ]
}
```

**Success Response (201):**

```json
{
  "id": 100,
  "code": "RES-20251214-001",
  "customerId": 5,
  "status": "PENDING",
  "expectedArrival": "2025-12-20T14:00:00.000Z",
  "expectedDeparture": "2025-12-22T12:00:00.000Z",
  "createdAt": "2025-12-14T09:00:00.000Z"
}
```

### GET /v1/reservations/

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 100,
      "code": "RES-20251214-001",
      "status": "PENDING",
      "customer": {
        "fullName": "Travel Agent XYZ"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### GET /v1/reservations/arrivals

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 99,
      "code": "RES-20251214-000",
      "expectedArrival": "2025-12-14T14:00:00.000Z",
      "customer": {
        "fullName": "John Doe"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### GET /v1/reservations/departures

**Success Response (200):**

```json
{
  "results": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 0,
    "totalResults": 0
  }
}
```

### GET /v1/reservations/:reservationId

**Success Response (200):**

```json
{
  "id": 100,
  "code": "RES-20251214-001",
  "status": "PENDING",
  "customer": {
    "fullName": "Travel Agent XYZ"
  },
  "details": [
    {
      "roomTypeId": 2,
      "numberOfRooms": 1,
      "roomType": {
        "name": "Superior Room"
      }
    }
  ]
}
```

### PATCH /v1/reservations/:reservationId

**Request Body:**

```json
{
  "expectedDeparture": "2025-12-23T12:00:00.000Z"
}
```

**Success Response (200):**

```json
{
  "id": 100,
  "expectedDeparture": "2025-12-23T12:00:00.000Z",
  "updatedAt": "2025-12-14T09:10:00.000Z"
}
```

### POST /v1/reservations/:reservationId/confirm

**Success Response (200):**

```json
{
  "id": 100,
  "status": "CONFIRMED",
  "updatedAt": "2025-12-14T09:15:00.000Z"
}
```

### POST /v1/reservations/:reservationId/cancel

**Request Body:**

```json
{
  "reason": "Change of plans"
}
```

**Success Response (200):**

```json
{
  "id": 100,
  "status": "CANCELLED",
  "updatedAt": "2025-12-14T09:20:00.000Z"
}
```

### POST /v1/reservations/:reservationId/check-in

**Request Body:**

```json
{
  "roomAssignments": [
    {
      "reservationDetailId": 1,
      "roomId": 5
    }
  ]
}
```

**Success Response (200):**

```json
{
  "id": 100,
  "status": "CHECKED_IN",
  "stayRecordId": 50,
  "updatedAt": "2025-12-14T14:00:00.000Z"
}
```

## Rooms

### POST /v1/rooms/types

**Request Body:**

```json
{
  "code": "DELUXE",
  "name": "Deluxe Room",
  "baseCapacity": 2,
  "maxCapacity": 4,
  "rackRate": 1500000,
  "description": "A comfortable deluxe room with city view"
}
```

**Success Response (201):**

```json
{
  "id": 6,
  "code": "DELUXE",
  "name": "Deluxe Room",
  "baseCapacity": 2,
  "maxCapacity": 4,
  "rackRate": "1500000",
  "createdAt": "2025-12-14T09:00:00.000Z"
}
```

### GET /v1/rooms/types

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 3,
      "code": "DLX",
      "name": "Deluxe Room",
      "rackRate": "1800000"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### GET /v1/rooms/types/:roomTypeId

**Success Response (200):**

```json
{
  "id": 3,
  "code": "DLX",
  "name": "Deluxe Room",
  "rooms": [
    {
      "id": 10,
      "code": "301",
      "status": "AVAILABLE"
    }
  ]
}
```

### PATCH /v1/rooms/types/:roomTypeId

**Request Body:**

```json
{
  "rackRate": 1900000
}
```

**Success Response (200):**

```json
{
  "id": 3,
  "rackRate": "1900000",
  "updatedAt": "2025-12-14T09:10:00.000Z"
}
```

### DELETE /v1/rooms/types/:roomTypeId

**Success Response (204):**
(No Content)

### POST /v1/rooms/

**Request Body:**

```json
{
  "code": "305",
  "name": "Room 305",
  "roomTypeId": 3,
  "floor": 3
}
```

**Success Response (201):**

```json
{
  "id": 20,
  "code": "305",
  "name": "Room 305",
  "roomTypeId": 3,
  "status": "AVAILABLE",
  "createdAt": "2025-12-14T09:15:00.000Z"
}
```

### GET /v1/rooms/

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 5,
      "code": "201",
      "status": "AVAILABLE",
      "roomType": {
        "name": "Superior Room"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### GET /v1/rooms/available

**Query Parameters:** `checkInDate=2025-12-20&checkOutDate=2025-12-22`

**Success Response (200):**

```json
[
  {
    "id": 5,
    "code": "201",
    "roomType": {
      "name": "Superior Room"
    }
  }
]
```

### GET /v1/rooms/availability

**Query Parameters:** `checkInDate=2025-12-20&checkOutDate=2025-12-22`

**Success Response (200):**

```json
[
  {
    "roomTypeId": 2,
    "roomTypeName": "Superior Room",
    "totalRooms": 5,
    "availableRooms": 3,
    "rackRate": 1200000
  }
]
```

### GET /v1/rooms/:roomId

**Success Response (200):**

```json
{
  "id": 5,
  "code": "201",
  "status": "AVAILABLE",
  "roomType": {
    "name": "Superior Room"
  }
}
```

### PATCH /v1/rooms/:roomId

**Request Body:**

```json
{
  "notes": "Needs painting"
}
```

**Success Response (200):**

```json
{
  "id": 5,
  "notes": "Needs painting",
  "updatedAt": "2025-12-14T09:20:00.000Z"
}
```

### DELETE /v1/rooms/:roomId

**Success Response (204):**
(No Content)

### PATCH /v1/rooms/:roomId/status

**Request Body:**

```json
{
  "status": "MAINTENANCE"
}
```

**Success Response (200):**

```json
{
  "id": 5,
  "status": "MAINTENANCE",
  "updatedAt": "2025-12-14T09:25:00.000Z"
}
```

## Services

### POST /v1/services/

**Request Body:**

```json
{
  "code": "SPA001",
  "name": "Full Body Massage",
  "unitPrice": 500000,
  "serviceGroup": "SPA"
}
```

**Success Response (201):**

```json
{
  "id": 25,
  "code": "SPA001",
  "name": "Full Body Massage",
  "unitPrice": "500000",
  "serviceGroup": "SPA",
  "createdAt": "2025-12-14T09:30:00.000Z"
}
```

### GET /v1/services/

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 7,
      "code": "MB002",
      "name": "Beer (Bottle)",
      "unitPrice": "45000",
      "serviceGroup": "MINIBAR"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### GET /v1/services/:serviceId

**Success Response (200):**

```json
{
  "id": 7,
  "code": "MB002",
  "name": "Beer (Bottle)",
  "unitPrice": "45000"
}
```

### PATCH /v1/services/:serviceId

**Request Body:**

```json
{
  "unitPrice": 50000
}
```

**Success Response (200):**

```json
{
  "id": 7,
  "unitPrice": "50000",
  "updatedAt": "2025-12-14T09:35:00.000Z"
}
```

### DELETE /v1/services/:serviceId

**Success Response (204):**
(No Content)

### POST /v1/services/payment-methods

**Request Body:**

```json
{
  "code": "QR",
  "name": "QR Payment"
}
```

**Success Response (201):**

```json
{
  "id": 3,
  "code": "QR",
  "name": "QR Payment",
  "createdAt": "2025-12-14T09:40:00.000Z"
}
```

### GET /v1/services/payment-methods

**Success Response (200):**

```json
[
  {
    "id": 1,
    "code": "CASH",
    "name": "Cash"
  },
  {
    "id": 2,
    "code": "CC",
    "name": "Credit Card"
  }
]
```

### GET /v1/services/payment-methods/:methodId

**Success Response (200):**

```json
{
  "id": 1,
  "code": "CASH",
  "name": "Cash"
}
```

### PATCH /v1/services/payment-methods/:methodId

**Request Body:**

```json
{
  "name": "Cash Payment"
}
```

**Success Response (200):**

```json
{
  "id": 1,
  "name": "Cash Payment",
  "updatedAt": "2025-12-14T09:45:00.000Z"
}
```

### DELETE /v1/services/payment-methods/:methodId

**Success Response (204):**
(No Content)

## Shifts

### POST /v1/shifts/

**Request Body:**

```json
{
  "code": "NIGHT",
  "name": "Night Shift",
  "startTime": "22:00",
  "endTime": "06:00"
}
```

**Success Response (201):**

```json
{
  "id": 3,
  "code": "NIGHT",
  "name": "Night Shift",
  "startTime": "22:00",
  "endTime": "06:00",
  "createdAt": "2025-12-14T09:50:00.000Z"
}
```

### GET /v1/shifts/

**Success Response (200):**

```json
[
  {
    "id": 1,
    "code": "MORNING",
    "name": "Morning Shift",
    "startTime": "06:00",
    "endTime": "14:00"
  }
]
```

### GET /v1/shifts/:shiftId

**Success Response (200):**

```json
{
  "id": 1,
  "code": "MORNING",
  "name": "Morning Shift",
  "startTime": "06:00",
  "endTime": "14:00"
}
```

### PATCH /v1/shifts/:shiftId

**Request Body:**

```json
{
  "endTime": "14:30"
}
```

**Success Response (200):**

```json
{
  "id": 1,
  "endTime": "14:30",
  "updatedAt": "2025-12-14T09:55:00.000Z"
}
```

### DELETE /v1/shifts/:shiftId

**Success Response (204):**
(No Content)

### POST /v1/shifts/sessions/open

**Request Body:**

```json
{
  "shiftId": 1,
  "openingBalance": 1000000
}
```

**Success Response (201):**

```json
{
  "id": 50,
  "shiftId": 1,
  "employeeId": 6,
  "openingBalance": "1000000",
  "status": "OPEN",
  "startedAt": "2025-12-14T06:00:00.000Z"
}
```

### POST /v1/shifts/sessions/:sessionId/close

**Request Body:**

```json
{
  "closingBalance": 1500000,
  "notes": "All good"
}
```

**Success Response (200):**

```json
{
  "id": 50,
  "status": "CLOSED",
  "closingBalance": "1500000",
  "endedAt": "2025-12-14T14:00:00.000Z"
}
```

### POST /v1/shifts/sessions/:sessionId/approve

**Success Response (200):**

```json
{
  "id": 50,
  "status": "APPROVED",
  "approvedBy": 6,
  "approvedAt": "2025-12-14T14:15:00.000Z"
}
```

### GET /v1/shifts/sessions

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 50,
      "status": "APPROVED",
      "employee": {
        "name": "Admin User"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### GET /v1/shifts/sessions/me

**Success Response (200):**

```json
{
  "id": 51,
  "status": "OPEN",
  "startedAt": "2025-12-14T14:00:00.000Z"
}
```

## Stay Records

### POST /v1/stay-records/

**Request Body:**

```json
{
  "customerId": 5,
  "stayDetails": [
    {
      "roomId": 5,
      "numberOfGuests": 2
    }
  ]
}
```

**Success Response (201):**

```json
{
  "id": 60,
  "code": "STAY-20251214-001",
  "customerId": 5,
  "status": "CHECKED_IN",
  "checkInDate": "2025-12-14T10:00:00.000Z",
  "createdAt": "2025-12-14T10:00:00.000Z"
}
```

### GET /v1/stay-records/

**Success Response (200):**

```json
{
  "results": [
    {
      "id": 60,
      "code": "STAY-20251214-001",
      "status": "CHECKED_IN",
      "customer": {
        "fullName": "Travel Agent XYZ"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### GET /v1/stay-records/guests

**Success Response (200):**

```json
{
  "results": [
    {
      "stayRecordId": 60,
      "roomId": 5,
      "guestName": "Guest 1"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### GET /v1/stay-records/:stayRecordId

**Success Response (200):**

```json
{
  "id": 60,
  "code": "STAY-20251214-001",
  "status": "CHECKED_IN",
  "details": [
    {
      "id": 1,
      "roomId": 5,
      "room": {
        "code": "201"
      }
    }
  ]
}
```

### POST /v1/stay-records/:stayRecordId/check-out

**Success Response (200):**

```json
{
  "id": 60,
  "status": "CHECKED_OUT",
  "checkOutDate": "2025-12-16T12:00:00.000Z"
}
```

### POST /v1/stay-records/details/:stayDetailId/check-out

**Request Body:**

```json
{
  "stayRecordId": 60
}
```

**Success Response (200):**

```json
{
  "id": 1,
  "status": "CHECKED_OUT",
  "checkOutDate": "2025-12-16T12:00:00.000Z"
}
```

### POST /v1/stay-records/details/:stayDetailId/move

**Request Body:**

```json
{
  "stayRecordId": 60,
  "newRoomId": 6
}
```

**Success Response (200):**

```json
{
  "id": 2,
  "roomId": 6,
  "status": "CHECKED_IN",
  "createdAt": "2025-12-14T11:00:00.000Z"
}
```

### POST /v1/stay-records/details/:stayDetailId/extend

**Request Body:**

```json
{
  "stayRecordId": 60,
  "newExpectedCheckOut": "2025-12-18T12:00:00.000Z"
}
```

**Success Response (200):**

```json
{
  "id": 1,
  "expectedCheckOut": "2025-12-18T12:00:00.000Z",
  "updatedAt": "2025-12-14T11:30:00.000Z"
}
```

### POST /v1/stay-records/details/:stayDetailId/guests

**Request Body:**

```json
{
  "stayRecordId": 60,
  "fullName": "Guest 2"
}
```

**Success Response (200):**

```json
{
  "id": 5,
  "fullName": "Guest 2",
  "stayDetailId": 1,
  "createdAt": "2025-12-14T12:00:00.000Z"
}
```
