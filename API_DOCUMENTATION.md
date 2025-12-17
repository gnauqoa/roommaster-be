# Hotel Management System API Documentation

**Version:** 1.0.0

**Base URL:** `http://localhost:3002`

**Generated:** 2025-12-14T07:51:09.093Z

---

## Table of Contents

- [Authentication](#authentication)
- [Customer Tiers](#customer-tiers)
- [Customers](#customers)
- [Employees](#employees)
- [Folios](#folios)
- [Housekeeping](#housekeeping)
- [Inspections](#inspections)
- [Invoices](#invoices)
- [Nightly Operations](#nightly-operations)
- [Other](#other)
- [Reports](#reports)
- [Reservations](#reservations)
- [Rooms](#rooms)
- [Services](#services)
- [Shifts](#shifts)
- [Stay Records](#stay-records)

---

## Authentication

### POST /v1/auth/login

Authenticate a user and receive JWT tokens for subsequent requests

**Request Body:**

```json
{
  "email": "admin@hotel.com",
  "password": "password123"
}
```

**Response Status:** `200`

**Success Response:**

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
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjYsImlhdCI6MTc2NTY5ODY2OSwiZXhwIjoxNzY4MjkwNjY5LCJ0eXBlIjoiUkVGUkVTSCJ9.tpOg654Q0to0D8VO1aIQiZvjYu2zxCnAGidPi-KB7aY",
      "expires": "2026-01-13T07:51:09.364Z"
    }
  }
}
```

---

### POST /v1/auth/logout

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Not found",
  "stack": "Error: Not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\auth.service.ts:45:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\auth.service.ts:5:58)"
}
```

---

### POST /v1/auth/refresh-tokens

**Request Body:**

```json
{
  "refreshToken": "sample-refresh-token"
}
```

**Response Status:** `401`

**Error Response:**

```json
{
  "code": 401,
  "message": "Please authenticate",
  "stack": "Error: Please authenticate\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\auth.service.ts:62:11\n    at Generator.throw (<anonymous>)\n    at rejected (D:\\HOTEL_MS\\roommaster-be\\src\\services\\auth.service.ts:6:65)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)"
}
```

---

### POST /v1/auth/change-password

**Request Body:**

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "Current password is incorrect",
  "stack": "Error: Current password is incorrect\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\auth.service.ts:110:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\auth.service.ts:5:58)"
}
```

---

### GET /v1/auth/me

**Response Status:** `200`

**Success Response:**

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

---

## Customer Tiers

### POST /v1/customer-tiers/

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"code\" is required, \"name\" is required",
  "stack": "Error: \"code\" is required, \"name\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/customer-tiers/

**Response Status:** `200`

**Success Response:**

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
        "customers": 0
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
        "customers": 0
      }
    },
    {
      "id": 5,
      "code": "VIP",
      "name": "VIP",
      "pointsRequired": 3000,
      "roomDiscountFactor": "25",
      "serviceDiscountFactor": "20",
      "createdAt": "2025-12-14T05:55:42.808Z",
      "updatedAt": "2025-12-14T05:55:42.808Z",
      "_count": {
        "customers": 0
      }
    }
  ],
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "totalResults": 3
}
```

---

### GET /v1/customer-tiers/:tierId

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Customer tier not found",
  "stack": "Error: Customer tier not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\customer-tier.service.ts:104:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\customer-tier.service.ts:5:58)"
}
```

---

### PATCH /v1/customer-tiers/:tierId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"body\" must have at least 1 key",
  "stack": "Error: \"body\" must have at least 1 key\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### DELETE /v1/customer-tiers/:tierId

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Customer tier not found",
  "stack": "Error: Customer tier not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\customer-tier.service.ts:163:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\customer-tier.service.ts:5:58)"
}
```

---

### POST /v1/customer-tiers/upgrade/:customerId

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Customer not found",
  "stack": "Error: Customer not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\customer-tier.service.ts:188:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\customer-tier.service.ts:5:58)"
}
```

---

### POST /v1/customer-tiers/batch-upgrade

**Request Body:**

```json
{}
```

**Response Status:** `200`

**Success Response:**

```json
{
  "totalCustomers": 0,
  "upgraded": 0,
  "upgrades": []
}
```

---

## Customers

### POST /v1/customers/tiers

**Request Body:**

```json
{
  "code": "SILVER",
  "name": "Silver Member",
  "pointsRequired": 250
}
```

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"roomDiscountFactor\" is required, \"serviceDiscountFactor\" is required",
  "stack": "Error: \"roomDiscountFactor\" is required, \"serviceDiscountFactor\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/customers/tiers

**Response Status:** `200`

**Success Response:**

```json
{
  "results": [
    {
      "id": 2,
      "code": "SILVER",
      "name": "Silver",
      "pointsRequired": 100,
      "roomDiscountFactor": "5",
      "serviceDiscountFactor": "3",
      "createdAt": "2025-12-14T05:55:42.792Z",
      "updatedAt": "2025-12-14T05:55:42.792Z"
    },
    {
      "id": 3,
      "code": "GOLD",
      "name": "Gold",
      "pointsRequired": 500,
      "roomDiscountFactor": "10",
      "serviceDiscountFactor": "7",
      "createdAt": "2025-12-14T05:55:42.797Z",
      "updatedAt": "2025-12-14T05:55:42.797Z"
    },
    {
      "id": 4,
      "code": "PLATINUM",
      "name": "Platinum",
      "pointsRequired": 1500,
      "roomDiscountFactor": "15",
      "serviceDiscountFactor": "12",
      "createdAt": "2025-12-14T05:55:42.802Z",
      "updatedAt": "2025-12-14T05:55:42.802Z"
    },
    {
      "id": 5,
      "code": "VIP",
      "name": "VIP",
      "pointsRequired": 3000,
      "roomDiscountFactor": "25",
      "serviceDiscountFactor": "20",
      "createdAt": "2025-12-14T05:55:42.808Z",
      "updatedAt": "2025-12-14T05:55:42.808Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 4
  }
}
```

---

### GET /v1/customers/tiers/:tierId

**Response Status:** `200`

**Success Response:**

```json
{
  "id": 2,
  "code": "SILVER",
  "name": "Silver",
  "pointsRequired": 100,
  "roomDiscountFactor": "5",
  "serviceDiscountFactor": "3",
  "createdAt": "2025-12-14T05:55:42.792Z",
  "updatedAt": "2025-12-14T05:55:42.792Z"
}
```

---

### PATCH /v1/customers/tiers/:tierId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"body\" must have at least 1 key",
  "stack": "Error: \"body\" must have at least 1 key\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### DELETE /v1/customers/tiers/:tierId

**Response Status:** `204`

---

### POST /v1/customers/

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"code\" is required, \"fullName\" is required",
  "stack": "Error: \"code\" is required, \"fullName\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/customers/

**Response Status:** `200`

**Success Response:**

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

---

### GET /v1/customers/search

**Response Status:** `200`

**Success Response:**

```json
[]
```

---

### GET /v1/customers/:customerId

**Response Status:** `200`

**Success Response:**

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

---

### PATCH /v1/customers/:customerId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"body\" must have at least 1 key",
  "stack": "Error: \"body\" must have at least 1 key\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### DELETE /v1/customers/:customerId

**Response Status:** `204`

---

## Employees

### POST /v1/employees/

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"code\" is required, \"name\" is required, \"email\" is required, \"password\" is required",
  "stack": "Error: \"code\" is required, \"name\" is required, \"email\" is required, \"password\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/employees/

**Response Status:** `200`

**Success Response:**

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

---

### GET /v1/employees/:employeeId

**Response Status:** `200`

**Success Response:**

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

---

### PATCH /v1/employees/:employeeId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"body\" must have at least 1 key",
  "stack": "Error: \"body\" must have at least 1 key\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### DELETE /v1/employees/:employeeId

**Response Status:** `204`

---

## Folios

### POST /v1/folios/

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"billToCustomerId\" is required",
  "stack": "Error: \"billToCustomerId\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/folios/

**Response Status:** `200`

**Success Response:**

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

---

### GET /v1/folios/:folioId

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Folio not found",
  "stack": "Error: Folio not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\controllers\\folio.controller.ts:30:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\controllers\\folio.controller.ts:5:58)"
}
```

---

### PATCH /v1/folios/:folioId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"body\" must have at least 1 key",
  "stack": "Error: \"body\" must have at least 1 key\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/folios/:folioId/summary

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Guest folio not found",
  "stack": "Error: Guest folio not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\folio.service.ts:484:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\folio.service.ts:5:58)"
}
```

---

### POST /v1/folios/:folioId/close

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Guest folio not found",
  "stack": "Error: Guest folio not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\folio.service.ts:219:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\folio.service.ts:5:58)"
}
```

---

### POST /v1/folios/:folioId/room-charges

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"stayDetailId\" is required, \"amount\" is required",
  "stack": "Error: \"stayDetailId\" is required, \"amount\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### POST /v1/folios/:folioId/service-charges

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"serviceId\" is required",
  "stack": "Error: \"serviceId\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### POST /v1/folios/:folioId/payments

Record a payment against a folio

**Request Body:**

```json
{
  "amount": 100,
  "paymentMethod": "CASH",
  "referenceNumber": "CASH001"
}
```

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"paymentMethodId\" is required, \"paymentMethod\" is not allowed, \"referenceNumber\" is not allowed",
  "stack": "Error: \"paymentMethodId\" is required, \"paymentMethod\" is not allowed, \"referenceNumber\" is not allowed\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### POST /v1/folios/:folioId/deposits

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"amount\" is required, \"paymentMethodId\" is required",
  "stack": "Error: \"amount\" is required, \"paymentMethodId\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### POST /v1/folios/:folioId/refunds

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"amount\" is required, \"paymentMethodId\" is required",
  "stack": "Error: \"amount\" is required, \"paymentMethodId\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### POST /v1/folios/:folioId/discounts

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"amount\" is required",
  "stack": "Error: \"amount\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### POST /v1/folios/transactions/:transactionId/void

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"folioId\" is required, \"reason\" is required",
  "stack": "Error: \"folioId\" is required, \"reason\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

## Housekeeping

### POST /v1/housekeeping/

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"roomId\" is required, \"employeeId\" is required",
  "stack": "Error: \"roomId\" is required, \"employeeId\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/housekeeping/

**Response Status:** `200`

**Success Response:**

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

---

### GET /v1/housekeeping/pending

**Response Status:** `200`

**Success Response:**

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

---

### GET /v1/housekeeping/my-tasks

**Response Status:** `200`

**Success Response:**

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

---

### GET /v1/housekeeping/:logId

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Housekeeping log not found",
  "stack": "Error: Housekeeping log not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\controllers\\housekeeping.controller.ts:28:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\controllers\\housekeeping.controller.ts:5:58)"
}
```

---

### POST /v1/housekeeping/:logId/start

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Housekeeping log not found",
  "stack": "Error: Housekeeping log not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\housekeeping.service.ts:92:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\housekeeping.service.ts:5:58)"
}
```

---

### POST /v1/housekeeping/:logId/complete

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Housekeeping log not found",
  "stack": "Error: Housekeeping log not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\housekeeping.service.ts:115:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\housekeeping.service.ts:5:58)"
}
```

---

### POST /v1/housekeeping/:logId/inspect

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"passed\" is required",
  "stack": "Error: \"passed\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### POST /v1/housekeeping/:logId/assign

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"employeeId\" is required",
  "stack": "Error: \"employeeId\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### POST /v1/housekeeping/bulk-assign

**Request Body:**

```json
{
  "assignments": [
    {
      "logId": 1,
      "employeeId": 5
    }
  ]
}
```

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"roomIds\" is required, \"employeeId\" is required, \"assignments\" is not allowed",
  "stack": "Error: \"roomIds\" is required, \"employeeId\" is required, \"assignments\" is not allowed\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

## Inspections

### POST /v1/inspections/:stayDetailId

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Stay detail not found",
  "stack": "Error: Stay detail not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\inspection.service.ts:71:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\inspection.service.ts:5:58)"
}
```

---

### GET /v1/inspections/:stayDetailId

**Response Status:** `200`

---

### PATCH /v1/inspections/:stayDetailId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\nInvalid `prisma.roomInspection.update()` invocation in\nD:\\HOTEL_MS\\roommaster-be\\src\\services\\inspection.service.ts:241:50\n\n  238     notes?: string;\n  239   }\n  240 ) => {\n→ 241   const inspection = await prisma.roomInspection.update(\nAn operation failed because it depends on one or more records that were required but not found. Record to update not found.",
  "stack": "PrismaClientKnownRequestError: \nInvalid `prisma.roomInspection.update()` invocation in\nD:\\HOTEL_MS\\roommaster-be\\src\\services\\inspection.service.ts:241:50\n\n  238     notes?: string;\n  239   }\n  240 ) => {\n→ 241   const inspection = await prisma.roomInspection.update(\nAn operation failed because it depends on one or more records that were required but not found. Record to update not found.\n    at Rn.handleRequestError (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\@prisma+client@4.16.2_prisma@4.16.2\\node_modules\\@prisma\\client\\runtime\\library.js:174:7325)\n    at Rn.handleAndLogRequestError (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\@prisma+client@4.16.2_prisma@4.16.2\\node_modules\\@prisma\\client\\runtime\\library.js:174:6754)\n    at Rn.request (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\@prisma+client@4.16.2_prisma@4.16.2\\node_modules\\@prisma\\client\\runtime\\library.js:174:6344)"
}
```

---

### GET /v1/inspections/:stayDetailId/can-checkout

**Response Status:** `200`

**Success Response:**

```json
{
  "canCheckout": true
}
```

---

## Invoices

### POST /v1/invoices/

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"guestFolioId\" is required, \"invoiceToCustomerId\" is required, \"transactionIds\" is required",
  "stack": "Error: \"guestFolioId\" is required, \"invoiceToCustomerId\" is required, \"transactionIds\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/invoices/

**Response Status:** `200`

**Success Response:**

```json
{
  "results": [],
  "page": 1,
  "limit": 10,
  "totalPages": 0,
  "totalResults": 0
}
```

---

### GET /v1/invoices/:invoiceId

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Invoice not found",
  "stack": "Error: Invoice not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\invoice.service.ts:233:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\invoice.service.ts:5:58)"
}
```

---

### GET /v1/invoices/:invoiceId/print

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Invoice not found",
  "stack": "Error: Invoice not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\invoice.service.ts:233:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\invoice.service.ts:5:58)"
}
```

---

## Nightly Operations

### POST /v1/nightly/run-all

**Request Body:**

```json
{}
```

**Response Status:** `200`

**Success Response:**

```json
{
  "roomCharges": {
    "date": "2025-12-13T17:00:00.000Z",
    "totalProcessed": 0,
    "successful": 0,
    "failed": 0,
    "details": []
  },
  "extraPersonCharges": {
    "date": "2025-12-13T17:00:00.000Z",
    "totalWithExtraGuests": 0,
    "successful": 0,
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
    "roomRevenue": "0",
    "serviceRevenue": "0",
    "surchargeRevenue": "0",
    "penaltyRevenue": "0",
    "totalRevenue": "0",
    "newReservations": 0,
    "cancelledReservations": 0,
    "checkIns": 0,
    "checkOuts": 0,
    "noShows": 0,
    "totalGuests": 0,
    "averageDailyRate": "0",
    "revPAR": "0",
    "createdAt": "2025-12-14T07:29:59.322Z",
    "updatedAt": "2025-12-14T07:51:24.146Z"
  }
}
```

---

### POST /v1/nightly/room-charges

**Request Body:**

```json
{}
```

**Response Status:** `200`

**Success Response:**

```json
{
  "date": "2025-12-13T17:00:00.000Z",
  "totalProcessed": 0,
  "successful": 0,
  "failed": 0,
  "details": []
}
```

---

### POST /v1/nightly/extra-person-charges

**Request Body:**

```json
{}
```

**Response Status:** `200`

**Success Response:**

```json
{
  "date": "2025-12-13T17:00:00.000Z",
  "totalWithExtraGuests": 0,
  "successful": 0,
  "failed": 0,
  "details": []
}
```

---

### POST /v1/nightly/no-show

**Request Body:**

```json
{}
```

**Response Status:** `200`

**Success Response:**

```json
{
  "date": "2025-12-12T17:00:00.000Z",
  "markedAsNoShow": 0
}
```

---

### POST /v1/nightly/daily-snapshot

**Request Body:**

```json
{}
```

**Response Status:** `201`

**Success Response:**

```json
{
  "id": 1,
  "snapshotDate": "2025-12-13T00:00:00.000Z",
  "totalRooms": 13,
  "availableRooms": 7,
  "occupiedRooms": 3,
  "reservedRooms": 2,
  "outOfOrderRooms": 1,
  "occupancyRate": "25",
  "roomRevenue": "0",
  "serviceRevenue": "0",
  "surchargeRevenue": "0",
  "penaltyRevenue": "0",
  "totalRevenue": "0",
  "newReservations": 0,
  "cancelledReservations": 0,
  "checkIns": 0,
  "checkOuts": 0,
  "noShows": 0,
  "totalGuests": 0,
  "averageDailyRate": "0",
  "revPAR": "0",
  "createdAt": "2025-12-14T07:29:59.322Z",
  "updatedAt": "2025-12-14T07:51:24.683Z"
}
```

---

## Other

### GET /v1/docs/

**Response Status:** `200`

**Success Response:**

```json
"\n<!-- HTML for static distribution bundle build -->\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  \n  <title>Swagger UI</title>\n  <link rel=\"stylesheet\" type=\"text/css\" href=\"./swagger-ui.css\" >\n  <link rel=\"icon\" type=\"image/png\" href=\"./favicon-32x32.png\" sizes=\"32x32\" /><link rel=\"icon\" type=\"image/png\" href=\"./favicon-16x16.png\" sizes=\"16x16\" />\n  <style>\n    html\n    {\n      box-sizing: border-box;\n      overflow: -moz-scrollbars-vertical;\n      overflow-y: scroll;\n    }\n    *,\n    *:before,\n    *:after\n    {\n      box-sizing: inherit;\n    }\n\n    body {\n      margin:0;\n      background: #fafafa;\n    }\n  </style>\n</head>\n\n<body>\n\n<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" style=\"position:absolute;width:0;height:0\">\n  <defs>\n    <symbol viewBox=\"0 0 20 20\" id=\"unlocked\">\n      <path d=\"M15.8 8H14V5.6C14 2.703 12.665 1 10 1 7.334 1 6 2.703 6 5.6V6h2v-.801C8 3.754 8.797 3 10 3c1.203 0 2 .754 2 2.199V8H4c-.553 0-1 .646-1 1.199V17c0 .549.428 1.139.951 1.307l1.197.387C5.672 18.861 6.55 19 7.1 19h5.8c.549 0 1.428-.139 1.951-.307l1.196-.387c.524-.167.953-.757.953-1.306V9.199C17 8.646 16.352 8 15.8 8z\"></path>\n    </symbol>\n\n    <symbol viewBox=\"0 0 20 20\" id=\"locked\">\n      <path d=\"M15.8 8H14V5.6C14 2.703 12.665 1 10 1 7.334 1 6 2.703 6 5.6V8H4c-.553 0-1 .646-1 1.199V17c0 .549.428 1.139.951 1.307l1.197.387C5.672 18.861 6.55 19 7.1 19h5.8c.549 0 1.428-.139 1.951-.307l1.196-.387c.524-.167.953-.757.953-1.306V9.199C17 8.646 16.352 8 15.8 8zM12 8H8V5.199C8 3.754 8.797 3 10 3c1.203 0 2 .754 2 2.199V8z\"/>\n    </symbol>\n\n    <symbol viewBox=\"0 0 20 20\" id=\"close\">\n      <path d=\"M14.348 14.849c-.469.469-1.229.469-1.697 0L10 11.819l-2.651 3.029c-.469.469-1.229.469-1.697 0-.469-.469-.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-.469-.469-.469-1.228 0-1.697.469-.469 1.228-.469 1.697 0L10 8.183l2.651-3.031c.469-.469 1.228-.469 1.697 0 .469.469.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c.469.469.469 1.229 0 1.698z\"/>\n    </symbol>\n\n    <symbol viewBox=\"0 0 20 20\" id=\"large-arrow\">\n      <path d=\"M13.25 10L6.109 2.58c-.268-.27-.268-.707 0-.979.268-.27.701-.27.969 0l7.83 7.908c.268.271.268.709 0 .979l-7.83 7.908c-.268.271-.701.27-.969 0-.268-.269-.268-.707 0-.979L13.25 10z\"/>\n    </symbol>\n\n    <symbol viewBox=\"0 0 20 20\" id=\"large-arrow-down\">\n      <path d=\"M17.418 6.109c.272-.268.709-.268.979 0s.271.701 0 .969l-7.908 7.83c-.27.268-.707.268-.979 0l-7.908-7.83c-.27-.268-.27-.701 0-.969.271-.268.709-.268.979 0L10 13.25l7.418-7.141z\"/>\n    </symbol>\n\n\n    <symbol viewBox=\"0 0 24 24\" id=\"jump-to\">\n      <path d=\"M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7z\"/>\n    </symbol>\n\n    <symbol viewBox=\"0 0 24 24\" id=\"expand\">\n      <path d=\"M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z\"/>\n    </symbol>\n\n  </defs>\n</svg>\n\n<div id=\"swagger-ui\"></div>\n\n<script src=\"./swagger-ui-bundle.js\"> </script>\n<script src=\"./swagger-ui-standalone-preset.js\"> </script>\n<script src=\"./swagger-ui-init.js\"> </script>\n\n\n\n<style>\n   undefined\n</style>\n</body>\n\n</html>\n"
```

---

### GET /v1/docs/json

**Response Status:** `200`

**Success Response:**

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "prisma-express-typescript-boilerplate API documentation",
    "version": "1.0.0",
    "license": {
      "name": "MIT",
      "url": "https://github.com/antonio-lazaro/prisma-express-typescript-boilerplate.git"
    }
  },
  "servers": [
    {
      "url": "http://localhost:3000/v1"
    }
  ],
  "paths": {
    "openapi": {
      "0": "3",
      "1": ".",
      "2": "0",
      "3": ".",
      "4": "0"
    },
    "info": {
      "title": "API",
      "version": "1.0.0"
    },
    "/auth/login": {
      "post": {
        "summary": "Login with email and password",
        "tags": ["Auth"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                  "email": {
                    "type": "string",
                    "format": "email",
                    "example": "admin@hotel.com"
                  },
                  "password": {
                    "type": "string",
                    "format": "password",
                    "example": "password123"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Login successful",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "user": {
                      "$ref": "#/components/schemas/Employee"
                    },
                    "tokens": {
                      "$ref": "#/components/schemas/AuthTokens"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Invalid email or password"
          }
        }
      }
    },
    "/auth/logout": {
      "post": {
        "summary": "Logout user",
        "tags": ["Auth"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["refreshToken"],
                "properties": {
                  "refreshToken": {
                    "type": "string",
                    "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Logout successful"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/auth/refresh-tokens": {
      "post": {
        "summary": "Refresh access token using refresh token",
        "tags": ["Auth"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["refreshToken"],
                "properties": {
                  "refreshToken": {
                    "type": "string",
                    "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Tokens refreshed successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthTokens"
                }
              }
            }
          },
          "401": {
            "description": "Invalid refresh token"
          }
        }
      }
    },
    "/auth/change-password": {
      "post": {
        "summary": "Change password",
        "tags": ["Auth"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["currentPassword", "newPassword"],
                "properties": {
                  "currentPassword": {
                    "type": "string",
                    "format": "password",
                    "example": "oldPassword123"
                  },
                  "newPassword": {
                    "type": "string",
                    "format": "password",
                    "example": "newPassword123"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Password changed successfully"
          },
          "401": {
            "description": "Unauthorized or incorrect current password"
          }
        }
      }
    },
    "/auth/me": {
      "get": {
        "summary": "Get current user profile",
        "tags": ["Auth"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Current user profile",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Employee"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/customer-tiers": {
      "post": {
        "summary": "Create a new customer tier",
        "tags": ["Customer Tiers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["code", "name", "pointsRequired", "roomDiscountFactor"],
                "properties": {
                  "code": {
                    "type": "string",
                    "example": "GOLD"
                  },
                  "name": {
                    "type": "string",
                    "example": "Gold Member"
                  },
                  "pointsRequired": {
                    "type": "integer",
                    "example": 500
                  },
                  "roomDiscountFactor": {
                    "type": "number",
                    "format": "decimal",
                    "example": 0.1
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Customer tier created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      },
      "get": {
        "summary": "Get all customer tiers",
        "tags": ["Customer Tiers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of customer tiers"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/customer-tiers/{tierId}": {
      "get": {
        "summary": "Get customer tier by ID",
        "tags": ["Customer Tiers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "tierId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Customer tier details"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Customer tier not found"
          }
        }
      },
      "patch": {
        "summary": "Update customer tier",
        "tags": ["Customer Tiers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "tierId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "pointsRequired": {
                    "type": "integer"
                  },
                  "roomDiscountFactor": {
                    "type": "number",
                    "format": "decimal"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Customer tier updated successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Customer tier not found"
          }
        }
      },
      "delete": {
        "summary": "Delete customer tier",
        "tags": ["Customer Tiers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "tierId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "Customer tier deleted successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Customer tier not found"
          }
        }
      }
    },
    "/customer-tiers/upgrade/{customerId}": {
      "post": {
        "summary": "Check and upgrade customer tier",
        "tags": ["Customer Tiers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "customerId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Tier upgrade result"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/customer-tiers/batch-upgrade": {
      "post": {
        "summary": "Batch upgrade customers",
        "tags": ["Customer Tiers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Batch upgrade completed"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/customers/tiers": {
      "post": {
        "summary": "Create a new customer tier",
        "tags": ["Customers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["code", "name", "pointsRequired"],
                "properties": {
                  "code": {
                    "type": "string",
                    "example": "SILVER"
                  },
                  "name": {
                    "type": "string",
                    "example": "Silver Member"
                  },
                  "pointsRequired": {
                    "type": "integer",
                    "example": 250
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Customer tier created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      },
      "get": {
        "summary": "Get all customer tiers",
        "tags": ["Customers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "List of customer tiers"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/customers/tiers/{tierId}": {
      "get": {
        "summary": "Get customer tier by ID",
        "tags": ["Customers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "tierId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Customer tier details"
          },
          "404": {
            "description": "Tier not found"
          }
        }
      },
      "patch": {
        "summary": "Update customer tier",
        "tags": ["Customers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "tierId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Tier updated successfully"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      },
      "delete": {
        "summary": "Delete customer tier",
        "tags": ["Customers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "tierId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "Tier deleted successfully"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/customers": {
      "post": {
        "summary": "Create a new customer",
        "tags": ["Customers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["firstName", "email"],
                "properties": {
                  "firstName": {
                    "type": "string",
                    "example": "John"
                  },
                  "lastName": {
                    "type": "string",
                    "example": "Doe"
                  },
                  "email": {
                    "type": "string",
                    "format": "email",
                    "example": "john@example.com"
                  },
                  "phone": {
                    "type": "string"
                  },
                  "address": {
                    "type": "string"
                  },
                  "city": {
                    "type": "string"
                  },
                  "country": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Customer created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      },
      "get": {
        "summary": "Get all customers",
        "tags": ["Customers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "tierId",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of customers"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/customers/search": {
      "get": {
        "summary": "Search customers",
        "tags": ["Customers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "q",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Search keyword (name, email, phone)"
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Search results"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/customers/{customerId}": {
      "get": {
        "summary": "Get customer by ID",
        "tags": ["Customers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "customerId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Customer details"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Customer not found"
          }
        }
      },
      "patch": {
        "summary": "Update customer",
        "tags": ["Customers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "customerId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "firstName": {
                    "type": "string"
                  },
                  "lastName": {
                    "type": "string"
                  },
                  "email": {
                    "type": "string",
                    "format": "email"
                  },
                  "phone": {
                    "type": "string"
                  },
                  "address": {
                    "type": "string"
                  },
                  "city": {
                    "type": "string"
                  },
                  "country": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Customer updated successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Customer not found"
          }
        }
      },
      "delete": {
        "summary": "Delete customer",
        "tags": ["Customers"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "customerId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "Customer deleted successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Customer not found"
          }
        }
      }
    },
    "/employees": {
      "post": {
        "summary": "Create a new employee",
        "tags": ["Employees"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["code", "name", "email", "phone", "userGroupId"],
                "properties": {
                  "code": {
                    "type": "string",
                    "example": "EMP001"
                  },
                  "name": {
                    "type": "string",
                    "example": "John Doe"
                  },
                  "email": {
                    "type": "string",
                    "format": "email",
                    "example": "john@hotel.com"
                  },
                  "phone": {
                    "type": "string",
                    "example": "0123456789"
                  },
                  "userGroupId": {
                    "type": "integer",
                    "example": 1
                  },
                  "isActive": {
                    "type": "boolean",
                    "example": true
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Employee created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Employee"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden - insufficient permissions"
          }
        }
      },
      "get": {
        "summary": "Get all employees",
        "tags": ["Employees"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Items per page"
          },
          {
            "in": "query",
            "name": "search",
            "schema": {
              "type": "string"
            },
            "description": "Search by name or email"
          },
          {
            "in": "query",
            "name": "isActive",
            "schema": {
              "type": "boolean"
            },
            "description": "Filter by active status"
          }
        ],
        "responses": {
          "200": {
            "description": "List of employees",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/Employee"
                      }
                    },
                    "pagination": {
                      "type": "object",
                      "properties": {
                        "page": {
                          "type": "integer"
                        },
                        "limit": {
                          "type": "integer"
                        },
                        "total": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden - insufficient permissions"
          }
        }
      }
    },
    "/employees/{employeeId}": {
      "get": {
        "summary": "Get employee by ID",
        "tags": ["Employees"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "employeeId",
            "required": true,
            "schema": {
              "type": "integer"
            },
            "description": "Employee ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Employee details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Employee"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden - insufficient permissions"
          },
          "404": {
            "description": "Employee not found"
          }
        }
      },
      "patch": {
        "summary": "Update employee",
        "tags": ["Employees"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "employeeId",
            "required": true,
            "schema": {
              "type": "integer"
            },
            "description": "Employee ID"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "email": {
                    "type": "string",
                    "format": "email"
                  },
                  "phone": {
                    "type": "string"
                  },
                  "userGroupId": {
                    "type": "integer"
                  },
                  "isActive": {
                    "type": "boolean"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Employee updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Employee"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden - insufficient permissions"
          },
          "404": {
            "description": "Employee not found"
          }
        }
      },
      "delete": {
        "summary": "Delete employee",
        "tags": ["Employees"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "employeeId",
            "required": true,
            "schema": {
              "type": "integer"
            },
            "description": "Employee ID"
          }
        ],
        "responses": {
          "204": {
            "description": "Employee deleted successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden - insufficient permissions"
          },
          "404": {
            "description": "Employee not found"
          }
        }
      }
    },
    "/folios": {
      "post": {
        "summary": "Create a new guest folio",
        "tags": ["Folios"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["stayRecordId"],
                "properties": {
                  "stayRecordId": {
                    "type": "integer"
                  },
                  "notes": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Folio created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      },
      "get": {
        "summary": "Get all folios",
        "tags": ["Folios"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "status",
            "schema": {
              "type": "string",
              "enum": ["OPEN", "CLOSED", "SETTLED"]
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of folios"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/folios/{folioId}": {
      "get": {
        "summary": "Get folio by ID",
        "tags": ["Folios"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "folioId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Folio details"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Folio not found"
          }
        }
      },
      "patch": {
        "summary": "Update folio",
        "tags": ["Folios"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "folioId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "notes": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Folio updated successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/folios/{folioId}/summary": {
      "get": {
        "summary": "Get folio summary",
        "tags": ["Folios"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "folioId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Folio summary with totals"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/folios/{folioId}/close": {
      "post": {
        "summary": "Close a folio",
        "tags": ["Folios"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "folioId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Folio closed successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/folios/{folioId}/room-charges": {
      "post": {
        "summary": "Add room charge to folio",
        "tags": ["Folios"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "folioId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["stayDetailId", "amount"],
                "properties": {
                  "stayDetailId": {
                    "type": "integer"
                  },
                  "amount": {
                    "type": "number",
                    "format": "decimal"
                  },
                  "description": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Room charge added successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/folios/{folioId}/service-charges": {
      "post": {
        "summary": "Add service charge to folio",
        "tags": ["Folios"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "folioId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["serviceId", "quantity"],
                "properties": {
                  "serviceId": {
                    "type": "integer"
                  },
                  "quantity": {
                    "type": "integer"
                  },
                  "amount": {
                    "type": "number",
                    "format": "decimal"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Service charge added successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/folios/{folioId}/payments": {
      "post": {
        "summary": "Add payment to folio",
        "tags": ["Folios"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "folioId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["amount", "paymentMethodId"],
                "properties": {
                  "amount": {
                    "type": "number",
                    "format": "decimal"
                  },
                  "paymentMethodId": {
                    "type": "integer"
                  },
                  "reference": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Payment added successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/folios/{folioId}/deposits": {
      "post": {
        "summary": "Add deposit to folio",
        "tags": ["Folios"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "folioId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["amount", "paymentMethodId"],
                "properties": {
                  "amount": {
                    "type": "number",
                    "format": "decimal"
                  },
                  "paymentMethodId": {
                    "type": "integer"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Deposit added successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/folios/{folioId}/refunds": {
      "post": {
        "summary": "Add refund to folio",
        "tags": ["Folios"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "folioId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["amount"],
                "properties": {
                  "amount": {
                    "type": "number",
                    "format": "decimal"
                  },
                  "reason": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Refund added successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/folios/{folioId}/discounts": {
      "post": {
        "summary": "Add discount to folio",
        "tags": ["Folios"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "folioId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["amount"],
                "properties": {
                  "amount": {
                    "type": "number",
                    "format": "decimal"
                  },
                  "reason": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Discount added successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/folios/transactions/{transactionId}/void": {
      "post": {
        "summary": "Void a transaction",
        "tags": ["Folios"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "transactionId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Transaction voided successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/housekeeping": {
      "post": {
        "summary": "Create a new housekeeping log",
        "tags": ["Housekeeping"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["roomId"],
                "properties": {
                  "roomId": {
                    "type": "integer"
                  },
                  "assignedToId": {
                    "type": "integer"
                  },
                  "notes": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Housekeeping log created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      },
      "get": {
        "summary": "Get all housekeeping logs",
        "tags": ["Housekeeping"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "status",
            "schema": {
              "type": "string",
              "enum": ["PENDING", "IN_PROGRESS", "COMPLETED", "INSPECTED"]
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of housekeeping logs"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/housekeeping/pending": {
      "get": {
        "summary": "Get pending rooms that need cleaning",
        "tags": ["Housekeeping"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of pending rooms"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/housekeeping/my-tasks": {
      "get": {
        "summary": "Get current user's housekeeping tasks",
        "tags": ["Housekeeping"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "List of assigned tasks"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/housekeeping/{logId}": {
      "get": {
        "summary": "Get housekeeping log by ID",
        "tags": ["Housekeeping"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "logId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Housekeeping log details"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Log not found"
          }
        }
      }
    },
    "/housekeeping/{logId}/start": {
      "post": {
        "summary": "Start cleaning a room",
        "tags": ["Housekeeping"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "logId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Cleaning started successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/housekeeping/{logId}/complete": {
      "post": {
        "summary": "Mark cleaning as complete",
        "tags": ["Housekeeping"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "logId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Cleaning marked as complete"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/housekeeping/{logId}/inspect": {
      "post": {
        "summary": "Inspect a cleaned room",
        "tags": ["Housekeeping"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "logId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "isApproved": {
                    "type": "boolean"
                  },
                  "notes": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Room inspection completed"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/housekeeping/{logId}/assign": {
      "post": {
        "summary": "Assign room to housekeeper",
        "tags": ["Housekeeping"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "logId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["employeeId"],
                "properties": {
                  "employeeId": {
                    "type": "integer"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Room assigned successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/housekeeping/bulk-assign": {
      "post": {
        "summary": "Bulk assign rooms to housekeepers",
        "tags": ["Housekeeping"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["assignments"],
                "properties": {
                  "assignments": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "logId": {
                          "type": "integer"
                        },
                        "employeeId": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Bulk assignment completed"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/inspections/{stayDetailId}": {
      "post": {
        "summary": "Create a room inspection",
        "tags": ["Inspections"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "stayDetailId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "notes": {
                    "type": "string"
                  },
                  "damages": {
                    "type": "array",
                    "items": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Inspection created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      },
      "get": {
        "summary": "Get inspection for a stay detail",
        "tags": ["Inspections"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "stayDetailId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Inspection details"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Inspection not found"
          }
        }
      },
      "patch": {
        "summary": "Update inspection",
        "tags": ["Inspections"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "stayDetailId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Inspection updated successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/inspections/{stayDetailId}/can-checkout": {
      "get": {
        "summary": "Check if guest can checkout",
        "tags": ["Inspections"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "stayDetailId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Checkout eligibility result"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/invoices": {
      "post": {
        "summary": "Create a new invoice",
        "tags": ["Invoices"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["folioId"],
                "properties": {
                  "folioId": {
                    "type": "integer"
                  },
                  "notes": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Invoice created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      },
      "get": {
        "summary": "Get all invoices",
        "tags": ["Invoices"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "status",
            "schema": {
              "type": "string",
              "enum": ["DRAFT", "ISSUED", "PAID", "CANCELLED"]
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of invoices"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/invoices/{invoiceId}": {
      "get": {
        "summary": "Get invoice by ID",
        "tags": ["Invoices"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "invoiceId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Invoice details"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Invoice not found"
          }
        }
      }
    },
    "/invoices/{invoiceId}/print": {
      "get": {
        "summary": "Get invoice for printing",
        "tags": ["Invoices"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "invoiceId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Printable invoice"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Invoice not found"
          }
        }
      }
    },
    "/nightly/run-all": {
      "post": {
        "summary": "Run all nightly jobs",
        "tags": ["Nightly Jobs"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "description": "Manual trigger for all nightly jobs (for admin/testing purposes). In production, this should be triggered by a cron job.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "All nightly jobs completed successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden - insufficient permissions"
          }
        }
      }
    },
    "/nightly/room-charges": {
      "post": {
        "summary": "Post room charges",
        "tags": ["Nightly Jobs"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Room charges posted successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/nightly/extra-person-charges": {
      "post": {
        "summary": "Post extra person charges",
        "tags": ["Nightly Jobs"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Extra person charges posted successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/nightly/no-show": {
      "post": {
        "summary": "Mark no-shows",
        "tags": ["Nightly Jobs"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "No-shows marked successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/nightly/daily-snapshot": {
      "post": {
        "summary": "Create daily snapshot",
        "tags": ["Nightly Jobs"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Daily snapshot created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/reports/daily-snapshot": {
      "get": {
        "summary": "Get daily snapshot report",
        "tags": ["Reports"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "date",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Daily snapshot data"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/reports/snapshots": {
      "get": {
        "summary": "Get daily snapshots",
        "tags": ["Reports"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "startDate",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "in": "query",
            "name": "endDate",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of daily snapshots"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/reports/occupancy": {
      "get": {
        "summary": "Get occupancy report",
        "tags": ["Reports"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "startDate",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "in": "query",
            "name": "endDate",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "in": "query",
            "name": "roomTypeId",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Occupancy report data"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/reports/revenue": {
      "get": {
        "summary": "Get revenue report",
        "tags": ["Reports"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "startDate",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "in": "query",
            "name": "endDate",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Revenue report data"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/reports/revenue-by-room-type": {
      "get": {
        "summary": "Get revenue by room type report",
        "tags": ["Reports"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "startDate",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "in": "query",
            "name": "endDate",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Revenue breakdown by room type"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/reports/bookings": {
      "get": {
        "summary": "Get booking report",
        "tags": ["Reports"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "startDate",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "in": "query",
            "name": "endDate",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Booking report data"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/reports/dashboard": {
      "get": {
        "summary": "Get dashboard data",
        "tags": ["Reports"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Dashboard data with key metrics"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/reservations": {
      "post": {
        "summary": "Create a new reservation",
        "tags": ["Reservations"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "customerId",
                  "roomTypeId",
                  "checkInDate",
                  "checkOutDate",
                  "numberOfGuests"
                ],
                "properties": {
                  "customerId": {
                    "type": "integer"
                  },
                  "roomTypeId": {
                    "type": "integer"
                  },
                  "checkInDate": {
                    "type": "string",
                    "format": "date"
                  },
                  "checkOutDate": {
                    "type": "string",
                    "format": "date"
                  },
                  "numberOfGuests": {
                    "type": "integer"
                  },
                  "specialRequests": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Reservation created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      },
      "get": {
        "summary": "Get all reservations",
        "tags": ["Reservations"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "status",
            "schema": {
              "type": "string",
              "enum": ["PENDING", "CONFIRMED", "CANCELLED", "CHECKED_IN", "CHECKED_OUT"]
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of reservations"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/reservations/arrivals": {
      "get": {
        "summary": "Get today's arrivals",
        "tags": ["Reservations"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "List of arrivals for today"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/reservations/departures": {
      "get": {
        "summary": "Get today's departures",
        "tags": ["Reservations"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "List of departures for today"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/reservations/{reservationId}": {
      "get": {
        "summary": "Get reservation by ID",
        "tags": ["Reservations"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "reservationId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Reservation details"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Reservation not found"
          }
        }
      },
      "patch": {
        "summary": "Update reservation",
        "tags": ["Reservations"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "reservationId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "checkInDate": {
                    "type": "string",
                    "format": "date"
                  },
                  "checkOutDate": {
                    "type": "string",
                    "format": "date"
                  },
                  "numberOfGuests": {
                    "type": "integer"
                  },
                  "specialRequests": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Reservation updated successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Reservation not found"
          }
        }
      }
    },
    "/reservations/{reservationId}/confirm": {
      "post": {
        "summary": "Confirm reservation",
        "tags": ["Reservations"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "reservationId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Reservation confirmed successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/reservations/{reservationId}/cancel": {
      "post": {
        "summary": "Cancel reservation",
        "tags": ["Reservations"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "reservationId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "reason": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Reservation cancelled successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/reservations/{reservationId}/check-in": {
      "post": {
        "summary": "Check in reservation",
        "tags": ["Reservations"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "reservationId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "roomId": {
                    "type": "integer"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Checked in successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/rooms/types": {
      "post": {
        "summary": "Create a new room type",
        "tags": ["Rooms"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["code", "name", "basePrice", "maxGuests"],
                "properties": {
                  "code": {
                    "type": "string",
                    "example": "SINGLE"
                  },
                  "name": {
                    "type": "string",
                    "example": "Single Room"
                  },
                  "basePrice": {
                    "type": "number",
                    "format": "decimal",
                    "example": 100
                  },
                  "maxGuests": {
                    "type": "integer",
                    "example": 1
                  },
                  "description": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Room type created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden - insufficient permissions"
          }
        }
      },
      "get": {
        "summary": "Get all room types",
        "tags": ["Rooms"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of room types"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/rooms/types/{roomTypeId}": {
      "get": {
        "summary": "Get room type by ID",
        "tags": ["Rooms"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "roomTypeId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Room type details"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Room type not found"
          }
        }
      },
      "patch": {
        "summary": "Update room type",
        "tags": ["Rooms"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "roomTypeId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "basePrice": {
                    "type": "number",
                    "format": "decimal"
                  },
                  "maxGuests": {
                    "type": "integer"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Room type updated successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Room type not found"
          }
        }
      },
      "delete": {
        "summary": "Delete room type",
        "tags": ["Rooms"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "roomTypeId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "Room type deleted successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Room type not found"
          }
        }
      }
    },
    "/rooms": {
      "post": {
        "summary": "Create a new room",
        "tags": ["Rooms"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["roomNumber", "roomTypeId", "floor"],
                "properties": {
                  "roomNumber": {
                    "type": "string",
                    "example": "101"
                  },
                  "roomTypeId": {
                    "type": "integer",
                    "example": 1
                  },
                  "floor": {
                    "type": "integer",
                    "example": 1
                  },
                  "notes": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Room created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      },
      "get": {
        "summary": "Get all rooms",
        "tags": ["Rooms"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "roomTypeId",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "status",
            "schema": {
              "type": "string",
              "enum": ["AVAILABLE", "OCCUPIED", "MAINTENANCE", "DIRTY"]
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of rooms"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/rooms/available": {
      "get": {
        "summary": "Get available rooms",
        "tags": ["Rooms"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "checkInDate",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            },
            "description": "Check-in date"
          },
          {
            "in": "query",
            "name": "checkOutDate",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            },
            "description": "Check-out date"
          },
          {
            "in": "query",
            "name": "roomTypeId",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Available rooms"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/rooms/availability": {
      "get": {
        "summary": "Check room availability",
        "tags": ["Rooms"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "checkInDate",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "in": "query",
            "name": "checkOutDate",
            "required": true,
            "schema": {
              "type": "string",
              "format": "date"
            }
          },
          {
            "in": "query",
            "name": "roomTypeId",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Availability check result"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/rooms/{roomId}": {
      "get": {
        "summary": "Get room by ID",
        "tags": ["Rooms"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "roomId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Room details"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Room not found"
          }
        }
      },
      "patch": {
        "summary": "Update room",
        "tags": ["Rooms"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "roomId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "roomNumber": {
                    "type": "string"
                  },
                  "roomTypeId": {
                    "type": "integer"
                  },
                  "floor": {
                    "type": "integer"
                  },
                  "notes": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Room updated successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Room not found"
          }
        }
      },
      "delete": {
        "summary": "Delete room",
        "tags": ["Rooms"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "roomId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "Room deleted successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Room not found"
          }
        }
      }
    },
    "/rooms/{roomId}/status": {
      "patch": {
        "summary": "Update room status",
        "tags": ["Rooms"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "roomId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["status"],
                "properties": {
                  "status": {
                    "type": "string",
                    "enum": ["AVAILABLE", "OCCUPIED", "MAINTENANCE", "DIRTY"],
                    "example": "MAINTENANCE"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Room status updated successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Room not found"
          }
        }
      }
    },
    "/services": {
      "post": {
        "summary": "Create a new service",
        "tags": ["Services"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["code", "name", "price", "category"],
                "properties": {
                  "code": {
                    "type": "string",
                    "example": "BREAKFAST"
                  },
                  "name": {
                    "type": "string",
                    "example": "Breakfast"
                  },
                  "price": {
                    "type": "number",
                    "format": "decimal",
                    "example": 15
                  },
                  "category": {
                    "type": "string",
                    "example": "FOOD"
                  },
                  "description": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Service created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      },
      "get": {
        "summary": "Get all services",
        "tags": ["Services"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "category",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of services"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/services/{serviceId}": {
      "get": {
        "summary": "Get service by ID",
        "tags": ["Services"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "serviceId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Service details"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Service not found"
          }
        }
      },
      "patch": {
        "summary": "Update service",
        "tags": ["Services"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "serviceId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "price": {
                    "type": "number",
                    "format": "decimal"
                  },
                  "category": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Service updated successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Service not found"
          }
        }
      },
      "delete": {
        "summary": "Delete service",
        "tags": ["Services"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "serviceId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "Service deleted successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Service not found"
          }
        }
      }
    },
    "/services/payment-methods": {
      "post": {
        "summary": "Create a new payment method",
        "tags": ["Services"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["code", "name"],
                "properties": {
                  "code": {
                    "type": "string",
                    "example": "CASH"
                  },
                  "name": {
                    "type": "string",
                    "example": "Cash"
                  },
                  "description": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Payment method created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      },
      "get": {
        "summary": "Get all payment methods",
        "tags": ["Services"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "List of payment methods"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/services/payment-methods/{methodId}": {
      "get": {
        "summary": "Get payment method by ID",
        "tags": ["Services"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "methodId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Payment method details"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Payment method not found"
          }
        }
      },
      "patch": {
        "summary": "Update payment method",
        "tags": ["Services"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "methodId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Payment method updated successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Payment method not found"
          }
        }
      },
      "delete": {
        "summary": "Delete payment method",
        "tags": ["Services"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "methodId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "Payment method deleted successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Payment method not found"
          }
        }
      }
    },
    "/shifts": {
      "post": {
        "summary": "Create a new work shift",
        "tags": ["Shifts"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["name", "startTime", "endTime"],
                "properties": {
                  "name": {
                    "type": "string",
                    "example": "Morning Shift"
                  },
                  "startTime": {
                    "type": "string",
                    "format": "time",
                    "example": "08:00"
                  },
                  "endTime": {
                    "type": "string",
                    "format": "time",
                    "example": "16:00"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Work shift created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      },
      "get": {
        "summary": "Get all work shifts",
        "tags": ["Shifts"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of work shifts"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/shifts/{shiftId}": {
      "get": {
        "summary": "Get work shift by ID",
        "tags": ["Shifts"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "shiftId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Work shift details"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Work shift not found"
          }
        }
      },
      "patch": {
        "summary": "Update work shift",
        "tags": ["Shifts"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "shiftId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "startTime": {
                    "type": "string",
                    "format": "time"
                  },
                  "endTime": {
                    "type": "string",
                    "format": "time"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Work shift updated successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Work shift not found"
          }
        }
      },
      "delete": {
        "summary": "Delete work shift",
        "tags": ["Shifts"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "shiftId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "Work shift deleted successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Work shift not found"
          }
        }
      }
    },
    "/shifts/sessions/open": {
      "post": {
        "summary": "Open a new shift session",
        "tags": ["Shifts"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["shiftId", "employeeId"],
                "properties": {
                  "shiftId": {
                    "type": "integer"
                  },
                  "employeeId": {
                    "type": "integer"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Shift session opened successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/shifts/sessions/{sessionId}/close": {
      "post": {
        "summary": "Close a shift session",
        "tags": ["Shifts"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "sessionId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Shift session closed successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/shifts/sessions/{sessionId}/approve": {
      "post": {
        "summary": "Approve a shift session",
        "tags": ["Shifts"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "sessionId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Shift session approved successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/shifts/sessions": {
      "get": {
        "summary": "Get all shift sessions",
        "tags": ["Shifts"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of shift sessions"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/shifts/sessions/me": {
      "get": {
        "summary": "Get current user's shift session",
        "tags": ["Shifts"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Current shift session details"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/stay-records": {
      "post": {
        "summary": "Create a new stay record (walk-in check-in)",
        "tags": ["Stay Records"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["customerId", "roomId", "checkInDate", "expectedCheckOutDate"],
                "properties": {
                  "customerId": {
                    "type": "integer"
                  },
                  "roomId": {
                    "type": "integer"
                  },
                  "checkInDate": {
                    "type": "string",
                    "format": "date-time"
                  },
                  "expectedCheckOutDate": {
                    "type": "string",
                    "format": "date"
                  },
                  "numberOfGuests": {
                    "type": "integer"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Stay record created successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      },
      "get": {
        "summary": "Get all stay records",
        "tags": ["Stay Records"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer"
            }
          },
          {
            "in": "query",
            "name": "status",
            "schema": {
              "type": "string",
              "enum": ["CHECKED_IN", "CHECKED_OUT"]
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of stay records"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/stay-records/guests": {
      "get": {
        "summary": "Get current guests",
        "tags": ["Stay Records"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "List of current guests checked in"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/stay-records/{stayRecordId}": {
      "get": {
        "summary": "Get stay record by ID",
        "tags": ["Stay Records"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "stayRecordId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Stay record details"
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Stay record not found"
          }
        }
      }
    },
    "/stay-records/{stayRecordId}/check-out": {
      "post": {
        "summary": "Check out a guest",
        "tags": ["Stay Records"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "stayRecordId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Guest checked out successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          },
          "404": {
            "description": "Stay record not found"
          }
        }
      }
    },
    "/stay-records/details/{stayDetailId}/check-out": {
      "post": {
        "summary": "Check out a specific room in a stay",
        "tags": ["Stay Records"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "stayDetailId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Room checked out successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/stay-records/details/{stayDetailId}/move": {
      "post": {
        "summary": "Move guest to another room",
        "tags": ["Stay Records"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "stayDetailId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["newRoomId"],
                "properties": {
                  "newRoomId": {
                    "type": "integer"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Guest moved successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/stay-records/details/{stayDetailId}/extend": {
      "post": {
        "summary": "Extend guest stay",
        "tags": ["Stay Records"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "stayDetailId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["newCheckOutDate"],
                "properties": {
                  "newCheckOutDate": {
                    "type": "string",
                    "format": "date"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Stay extended successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    },
    "/stay-records/details/{stayDetailId}/guests": {
      "post": {
        "summary": "Add guest to a room",
        "tags": ["Stay Records"],
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "in": "path",
            "name": "stayDetailId",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["guestName"],
                "properties": {
                  "guestName": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Guest added successfully"
          },
          "401": {
            "description": "Unauthorized"
          },
          "403": {
            "description": "Forbidden"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Employee": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer"
          },
          "code": {
            "type": "string",
            "example": "EMP001"
          },
          "name": {
            "type": "string",
            "example": "Admin User"
          },
          "email": {
            "type": "string",
            "format": "email",
            "example": "admin@hotel.com"
          },
          "phone": {
            "type": "string",
            "example": "0123456789"
          },
          "userGroupId": {
            "type": "integer",
            "example": 1
          },
          "isActive": {
            "type": "boolean",
            "example": true
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          },
          "userGroup": {
            "$ref": "#/components/schemas/UserGroup"
          }
        }
      },
      "UserGroup": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer"
          },
          "code": {
            "type": "string",
            "example": "ADMIN_GROUP"
          },
          "name": {
            "type": "string",
            "example": "Administrator"
          },
          "description": {
            "type": "string",
            "example": "Full system access with all permissions"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "Token": {
        "type": "object",
        "properties": {
          "token": {
            "type": "string"
          },
          "expires": {
            "type": "string",
            "format": "date-time"
          }
        },
        "example": {
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "expires": "2024-12-31T23:59:59.000Z"
        }
      },
      "AuthTokens": {
        "type": "object",
        "properties": {
          "access": {
            "$ref": "#/components/schemas/Token"
          },
          "refresh": {
            "$ref": "#/components/schemas/Token"
          }
        }
      },
      "CustomerTier": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer"
          },
          "code": {
            "type": "string",
            "example": "GOLD"
          },
          "name": {
            "type": "string",
            "example": "Gold"
          },
          "pointsRequired": {
            "type": "integer",
            "example": 500
          },
          "roomDiscountFactor": {
            "type": "number",
            "format": "decimal",
            "example": 10
          },
          "serviceDiscountFactor": {
            "type": "number",
            "format": "decimal",
            "example": 7
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "Customer": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer"
          },
          "code": {
            "type": "string",
            "example": "CUST001"
          },
          "tierId": {
            "type": "integer",
            "example": 1
          },
          "fullName": {
            "type": "string",
            "example": "Nguyễn Văn An"
          },
          "phone": {
            "type": "string",
            "example": "0901234567"
          },
          "email": {
            "type": "string",
            "format": "email",
            "example": "nguyenvanan@email.com"
          },
          "idNumber": {
            "type": "string",
            "example": "001234567890"
          },
          "nationality": {
            "type": "string",
            "example": "Vietnam"
          },
          "address": {
            "type": "string",
            "example": "123 Đường Lê Lợi, Q.1, TP.HCM"
          },
          "customerType": {
            "type": "string",
            "enum": ["INDIVIDUAL", "CORPORATE", "TRAVEL_AGENT"],
            "example": "INDIVIDUAL"
          },
          "loyaltyPoints": {
            "type": "integer",
            "example": 0
          },
          "totalSpending": {
            "type": "number",
            "format": "decimal",
            "example": 0
          },
          "totalNights": {
            "type": "integer",
            "example": 0
          },
          "lastStayDate": {
            "type": "string",
            "format": "date"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          },
          "tier": {
            "$ref": "#/components/schemas/CustomerTier"
          }
        }
      },
      "RoomType": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer"
          },
          "code": {
            "type": "string",
            "example": "DLX"
          },
          "name": {
            "type": "string",
            "example": "Deluxe Room"
          },
          "baseCapacity": {
            "type": "integer",
            "example": 2
          },
          "maxCapacity": {
            "type": "integer",
            "example": 4
          },
          "amenities": {
            "type": "string",
            "example": "Air conditioning, Smart TV, WiFi, Mini bar, Coffee maker, Bathtub, Ocean view"
          },
          "rackRate": {
            "type": "number",
            "format": "decimal",
            "example": 1800000
          },
          "extraPersonFee": {
            "type": "number",
            "format": "decimal",
            "example": 400000
          },
          "description": {
            "type": "string",
            "example": "Luxurious room with premium amenities and ocean view"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "Room": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer"
          },
          "code": {
            "type": "string",
            "example": "301"
          },
          "name": {
            "type": "string",
            "example": "Room 301"
          },
          "floor": {
            "type": "integer",
            "example": 3
          },
          "roomTypeId": {
            "type": "integer",
            "example": 3
          },
          "status": {
            "type": "string",
            "enum": [
              "AVAILABLE",
              "RESERVED",
              "OCCUPIED",
              "CLEANING",
              "MAINTENANCE",
              "OUT_OF_ORDER"
            ],
            "example": "AVAILABLE"
          },
          "notes": {
            "type": "string"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          },
          "roomType": {
            "$ref": "#/components/schemas/RoomType"
          }
        }
      },
      "Service": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer"
          },
          "code": {
            "type": "string",
            "example": "FB001"
          },
          "name": {
            "type": "string",
            "example": "Breakfast Buffet"
          },
          "unitPrice": {
            "type": "number",
            "format": "decimal",
            "example": 150000
          },
          "unit": {
            "type": "string",
            "example": "person"
          },
          "serviceGroup": {
            "type": "string",
            "enum": [
              "SURCHARGE",
              "PENALTY",
              "MINIBAR",
              "SPA",
              "LAUNDRY",
              "F_AND_B",
              "ROOM_SERVICE",
              "OTHER"
            ],
            "example": "F_AND_B"
          },
          "allowPromotion": {
            "type": "boolean",
            "example": true
          },
          "allowDiscount": {
            "type": "boolean",
            "example": true
          },
          "isActive": {
            "type": "boolean",
            "example": true
          },
          "notes": {
            "type": "string"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "PaymentMethod": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer"
          },
          "code": {
            "type": "string",
            "example": "CASH"
          },
          "name": {
            "type": "string",
            "example": "Cash"
          },
          "transactionFee": {
            "type": "number",
            "format": "decimal",
            "example": 0
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "Error": {
        "type": "object",
        "properties": {
          "code": {
            "type": "number"
          },
          "message": {
            "type": "string"
          }
        }
      },
      "PaginationMeta": {
        "type": "object",
        "properties": {
          "page": {
            "type": "integer",
            "example": 1
          },
          "limit": {
            "type": "integer",
            "example": 10
          },
          "totalPages": {
            "type": "integer",
            "example": 5
          },
          "totalResults": {
            "type": "integer",
            "example": 50
          }
        }
      }
    },
    "responses": {
      "DuplicateEmail": {
        "description": "Email already taken",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            },
            "example": {
              "code": 400,
              "message": "Email already taken"
            }
          }
        }
      },
      "DuplicateCode": {
        "description": "Code already exists",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            },
            "example": {
              "code": 400,
              "message": "Code already exists"
            }
          }
        }
      },
      "Unauthorized": {
        "description": "Unauthorized",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            },
            "example": {
              "code": 401,
              "message": "Please authenticate"
            }
          }
        }
      },
      "Forbidden": {
        "description": "Forbidden",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            },
            "example": {
              "code": 403,
              "message": "Forbidden"
            }
          }
        }
      },
      "NotFound": {
        "description": "Not found",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            },
            "example": {
              "code": 404,
              "message": "Not found"
            }
          }
        }
      },
      "BadRequest": {
        "description": "Bad Request",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/Error"
            },
            "example": {
              "code": 400,
              "message": "Invalid request parameters"
            }
          }
        }
      }
    },
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  },
  "tags": [
    {
      "name": "Auth",
      "description": "Authentication and authorization endpoints"
    },
    {
      "name": "Customer Tiers",
      "description": "Customer tier management and upgrades"
    },
    {
      "name": "Customers",
      "description": "Customer management endpoints"
    },
    {
      "name": "Employees",
      "description": "Employee management endpoints"
    },
    {
      "name": "Folios",
      "description": "Guest folio and billing management"
    },
    {
      "name": "Housekeeping",
      "description": "Housekeeping tasks and room cleaning management"
    },
    {
      "name": "Inspections",
      "description": "Room inspection management"
    },
    {
      "name": "Invoices",
      "description": "Invoice generation and management"
    },
    {
      "name": "Nightly Jobs",
      "description": "Nightly job operations and automated tasks"
    },
    {
      "name": "Reports",
      "description": "Business reporting and analytics"
    },
    {
      "name": "Reservations",
      "description": "Reservation management endpoints"
    },
    {
      "name": "Rooms",
      "description": "Room and room type management"
    },
    {
      "name": "Services",
      "description": "Service and payment method management"
    },
    {
      "name": "Shifts",
      "description": "Work shift management and shift sessions"
    },
    {
      "name": "Stay Records",
      "description": "Stay records and guest check-in/check-out management"
    }
  ]
}
```

---

## Reports

### GET /v1/reports/daily-snapshot

**Response Status:** `200`

**Success Response:**

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
  "roomRevenue": "0",
  "serviceRevenue": "0",
  "surchargeRevenue": "0",
  "penaltyRevenue": "0",
  "totalRevenue": "0",
  "newReservations": 0,
  "cancelledReservations": 0,
  "checkIns": 0,
  "checkOuts": 0,
  "noShows": 0,
  "totalGuests": 0,
  "averageDailyRate": "0",
  "revPAR": "0",
  "createdAt": "2025-12-14T07:29:59.322Z",
  "updatedAt": "2025-12-14T07:39:18.633Z"
}
```

---

### GET /v1/reports/snapshots

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"startDate\" is not allowed, \"endDate\" is not allowed",
  "stack": "Error: \"startDate\" is not allowed, \"endDate\" is not allowed\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/reports/occupancy

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"startDate\" is not allowed, \"endDate\" is not allowed",
  "stack": "Error: \"startDate\" is not allowed, \"endDate\" is not allowed\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/reports/revenue

Generate revenue report for specified date range

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"startDate\" is not allowed, \"endDate\" is not allowed",
  "stack": "Error: \"startDate\" is not allowed, \"endDate\" is not allowed\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/reports/revenue-by-room-type

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"startDate\" is not allowed, \"endDate\" is not allowed",
  "stack": "Error: \"startDate\" is not allowed, \"endDate\" is not allowed\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/reports/bookings

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"startDate\" is not allowed, \"endDate\" is not allowed",
  "stack": "Error: \"startDate\" is not allowed, \"endDate\" is not allowed\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/reports/dashboard

**Response Status:** `200`

**Success Response:**

```json
{
  "date": "2025-12-13T17:00:00.000Z",
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
    "arrivals": 0,
    "departures": 0,
    "currentGuests": 0,
    "pendingHousekeeping": 0
  },
  "finance": {
    "todayRevenue": "0",
    "todayPayments": "0"
  },
  "comparison": null
}
```

---

## Reservations

### POST /v1/reservations/

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"customerId\" is required, \"expectedArrival\" is required, \"expectedDeparture\" is required, \"reservationDetails\" is required",
  "stack": "Error: \"customerId\" is required, \"expectedArrival\" is required, \"expectedDeparture\" is required, \"reservationDetails\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/reservations/

**Response Status:** `200`

**Success Response:**

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

---

### GET /v1/reservations/arrivals

**Response Status:** `200`

**Success Response:**

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

---

### GET /v1/reservations/departures

**Response Status:** `200`

**Success Response:**

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

---

### GET /v1/reservations/:reservationId

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Reservation not found",
  "stack": "Error: Reservation not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\controllers\\reservation.controller.ts:29:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\controllers\\reservation.controller.ts:5:58)"
}
```

---

### PATCH /v1/reservations/:reservationId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"body\" must have at least 1 key",
  "stack": "Error: \"body\" must have at least 1 key\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### POST /v1/reservations/:reservationId/confirm

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Reservation not found",
  "stack": "Error: Reservation not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\reservation.service.ts:165:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\reservation.service.ts:5:58)"
}
```

---

### POST /v1/reservations/:reservationId/cancel

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Reservation not found",
  "stack": "Error: Reservation not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\reservation.service.ts:185:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\reservation.service.ts:5:58)"
}
```

---

### POST /v1/reservations/:reservationId/check-in

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"roomAssignments\" is required",
  "stack": "Error: \"roomAssignments\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

## Rooms

### POST /v1/rooms/types

**Request Body:**

```json
{
  "code": "DELUXE",
  "name": "Deluxe Room",
  "basePrice": 150,
  "maxGuests": 2,
  "description": "A comfortable deluxe room with city view"
}
```

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"baseCapacity\" is required, \"maxCapacity\" is required, \"rackRate\" is required, \"basePrice\" is not allowed, \"maxGuests\" is not allowed",
  "stack": "Error: \"baseCapacity\" is required, \"maxCapacity\" is required, \"rackRate\" is required, \"basePrice\" is not allowed, \"maxGuests\" is not allowed\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/rooms/types

**Response Status:** `200`

**Success Response:**

```json
{
  "results": [
    {
      "id": 5,
      "code": "FAM",
      "name": "Family Room",
      "baseCapacity": 4,
      "maxCapacity": 6,
      "amenities": "Connecting rooms, 2 bathrooms, Smart TV, WiFi, Mini bar, Coffee maker",
      "rackRate": "2500000",
      "extraPersonFee": "400000",
      "description": "Perfect for families with connecting rooms and extra space",
      "createdAt": "2025-12-14T05:55:42.874Z",
      "updatedAt": "2025-12-14T05:55:42.874Z"
    },
    {
      "id": 4,
      "code": "SUI",
      "name": "Suite",
      "baseCapacity": 2,
      "maxCapacity": 5,
      "amenities": "Separate living room, Smart TV, WiFi, Full mini bar, Coffee maker, Bathtub, Balcony, Ocean view",
      "rackRate": "3000000",
      "extraPersonFee": "500000",
      "description": "Spacious suite with separate living area and panoramic views",
      "createdAt": "2025-12-14T05:55:42.869Z",
      "updatedAt": "2025-12-14T05:55:42.869Z"
    },
    {
      "id": 3,
      "code": "DLX",
      "name": "Deluxe Room",
      "baseCapacity": 2,
      "maxCapacity": 4,
      "amenities": "Air conditioning, Smart TV, WiFi, Mini bar, Coffee maker, Bathtub, Ocean view",
      "rackRate": "1800000",
      "extraPersonFee": "400000",
      "description": "Luxurious room with premium amenities and ocean view",
      "createdAt": "2025-12-14T05:55:42.866Z",
      "updatedAt": "2025-12-14T05:55:42.866Z"
    },
    {
      "id": 2,
      "code": "SUP",
      "name": "Superior Room",
      "baseCapacity": 2,
      "maxCapacity": 4,
      "amenities": "Air conditioning, Smart TV, WiFi, Mini fridge, Coffee maker, City view",
      "rackRate": "1200000",
      "extraPersonFee": "300000",
      "description": "Enhanced comfort with better amenities and city view",
      "createdAt": "2025-12-14T05:55:42.862Z",
      "updatedAt": "2025-12-14T05:55:42.862Z"
    },
    {
      "id": 1,
      "code": "STD",
      "name": "Standard Room",
      "baseCapacity": 2,
      "maxCapacity": 3,
      "amenities": "Air conditioning, TV, WiFi, Mini fridge",
      "rackRate": "800000",
      "extraPersonFee": "200000",
      "description": "Comfortable standard room with basic amenities",
      "createdAt": "2025-12-14T05:55:42.855Z",
      "updatedAt": "2025-12-14T05:55:42.855Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 5
  }
}
```

---

### GET /v1/rooms/types/:roomTypeId

**Response Status:** `200`

**Success Response:**

```json
{
  "id": 1,
  "code": "STD",
  "name": "Standard Room",
  "baseCapacity": 2,
  "maxCapacity": 3,
  "amenities": "Air conditioning, TV, WiFi, Mini fridge",
  "rackRate": "800000",
  "extraPersonFee": "200000",
  "description": "Comfortable standard room with basic amenities",
  "createdAt": "2025-12-14T05:55:42.855Z",
  "updatedAt": "2025-12-14T05:55:42.855Z",
  "rooms": [
    {
      "id": 18,
      "code": "105",
      "name": "Room 105 (Maintenance)",
      "floor": 1,
      "roomTypeId": 1,
      "status": "MAINTENANCE",
      "notes": "AC unit replacement",
      "createdAt": "2025-12-14T05:55:42.963Z",
      "updatedAt": "2025-12-14T05:55:42.963Z"
    }
  ]
}
```

---

### PATCH /v1/rooms/types/:roomTypeId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"body\" must have at least 1 key",
  "stack": "Error: \"body\" must have at least 1 key\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### DELETE /v1/rooms/types/:roomTypeId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "Cannot delete room type with existing rooms",
  "stack": "Error: Cannot delete room type with existing rooms\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\room.service.ts:97:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\room.service.ts:5:58)"
}
```

---

### POST /v1/rooms/

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"code\" is required, \"name\" is required, \"roomTypeId\" is required",
  "stack": "Error: \"code\" is required, \"name\" is required, \"roomTypeId\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/rooms/

**Response Status:** `200`

**Success Response:**

```json
{
  "results": [
    {
      "id": 18,
      "code": "105",
      "name": "Room 105 (Maintenance)",
      "floor": 1,
      "roomTypeId": 1,
      "status": "MAINTENANCE",
      "notes": "AC unit replacement",
      "createdAt": "2025-12-14T05:55:42.963Z",
      "updatedAt": "2025-12-14T05:55:42.963Z",
      "roomType": {
        "id": 1,
        "code": "STD",
        "name": "Standard Room",
        "baseCapacity": 2,
        "maxCapacity": 3,
        "amenities": "Air conditioning, TV, WiFi, Mini fridge",
        "rackRate": "800000",
        "extraPersonFee": "200000",
        "description": "Comfortable standard room with basic amenities",
        "createdAt": "2025-12-14T05:55:42.855Z",
        "updatedAt": "2025-12-14T05:55:42.855Z"
      }
    },
    {
      "id": 5,
      "code": "201",
      "name": "Room 201",
      "floor": 2,
      "roomTypeId": 2,
      "status": "AVAILABLE",
      "notes": null,
      "createdAt": "2025-12-14T05:55:42.911Z",
      "updatedAt": "2025-12-14T05:55:42.911Z",
      "roomType": {
        "id": 2,
        "code": "SUP",
        "name": "Superior Room",
        "baseCapacity": 2,
        "maxCapacity": 4,
        "amenities": "Air conditioning, Smart TV, WiFi, Mini fridge, Coffee maker, City view",
        "rackRate": "1200000",
        "extraPersonFee": "300000",
        "description": "Enhanced comfort with better amenities and city view",
        "createdAt": "2025-12-14T05:55:42.862Z",
        "updatedAt": "2025-12-14T05:55:42.862Z"
      }
    },
    {
      "id": 6,
      "code": "202",
      "name": "Room 202",
      "floor": 2,
      "roomTypeId": 2,
      "status": "RESERVED",
      "notes": null,
      "createdAt": "2025-12-14T05:55:42.916Z",
      "updatedAt": "2025-12-14T05:55:42.916Z",
      "roomType": {
        "id": 2,
        "code": "SUP",
        "name": "Superior Room",
        "baseCapacity": 2,
        "maxCapacity": 4,
        "amenities": "Air conditioning, Smart TV, WiFi, Mini fridge, Coffee maker, City view",
        "rackRate": "1200000",
        "extraPersonFee": "300000",
        "description": "Enhanced comfort with better amenities and city view",
        "createdAt": "2025-12-14T05:55:42.862Z",
        "updatedAt": "2025-12-14T05:55:42.862Z"
      }
    },
    {
      "id": 7,
      "code": "203",
      "name": "Room 203",
      "floor": 2,
      "roomTypeId": 2,
      "status": "AVAILABLE",
      "notes": null,
      "createdAt": "2025-12-14T05:55:42.920Z",
      "updatedAt": "2025-12-14T05:55:42.920Z",
      "roomType": {
        "id": 2,
        "code": "SUP",
        "name": "Superior Room",
        "baseCapacity": 2,
        "maxCapacity": 4,
        "amenities": "Air conditioning, Smart TV, WiFi, Mini fridge, Coffee maker, City view",
        "rackRate": "1200000",
        "extraPersonFee": "300000",
        "description": "Enhanced comfort with better amenities and city view",
        "createdAt": "2025-12-14T05:55:42.862Z",
        "updatedAt": "2025-12-14T05:55:42.862Z"
      }
    },
    {
      "id": 8,
      "code": "204",
      "name": "Room 204",
      "floor": 2,
      "roomTypeId": 2,
      "status": "OCCUPIED",
      "notes": null,
      "createdAt": "2025-12-14T05:55:42.924Z",
      "updatedAt": "2025-12-14T05:55:42.924Z",
      "roomType": {
        "id": 2,
        "code": "SUP",
        "name": "Superior Room",
        "baseCapacity": 2,
        "maxCapacity": 4,
        "amenities": "Air conditioning, Smart TV, WiFi, Mini fridge, Coffee maker, City view",
        "rackRate": "1200000",
        "extraPersonFee": "300000",
        "description": "Enhanced comfort with better amenities and city view",
        "createdAt": "2025-12-14T05:55:42.862Z",
        "updatedAt": "2025-12-14T05:55:42.862Z"
      }
    },
    {
      "id": 9,
      "code": "205",
      "name": "Room 205",
      "floor": 2,
      "roomTypeId": 2,
      "status": "AVAILABLE",
      "notes": null,
      "createdAt": "2025-12-14T05:55:42.928Z",
      "updatedAt": "2025-12-14T05:55:42.928Z",
      "roomType": {
        "id": 2,
        "code": "SUP",
        "name": "Superior Room",
        "baseCapacity": 2,
        "maxCapacity": 4,
        "amenities": "Air conditioning, Smart TV, WiFi, Mini fridge, Coffee maker, City view",
        "rackRate": "1200000",
        "extraPersonFee": "300000",
        "description": "Enhanced comfort with better amenities and city view",
        "createdAt": "2025-12-14T05:55:42.862Z",
        "updatedAt": "2025-12-14T05:55:42.862Z"
      }
    },
    {
      "id": 10,
      "code": "301",
      "name": "Room 301",
      "floor": 3,
      "roomTypeId": 3,
      "status": "AVAILABLE",
      "notes": null,
      "createdAt": "2025-12-14T05:55:42.932Z",
      "updatedAt": "2025-12-14T05:55:42.932Z",
      "roomType": {
        "id": 3,
        "code": "DLX",
        "name": "Deluxe Room",
        "baseCapacity": 2,
        "maxCapacity": 4,
        "amenities": "Air conditioning, Smart TV, WiFi, Mini bar, Coffee maker, Bathtub, Ocean view",
        "rackRate": "1800000",
        "extraPersonFee": "400000",
        "description": "Luxurious room with premium amenities and ocean view",
        "createdAt": "2025-12-14T05:55:42.866Z",
        "updatedAt": "2025-12-14T05:55:42.866Z"
      }
    },
    {
      "id": 11,
      "code": "302",
      "name": "Room 302",
      "floor": 3,
      "roomTypeId": 3,
      "status": "AVAILABLE",
      "notes": null,
      "createdAt": "2025-12-14T05:55:42.935Z",
      "updatedAt": "2025-12-14T05:55:42.935Z",
      "roomType": {
        "id": 3,
        "code": "DLX",
        "name": "Deluxe Room",
        "baseCapacity": 2,
        "maxCapacity": 4,
        "amenities": "Air conditioning, Smart TV, WiFi, Mini bar, Coffee maker, Bathtub, Ocean view",
        "rackRate": "1800000",
        "extraPersonFee": "400000",
        "description": "Luxurious room with premium amenities and ocean view",
        "createdAt": "2025-12-14T05:55:42.866Z",
        "updatedAt": "2025-12-14T05:55:42.866Z"
      }
    },
    {
      "id": 12,
      "code": "303",
      "name": "Room 303",
      "floor": 3,
      "roomTypeId": 3,
      "status": "OCCUPIED",
      "notes": null,
      "createdAt": "2025-12-14T05:55:42.939Z",
      "updatedAt": "2025-12-14T05:55:42.939Z",
      "roomType": {
        "id": 3,
        "code": "DLX",
        "name": "Deluxe Room",
        "baseCapacity": 2,
        "maxCapacity": 4,
        "amenities": "Air conditioning, Smart TV, WiFi, Mini bar, Coffee maker, Bathtub, Ocean view",
        "rackRate": "1800000",
        "extraPersonFee": "400000",
        "description": "Luxurious room with premium amenities and ocean view",
        "createdAt": "2025-12-14T05:55:42.866Z",
        "updatedAt": "2025-12-14T05:55:42.866Z"
      }
    },
    {
      "id": 13,
      "code": "304",
      "name": "Room 304",
      "floor": 3,
      "roomTypeId": 3,
      "status": "AVAILABLE",
      "notes": null,
      "createdAt": "2025-12-14T05:55:42.943Z",
      "updatedAt": "2025-12-14T05:55:42.943Z",
      "roomType": {
        "id": 3,
        "code": "DLX",
        "name": "Deluxe Room",
        "baseCapacity": 2,
        "maxCapacity": 4,
        "amenities": "Air conditioning, Smart TV, WiFi, Mini bar, Coffee maker, Bathtub, Ocean view",
        "rackRate": "1800000",
        "extraPersonFee": "400000",
        "description": "Luxurious room with premium amenities and ocean view",
        "createdAt": "2025-12-14T05:55:42.866Z",
        "updatedAt": "2025-12-14T05:55:42.866Z"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "totalResults": 14
  }
}
```

---

### GET /v1/rooms/available

**Response Status:** `200`

**Success Response:**

```json
[
  {
    "id": 5,
    "code": "201",
    "name": "Room 201",
    "floor": 2,
    "roomTypeId": 2,
    "status": "AVAILABLE",
    "notes": null,
    "createdAt": "2025-12-14T05:55:42.911Z",
    "updatedAt": "2025-12-14T05:55:42.911Z",
    "roomType": {
      "id": 2,
      "code": "SUP",
      "name": "Superior Room",
      "baseCapacity": 2,
      "maxCapacity": 4,
      "amenities": "Air conditioning, Smart TV, WiFi, Mini fridge, Coffee maker, City view",
      "rackRate": "1200000",
      "extraPersonFee": "300000",
      "description": "Enhanced comfort with better amenities and city view",
      "createdAt": "2025-12-14T05:55:42.862Z",
      "updatedAt": "2025-12-14T05:55:42.862Z"
    }
  },
  {
    "id": 7,
    "code": "203",
    "name": "Room 203",
    "floor": 2,
    "roomTypeId": 2,
    "status": "AVAILABLE",
    "notes": null,
    "createdAt": "2025-12-14T05:55:42.920Z",
    "updatedAt": "2025-12-14T05:55:42.920Z",
    "roomType": {
      "id": 2,
      "code": "SUP",
      "name": "Superior Room",
      "baseCapacity": 2,
      "maxCapacity": 4,
      "amenities": "Air conditioning, Smart TV, WiFi, Mini fridge, Coffee maker, City view",
      "rackRate": "1200000",
      "extraPersonFee": "300000",
      "description": "Enhanced comfort with better amenities and city view",
      "createdAt": "2025-12-14T05:55:42.862Z",
      "updatedAt": "2025-12-14T05:55:42.862Z"
    }
  },
  {
    "id": 9,
    "code": "205",
    "name": "Room 205",
    "floor": 2,
    "roomTypeId": 2,
    "status": "AVAILABLE",
    "notes": null,
    "createdAt": "2025-12-14T05:55:42.928Z",
    "updatedAt": "2025-12-14T05:55:42.928Z",
    "roomType": {
      "id": 2,
      "code": "SUP",
      "name": "Superior Room",
      "baseCapacity": 2,
      "maxCapacity": 4,
      "amenities": "Air conditioning, Smart TV, WiFi, Mini fridge, Coffee maker, City view",
      "rackRate": "1200000",
      "extraPersonFee": "300000",
      "description": "Enhanced comfort with better amenities and city view",
      "createdAt": "2025-12-14T05:55:42.862Z",
      "updatedAt": "2025-12-14T05:55:42.862Z"
    }
  },
  {
    "id": 10,
    "code": "301",
    "name": "Room 301",
    "floor": 3,
    "roomTypeId": 3,
    "status": "AVAILABLE",
    "notes": null,
    "createdAt": "2025-12-14T05:55:42.932Z",
    "updatedAt": "2025-12-14T05:55:42.932Z",
    "roomType": {
      "id": 3,
      "code": "DLX",
      "name": "Deluxe Room",
      "baseCapacity": 2,
      "maxCapacity": 4,
      "amenities": "Air conditioning, Smart TV, WiFi, Mini bar, Coffee maker, Bathtub, Ocean view",
      "rackRate": "1800000",
      "extraPersonFee": "400000",
      "description": "Luxurious room with premium amenities and ocean view",
      "createdAt": "2025-12-14T05:55:42.866Z",
      "updatedAt": "2025-12-14T05:55:42.866Z"
    }
  },
  {
    "id": 11,
    "code": "302",
    "name": "Room 302",
    "floor": 3,
    "roomTypeId": 3,
    "status": "AVAILABLE",
    "notes": null,
    "createdAt": "2025-12-14T05:55:42.935Z",
    "updatedAt": "2025-12-14T05:55:42.935Z",
    "roomType": {
      "id": 3,
      "code": "DLX",
      "name": "Deluxe Room",
      "baseCapacity": 2,
      "maxCapacity": 4,
      "amenities": "Air conditioning, Smart TV, WiFi, Mini bar, Coffee maker, Bathtub, Ocean view",
      "rackRate": "1800000",
      "extraPersonFee": "400000",
      "description": "Luxurious room with premium amenities and ocean view",
      "createdAt": "2025-12-14T05:55:42.866Z",
      "updatedAt": "2025-12-14T05:55:42.866Z"
    }
  },
  {
    "id": 13,
    "code": "304",
    "name": "Room 304",
    "floor": 3,
    "roomTypeId": 3,
    "status": "AVAILABLE",
    "notes": null,
    "createdAt": "2025-12-14T05:55:42.943Z",
    "updatedAt": "2025-12-14T05:55:42.943Z",
    "roomType": {
      "id": 3,
      "code": "DLX",
      "name": "Deluxe Room",
      "baseCapacity": 2,
      "maxCapacity": 4,
      "amenities": "Air conditioning, Smart TV, WiFi, Mini bar, Coffee maker, Bathtub, Ocean view",
      "rackRate": "1800000",
      "extraPersonFee": "400000",
      "description": "Luxurious room with premium amenities and ocean view",
      "createdAt": "2025-12-14T05:55:42.866Z",
      "updatedAt": "2025-12-14T05:55:42.866Z"
    }
  },
  {
    "id": 14,
    "code": "401",
    "name": "Suite 401",
    "floor": 4,
    "roomTypeId": 4,
    "status": "AVAILABLE",
    "notes": null,
    "createdAt": "2025-12-14T05:55:42.947Z",
    "updatedAt": "2025-12-14T05:55:42.947Z",
    "roomType": {
      "id": 4,
      "code": "SUI",
      "name": "Suite",
      "baseCapacity": 2,
      "maxCapacity": 5,
      "amenities": "Separate living room, Smart TV, WiFi, Full mini bar, Coffee maker, Bathtub, Balcony, Ocean view",
      "rackRate": "3000000",
      "extraPersonFee": "500000",
      "description": "Spacious suite with separate living area and panoramic views",
      "createdAt": "2025-12-14T05:55:42.869Z",
      "updatedAt": "2025-12-14T05:55:42.869Z"
    }
  },
  {
    "id": 16,
    "code": "403",
    "name": "Family Room 403",
    "floor": 4,
    "roomTypeId": 5,
    "status": "AVAILABLE",
    "notes": null,
    "createdAt": "2025-12-14T05:55:42.954Z",
    "updatedAt": "2025-12-14T05:55:42.954Z",
    "roomType": {
      "id": 5,
      "code": "FAM",
      "name": "Family Room",
      "baseCapacity": 4,
      "maxCapacity": 6,
      "amenities": "Connecting rooms, 2 bathrooms, Smart TV, WiFi, Mini bar, Coffee maker",
      "rackRate": "2500000",
      "extraPersonFee": "400000",
      "description": "Perfect for families with connecting rooms and extra space",
      "createdAt": "2025-12-14T05:55:42.874Z",
      "updatedAt": "2025-12-14T05:55:42.874Z"
    }
  }
]
```

---

### GET /v1/rooms/availability

**Response Status:** `200`

**Success Response:**

```json
[
  {
    "roomTypeId": 1,
    "roomTypeName": "Standard Room",
    "totalRooms": 1,
    "availableRooms": 0,
    "rackRate": 800000
  },
  {
    "roomTypeId": 2,
    "roomTypeName": "Superior Room",
    "totalRooms": 5,
    "availableRooms": 3,
    "rackRate": 1200000
  },
  {
    "roomTypeId": 3,
    "roomTypeName": "Deluxe Room",
    "totalRooms": 4,
    "availableRooms": 3,
    "rackRate": 1800000
  },
  {
    "roomTypeId": 4,
    "roomTypeName": "Suite",
    "totalRooms": 2,
    "availableRooms": 1,
    "rackRate": 3000000
  },
  {
    "roomTypeId": 5,
    "roomTypeName": "Family Room",
    "totalRooms": 2,
    "availableRooms": 1,
    "rackRate": 2500000
  }
]
```

---

### GET /v1/rooms/:roomId

**Response Status:** `200`

**Success Response:**

```json
{
  "id": 5,
  "code": "201",
  "name": "Room 201",
  "floor": 2,
  "roomTypeId": 2,
  "status": "AVAILABLE",
  "notes": null,
  "createdAt": "2025-12-14T05:55:42.911Z",
  "updatedAt": "2025-12-14T05:55:42.911Z",
  "roomType": {
    "id": 2,
    "code": "SUP",
    "name": "Superior Room",
    "baseCapacity": 2,
    "maxCapacity": 4,
    "amenities": "Air conditioning, Smart TV, WiFi, Mini fridge, Coffee maker, City view",
    "rackRate": "1200000",
    "extraPersonFee": "300000",
    "description": "Enhanced comfort with better amenities and city view",
    "createdAt": "2025-12-14T05:55:42.862Z",
    "updatedAt": "2025-12-14T05:55:42.862Z"
  }
}
```

---

### PATCH /v1/rooms/:roomId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"body\" must have at least 1 key",
  "stack": "Error: \"body\" must have at least 1 key\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### DELETE /v1/rooms/:roomId

**Response Status:** `204`

---

### PATCH /v1/rooms/:roomId/status

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"status\" is required",
  "stack": "Error: \"status\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

## Services

### POST /v1/services/

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"code\" is required, \"name\" is required, \"unitPrice\" is required",
  "stack": "Error: \"code\" is required, \"name\" is required, \"unitPrice\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/services/

**Response Status:** `200`

**Success Response:**

```json
{
  "results": [
    {
      "id": 19,
      "code": "SC003",
      "name": "Airport Pickup",
      "unitPrice": "350000",
      "unit": "trip",
      "serviceGroup": "OTHER",
      "allowPromotion": true,
      "allowDiscount": true,
      "isActive": true,
      "notes": null,
      "createdAt": "2025-12-14T05:55:43.059Z",
      "updatedAt": "2025-12-14T05:55:43.059Z"
    },
    {
      "id": 15,
      "code": "SP002",
      "name": "Aromatherapy (90 min)",
      "unitPrice": "650000",
      "unit": "session",
      "serviceGroup": "SPA",
      "allowPromotion": true,
      "allowDiscount": true,
      "isActive": true,
      "notes": null,
      "createdAt": "2025-12-14T05:55:43.045Z",
      "updatedAt": "2025-12-14T05:55:43.045Z"
    },
    {
      "id": 7,
      "code": "MB002",
      "name": "Beer (Bottle)",
      "unitPrice": "45000",
      "unit": "bottle",
      "serviceGroup": "MINIBAR",
      "allowPromotion": true,
      "allowDiscount": true,
      "isActive": true,
      "notes": null,
      "createdAt": "2025-12-14T05:55:43.014Z",
      "updatedAt": "2025-12-14T05:55:43.014Z"
    },
    {
      "id": 13,
      "code": "LD004",
      "name": "Express Laundry (2hrs)",
      "unitPrice": "200000",
      "unit": "batch",
      "serviceGroup": "LAUNDRY",
      "allowPromotion": true,
      "allowDiscount": true,
      "isActive": true,
      "notes": null,
      "createdAt": "2025-12-14T05:55:43.038Z",
      "updatedAt": "2025-12-14T05:55:43.038Z"
    },
    {
      "id": 18,
      "code": "SC002",
      "name": "Extra Bed",
      "unitPrice": "200000",
      "unit": "night",
      "serviceGroup": "SURCHARGE",
      "allowPromotion": true,
      "allowDiscount": true,
      "isActive": true,
      "notes": null,
      "createdAt": "2025-12-14T05:55:43.055Z",
      "updatedAt": "2025-12-14T05:55:43.055Z"
    },
    {
      "id": 16,
      "code": "SP003",
      "name": "Facial Treatment",
      "unitPrice": "550000",
      "unit": "session",
      "serviceGroup": "SPA",
      "allowPromotion": true,
      "allowDiscount": true,
      "isActive": true,
      "notes": null,
      "createdAt": "2025-12-14T05:55:43.048Z",
      "updatedAt": "2025-12-14T05:55:43.048Z"
    },
    {
      "id": 17,
      "code": "SC001",
      "name": "Late Checkout Fee",
      "unitPrice": "150000",
      "unit": "hour",
      "serviceGroup": "SURCHARGE",
      "allowPromotion": false,
      "allowDiscount": false,
      "isActive": true,
      "notes": null,
      "createdAt": "2025-12-14T05:55:43.051Z",
      "updatedAt": "2025-12-14T05:55:43.051Z"
    },
    {
      "id": 21,
      "code": "PN002",
      "name": "Lost Key Card",
      "unitPrice": "100000",
      "unit": "piece",
      "serviceGroup": "PENALTY",
      "allowPromotion": false,
      "allowDiscount": false,
      "isActive": true,
      "notes": null,
      "createdAt": "2025-12-14T05:55:43.067Z",
      "updatedAt": "2025-12-14T05:55:43.067Z"
    },
    {
      "id": 8,
      "code": "MB003",
      "name": "Mineral Water (500ml)",
      "unitPrice": "15000",
      "unit": "bottle",
      "serviceGroup": "MINIBAR",
      "allowPromotion": true,
      "allowDiscount": true,
      "isActive": true,
      "notes": null,
      "createdAt": "2025-12-14T05:55:43.019Z",
      "updatedAt": "2025-12-14T05:55:43.019Z"
    },
    {
      "id": 22,
      "code": "PN003",
      "name": "Minibar Item Damage",
      "unitPrice": "200000",
      "unit": "item",
      "serviceGroup": "PENALTY",
      "allowPromotion": false,
      "allowDiscount": false,
      "isActive": true,
      "notes": null,
      "createdAt": "2025-12-14T05:55:43.071Z",
      "updatedAt": "2025-12-14T05:55:43.071Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "totalResults": 19
  }
}
```

---

### GET /v1/services/:serviceId

**Response Status:** `200`

**Success Response:**

```json
{
  "id": 4,
  "code": "FB004",
  "name": "Room Service - Breakfast",
  "unitPrice": "180000",
  "unit": "order",
  "serviceGroup": "ROOM_SERVICE",
  "allowPromotion": true,
  "allowDiscount": true,
  "isActive": true,
  "notes": null,
  "createdAt": "2025-12-14T05:55:43.001Z",
  "updatedAt": "2025-12-14T05:55:43.001Z"
}
```

---

### PATCH /v1/services/:serviceId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"body\" must have at least 1 key",
  "stack": "Error: \"body\" must have at least 1 key\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### DELETE /v1/services/:serviceId

**Response Status:** `204`

---

### POST /v1/services/payment-methods

**Request Body:**

```json
{
  "code": "CASH",
  "name": "Cash"
}
```

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "Payment method code already exists",
  "stack": "Error: Payment method code already exists\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\service.service.ts:113:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\service.service.ts:5:58)"
}
```

---

### GET /v1/services/payment-methods

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"serviceId\" must be a number",
  "stack": "Error: \"serviceId\" must be a number\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/services/payment-methods/:methodId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"paymentMethodId\" is required, \"methodId\" is not allowed",
  "stack": "Error: \"paymentMethodId\" is required, \"methodId\" is not allowed\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### PATCH /v1/services/payment-methods/:methodId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"paymentMethodId\" is required, \"methodId\" is not allowed, \"body\" must have at least 1 key",
  "stack": "Error: \"paymentMethodId\" is required, \"methodId\" is not allowed, \"body\" must have at least 1 key\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### DELETE /v1/services/payment-methods/:methodId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"paymentMethodId\" is required, \"methodId\" is not allowed",
  "stack": "Error: \"paymentMethodId\" is required, \"methodId\" is not allowed\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

## Shifts

### POST /v1/shifts/

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"code\" is required, \"name\" is required, \"startTime\" is required, \"endTime\" is required",
  "stack": "Error: \"code\" is required, \"name\" is required, \"startTime\" is required, \"endTime\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/shifts/

**Response Status:** `200`

**Success Response:**

```json
[]
```

---

### GET /v1/shifts/:shiftId

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Work shift not found",
  "stack": "Error: Work shift not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\shift.service.ts:50:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\shift.service.ts:5:58)"
}
```

---

### PATCH /v1/shifts/:shiftId

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"body\" must have at least 1 key",
  "stack": "Error: \"body\" must have at least 1 key\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### DELETE /v1/shifts/:shiftId

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Work shift not found",
  "stack": "Error: Work shift not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\shift.service.ts:89:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\shift.service.ts:5:58)"
}
```

---

### POST /v1/shifts/sessions/open

**Request Body:**

```json
{
  "shiftId": 1,
  "employeeId": 5
}
```

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"openingBalance\" is required, \"employeeId\" is not allowed",
  "stack": "Error: \"openingBalance\" is required, \"employeeId\" is not allowed\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### POST /v1/shifts/sessions/:sessionId/close

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"closingBalance\" is required",
  "stack": "Error: \"closingBalance\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### POST /v1/shifts/sessions/:sessionId/approve

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Shift session not found",
  "stack": "Error: Shift session not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\shift.service.ts:207:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\shift.service.ts:5:58)"
}
```

---

### GET /v1/shifts/sessions

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"shiftId\" must be a number",
  "stack": "Error: \"shiftId\" must be a number\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/shifts/sessions/me

**Response Status:** `200`

---

## Stay Records

### POST /v1/stay-records/

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"customerId\" is required, \"stayDetails\" is required",
  "stack": "Error: \"customerId\" is required, \"stayDetails\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### GET /v1/stay-records/

**Response Status:** `200`

**Success Response:**

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

---

### GET /v1/stay-records/guests

**Response Status:** `200`

**Success Response:**

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

---

### GET /v1/stay-records/:stayRecordId

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Stay record not found",
  "stack": "Error: Stay record not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\controllers\\stay-record.controller.ts:25:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\controllers\\stay-record.controller.ts:5:58)"
}
```

---

### POST /v1/stay-records/:stayRecordId/check-out

**Response Status:** `404`

**Error Response:**

```json
{
  "code": 404,
  "message": "Stay record not found",
  "stack": "Error: Stay record not found\n    at D:\\HOTEL_MS\\roommaster-be\\src\\services\\stay-record.service.ts:347:11\n    at Generator.next (<anonymous>)\n    at fulfilled (D:\\HOTEL_MS\\roommaster-be\\src\\services\\stay-record.service.ts:5:58)"
}
```

---

### POST /v1/stay-records/details/:stayDetailId/check-out

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"stayRecordId\" is required",
  "stack": "Error: \"stayRecordId\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### POST /v1/stay-records/details/:stayDetailId/move

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"stayRecordId\" is required, \"newRoomId\" is required",
  "stack": "Error: \"stayRecordId\" is required, \"newRoomId\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### POST /v1/stay-records/details/:stayDetailId/extend

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"stayRecordId\" is required, \"newExpectedCheckOut\" is required",
  "stack": "Error: \"stayRecordId\" is required, \"newExpectedCheckOut\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---

### POST /v1/stay-records/details/:stayDetailId/guests

**Response Status:** `400`

**Error Response:**

```json
{
  "code": 400,
  "message": "\"stayRecordId\" is required, \"fullName\" is required",
  "stack": "Error: \"stayRecordId\" is required, \"fullName\" is required\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\validate.ts:15:17\n    at Layer.handle [as handle_request] (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\layer.js:95:5)\n    at next (D:\\HOTEL_MS\\roommaster-be\\node_modules\\.pnpm\\express@4.22.1\\node_modules\\express\\lib\\router\\route.js:149:13)\n    at D:\\HOTEL_MS\\roommaster-be\\src\\middlewares\\auth.ts:70:19"
}
```

---
