# Stripe Connect Monetization API Documentation

This document provides comprehensive API documentation for the PikSend Stripe Connect monetization system. The API enables photographers to monetize their galleries through Stripe Connect.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Stripe Connect Endpoints](#stripe-connect-endpoints)
5. [Gallery Monetization Endpoints](#gallery-monetization-endpoints)
6. [Checkout Endpoints](#checkout-endpoints)
7. [Revenue Endpoints](#revenue-endpoints)
8. [Payout Endpoints](#payout-endpoints)
9. [Refund & Dispute Endpoints](#refund--dispute-endpoints)

---

## Overview

The PikSend monetization API allows photographers to:
- Connect their Stripe account to receive payments
- Configure gallery paywalls with pricing
- Track sales, revenue, and payouts
- Manage refunds and disputes

### Base URL

```
Production: https://piksend.com/api
Development: http://localhost:3000/api
```

### API Versioning

The API currently does not use versioning. All endpoints are available at the base URL.

---

## Authentication

Most endpoints require authentication via Supabase Auth. Include the authentication token in the request headers:

```http
Authorization: Bearer <supabase_access_token>
```

### Pro Plan Requirement

Many monetization features require a Pro subscription plan. Endpoints will return a `403 Forbidden` error if the user doesn't have the required plan.

---

## Error Handling

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request data |
| 401 | `UNAUTHORIZED` | Authentication required |
| 403 | `FORBIDDEN` | Insufficient permissions or plan |
| 404 | `NOT_FOUND` | Resource not found |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

---

## Stripe Connect Endpoints

### Create Connect Account & Start Onboarding

Creates a new Stripe Connect Express account and returns an onboarding link.

```http
POST /api/stripe/connect/onboard
```

**Authentication:** Required (Pro plan)

**Request Body:** None

**Response:**

```json
{
  "accountId": "acct_1234567890",
  "onboardingUrl": "https://connect.stripe.com/setup/..."
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Pro plan required |
| 400 | `VALIDATION_ERROR` | User already has Connect account |

---

### Get Connect Account Status

Retrieves the current status of the user's Stripe Connect account.

```http
GET /api/stripe/connect/status
```

**Authentication:** Required (Pro plan)

**Response (Connected):**

```json
{
  "connected": true,
  "accountId": "acct_1234567890",
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "detailsSubmitted": true,
  "currentlyDue": [],
  "eventuallyDue": [],
  "pastDue": [],
  "disabledReason": null,
  "onboardingCompleted": true
}
```

**Response (Not Connected):**

```json
{
  "connected": false,
  "status": "not_connected",
  "message": "No Stripe Connect account found"
}
```

---

### Refresh Onboarding Link

Generates a new onboarding link for an existing Connect account.

```http
POST /api/stripe/connect/refresh-link
```

**Authentication:** Required (Pro plan)

**Response:**

```json
{
  "onboardingUrl": "https://connect.stripe.com/setup/..."
}
```

---

### Get Dashboard Link

Creates a login link to the Stripe Express Dashboard.

```http
POST /api/stripe/connect/dashboard-link
```

**Authentication:** Required (Pro plan)

**Response:**

```json
{
  "dashboardUrl": "https://connect.stripe.com/express/..."
}
```

---

### Disconnect Account

Disconnects and deletes the user's Stripe Connect account.

```http
POST /api/stripe/connect/disconnect
```

**Authentication:** Required

**Response:**

```json
{
  "success": true,
  "message": "Account disconnected successfully"
}
```

---

## Gallery Monetization Endpoints

### Enable Gallery Paywall

Creates a monetization configuration for a gallery.

```http
POST /api/galleries/{galleryId}/monetization
```

**Authentication:** Required (Pro plan, gallery owner)

**Request Body:**

```json
{
  "priceCents": 2999,
  "currency": "usd",
  "previewMode": "full_paywall",
  "watermarkEnabled": true,
  "accessDurationDays": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `priceCents` | integer | Yes | Price in cents (500-50000, i.e., $5-$500) |
| `currency` | string | No | Currency code: `usd`, `eur`, `cad` (default: `usd`) |
| `previewMode` | string | No | `full_paywall` or `freemium` (default: `full_paywall`) |
| `watermarkEnabled` | boolean | No | Enable watermark in freemium mode (default: `true`) |
| `accessDurationDays` | integer\|null | No | Days until access expires (null = unlimited) |

**Response (201 Created):**

```json
{
  "galleryId": "uuid",
  "isEnabled": true,
  "priceCents": 2999,
  "currency": "usd",
  "previewMode": "full_paywall",
  "watermarkEnabled": true,
  "accessDurationDays": null,
  "stripePriceId": "price_xxx",
  "platformFeePercent": 10.0
}
```

---

### Get Monetization Config

Retrieves the monetization configuration for a gallery.

```http
GET /api/galleries/{galleryId}/monetization
```

**Authentication:** Required (gallery owner or public for enabled paywalls)

**Response:**

```json
{
  "galleryId": "uuid",
  "isEnabled": true,
  "priceCents": 2999,
  "currency": "usd",
  "previewMode": "full_paywall",
  "watermarkEnabled": true,
  "accessDurationDays": null,
  "stripePriceId": "price_xxx",
  "platformFeePercent": 10.0
}
```

---

### Update Monetization Config

Updates the monetization configuration for a gallery.

```http
PUT /api/galleries/{galleryId}/monetization
```

**Authentication:** Required (Pro plan, gallery owner)

**Request Body:**

```json
{
  "isEnabled": true,
  "priceCents": 3999,
  "previewMode": "freemium"
}
```

All fields are optional. At least one field must be provided.

**Response:**

```json
{
  "galleryId": "uuid",
  "isEnabled": true,
  "priceCents": 3999,
  "currency": "usd",
  "previewMode": "freemium",
  "watermarkEnabled": true,
  "accessDurationDays": null,
  "stripePriceId": "price_xxx",
  "platformFeePercent": 10.0
}
```

---

### Disable Paywall

Disables the paywall for a gallery (keeps configuration for re-enabling).

```http
DELETE /api/galleries/{galleryId}/monetization
```

**Authentication:** Required (gallery owner)

**Response:** `204 No Content`

---

## Checkout Endpoints

### Create Gallery Purchase Checkout

Creates a Stripe Checkout session for purchasing gallery access.

```http
POST /api/stripe/checkout/gallery-purchase
```

**Authentication:** Not required (public endpoint for buyers)

**Request Body:**

```json
{
  "galleryId": "uuid",
  "buyerEmail": "buyer@example.com",
  "buyerSessionId": "optional-session-id"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `galleryId` | string (UUID) | Yes | Gallery to purchase |
| `buyerEmail` | string (email) | Yes | Buyer's email address |
| `buyerSessionId` | string | No | Session ID for guest tracking |

**Response (201 Created):**

```json
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid email or gallery ID |
| 400 | `ALREADY_PURCHASED` | Buyer already has access |
| 404 | `NOT_FOUND` | Gallery or monetization not found |

---

### Verify Purchase Access

Checks if a buyer has access to a gallery.

```http
GET /api/galleries/{galleryId}/verify-access?identifier={email_or_session}
```

**Authentication:** Not required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `identifier` | string | Yes | Buyer email or session ID |

**Response:**

```json
{
  "hasAccess": true,
  "purchase": {
    "id": "uuid",
    "purchasedAt": "2024-01-15T10:30:00Z",
    "expiresAt": null
  }
}
```

---

## Revenue Endpoints

### Get Revenue Overview

Returns revenue metrics for the authenticated photographer.

```http
GET /api/photographer/revenue/overview?period={period}
```

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `month` | `today`, `week`, `month`, `quarter`, `year`, `all` |

**Response:**

```json
{
  "totalRevenue": 150000,
  "totalSales": 50,
  "averageOrderValue": 3000,
  "platformFees": 15000,
  "netRevenue": 135000,
  "periodComparison": {
    "revenueChange": 15.5,
    "salesChange": 10.2
  }
}
```

*Note: All amounts are in cents.*

---

### Get Revenue Chart Data

Returns time-series data for revenue visualization.

```http
GET /api/photographer/revenue/chart?range={range}
```

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `range` | string | `month` | `today`, `week`, `month`, `quarter`, `year`, `all` |

**Response:**

```json
[
  {
    "date": "2024-01-01",
    "revenue": 5000,
    "sales": 2
  },
  {
    "date": "2024-01-02",
    "revenue": 7500,
    "sales": 3
  }
]
```

---

### Get Sales List

Returns paginated list of sales.

```http
GET /api/photographer/sales
```

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `galleryId` | string | - | Filter by gallery |
| `status` | string | - | `succeeded`, `refunded`, `disputed` |
| `startDate` | string | - | ISO date string |
| `endDate` | string | - | ISO date string |
| `search` | string | - | Search by buyer email |
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max: 100) |

**Response:**

```json
{
  "sales": [
    {
      "id": "uuid",
      "galleryId": "uuid",
      "galleryTitle": "Wedding Photos",
      "buyerEmail": "buyer@example.com",
      "amount": 2999,
      "currency": "usd",
      "platformFee": 300,
      "netAmount": 2699,
      "status": "succeeded",
      "purchasedAt": "2024-01-15T10:30:00Z",
      "refundedAt": null
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

---

### Get Sale Details

Returns details for a specific sale.

```http
GET /api/photographer/sales/{saleId}
```

**Authentication:** Required

**Response:**

```json
{
  "id": "uuid",
  "galleryId": "uuid",
  "galleryTitle": "Wedding Photos",
  "buyerEmail": "buyer@example.com",
  "amount": 2999,
  "currency": "usd",
  "platformFee": 300,
  "netAmount": 2699,
  "status": "succeeded",
  "purchasedAt": "2024-01-15T10:30:00Z",
  "refundedAt": null
}
```

---

### Export Sales

Exports sales data in various formats.

```http
GET /api/photographer/sales/export?format={format}
```

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | `csv` | `csv`, `xlsx`, `pdf` |
| `startDate` | string | - | ISO date string |
| `endDate` | string | - | ISO date string |

**Response:** File download with appropriate content type.

---

### Get Top Galleries

Returns top performing galleries by revenue.

```http
GET /api/photographer/top-galleries?limit={limit}
```

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 5 | Number of galleries (max: 20) |

**Response:**

```json
[
  {
    "galleryId": "uuid",
    "title": "Wedding Photos",
    "totalRevenue": 50000,
    "totalSales": 20,
    "conversionRate": 5.5
  }
]
```

---

## Payout Endpoints

### Get Balance

Returns the current balance for the photographer's Stripe Connect account.

```http
GET /api/photographer/balance
```

**Authentication:** Required (Connect account required)

**Response:**

```json
{
  "available": [
    {
      "amount": 50000,
      "currency": "usd"
    }
  ],
  "pending": [
    {
      "amount": 10000,
      "currency": "usd"
    }
  ],
  "totalAvailable": 50000,
  "totalPending": 10000,
  "currency": "usd",
  "nextPayoutDate": "2024-01-20T00:00:00Z"
}
```

---

### Get Payouts List

Returns paginated list of payouts.

```http
GET /api/photographer/payouts
```

**Authentication:** Required (Connect account required)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | `pending`, `in_transit`, `paid`, `failed`, `canceled` (comma-separated) |
| `startDate` | string | - | ISO date string |
| `endDate` | string | - | ISO date string |
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max: 100) |

**Response:**

```json
{
  "payouts": [
    {
      "id": "uuid",
      "photographerId": "uuid",
      "stripeAccountId": "acct_xxx",
      "stripePayoutId": "po_xxx",
      "amountCents": 50000,
      "currency": "usd",
      "status": "paid",
      "failureCode": null,
      "failureMessage": null,
      "arrivalDate": "2024-01-15",
      "createdAt": "2024-01-13T10:00:00Z",
      "paidAt": "2024-01-15T08:00:00Z",
      "failedAt": null,
      "destinationBankAccountLast4": "4242"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20,
  "totalPages": 2
}
```

---

### Get Payout Details

Returns details for a specific payout including related sales.

```http
GET /api/photographer/payouts/{payoutId}
```

**Authentication:** Required

**Response:**

```json
{
  "id": "uuid",
  "photographerId": "uuid",
  "stripeAccountId": "acct_xxx",
  "stripePayoutId": "po_xxx",
  "amountCents": 50000,
  "currency": "usd",
  "status": "paid",
  "arrivalDate": "2024-01-15",
  "createdAt": "2024-01-13T10:00:00Z",
  "paidAt": "2024-01-15T08:00:00Z",
  "relatedSales": [
    {
      "id": "uuid",
      "galleryId": "uuid",
      "galleryTitle": "Wedding Photos",
      "buyerEmail": "buyer@example.com",
      "amountCents": 2999,
      "platformFeeCents": 300,
      "netAmountCents": 2699,
      "purchasedAt": "2024-01-10T14:30:00Z"
    }
  ]
}
```

---

## Refund & Dispute Endpoints

### Process Refund

Processes a full refund for a purchase.

```http
POST /api/photographer/sales/{saleId}/refund
```

**Authentication:** Required (sale owner)

**Request Body:**

```json
{
  "reason": "Customer requested refund"
}
```

**Response:**

```json
{
  "id": "uuid",
  "status": "refunded",
  "refundedAt": "2024-01-15T10:30:00Z",
  "refundReason": "Customer requested refund"
}
```

---

### Get Refundable Amount

Returns the refundable amount for a purchase.

```http
GET /api/photographer/sales/{saleId}/refund
```

**Authentication:** Required

**Response:**

```json
{
  "purchaseId": "uuid",
  "originalAmountCents": 2999,
  "refundedAmountCents": 0,
  "refundableAmountCents": 2999,
  "currency": "usd",
  "isFullyRefunded": false,
  "canRefund": true
}
```

---

### Process Partial Refund

Processes a partial refund for a purchase.

```http
POST /api/photographer/sales/{saleId}/refund/partial
```

**Authentication:** Required (sale owner)

**Request Body:**

```json
{
  "amountCents": 1500,
  "reason": "Partial refund for missing photos"
}
```

**Response:**

```json
{
  "purchase": {
    "id": "uuid",
    "status": "succeeded"
  },
  "refundId": "re_xxx",
  "refundedAmountCents": 1500,
  "remainingAmountCents": 1499,
  "isFullyRefunded": false
}
```

---

### Get Disputes List

Returns list of disputes for the photographer.

```http
GET /api/photographer/disputes
```

**Authentication:** Required (Connect account required)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | `needs_response`, `under_review`, `won`, `lost` |
| `limit` | integer | 20 | Items per page (max: 100) |
| `startingAfter` | string | - | Dispute ID for pagination |

**Response:**

```json
{
  "disputes": [
    {
      "id": "dp_xxx",
      "chargeId": "ch_xxx",
      "purchaseId": "uuid",
      "galleryId": "uuid",
      "galleryTitle": "Wedding Photos",
      "amount": 2999,
      "currency": "usd",
      "reason": "fraudulent",
      "status": "needs_response",
      "evidenceDueBy": "2024-01-25T00:00:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "buyerEmail": "buyer@example.com"
    }
  ],
  "hasMore": false,
  "totalCount": 1
}
```

---

### Get Dispute Details

Returns details for a specific dispute.

```http
GET /api/photographer/disputes/{disputeId}
```

**Authentication:** Required

**Response:**

```json
{
  "id": "dp_xxx",
  "chargeId": "ch_xxx",
  "purchaseId": "uuid",
  "galleryId": "uuid",
  "galleryTitle": "Wedding Photos",
  "amount": 2999,
  "currency": "usd",
  "reason": "fraudulent",
  "status": "needs_response",
  "evidenceDueBy": "2024-01-25T00:00:00Z",
  "createdAt": "2024-01-15T10:30:00Z",
  "buyerEmail": "buyer@example.com",
  "stripeDashboardUrl": "https://dashboard.stripe.com/disputes/dp_xxx"
}
```

---

## Rate Limiting

API endpoints are rate limited to prevent abuse:

| Endpoint Type | Limit |
|---------------|-------|
| Standard endpoints | 100 requests/minute |
| Webhook endpoints | 1000 requests/minute |
| Checkout endpoints | 50 requests/minute |

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312800
```

---

## Webhooks

For webhook documentation, see [Webhook Documentation](./webhooks.md).
