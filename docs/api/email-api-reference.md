# Email API Reference

## Overview

Complete API reference for the PikSend Email Management System. This document covers all REST API endpoints, request/response formats, authentication, and error handling.

## Base URL

```
Production: https://piksend.com/api
Development: http://localhost:3000/api
```

## Authentication

All email API endpoints require authentication using a session token or API key.

### Session Authentication

```typescript
// Include session cookie in request
fetch('/api/emails/send', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...})
});
```

### API Key Authentication

```typescript
// Include API key in header
fetch('/api/emails/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...})
});
```

## Rate Limiting

- **Default**: 100 requests per minute per user
- **Burst**: 10 requests per second
- **Headers**: Rate limit info included in response

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: templateId",
    "details": {
      "field": "templateId",
      "expected": "string"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `PROVIDER_ERROR` | 502 | Email provider error |

## Endpoints

### Send Email

Send a transactional email immediately.

**Endpoint:** `POST /api/emails/send`

**Request Body:**
```json
{
  "templateId": "purchase-confirmation",
  "to": "customer@example.com",
  "variables": {
    "buyerName": "John Doe",
    "galleryName": "Summer Wedding 2024",
    "photoCount": 25,
    "amountPaid": "$99.99",
    "accessLink": "https://piksend.com/gallery/abc123"
  },
  "from": "noreply@piksend.com",
  "replyTo": "support@piksend.com",
  "cc": ["manager@piksend.com"],
  "bcc": ["archive@piksend.com"]
}
```

**Response:** `200 OK`
```json
{
  "id": "email-queue-123",
  "status": "queued",
  "message": "Email queued successfully"
}
```

**Example:**
```typescript
const response = await fetch('/api/emails/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    templateId: 'purchase-confirmation',
    to: 'customer@example.com',
    variables: {
      buyerName: 'John Doe',
      galleryName: 'Summer Wedding 2024',
      photoCount: 25,
      amountPaid: '$99.99',
      accessLink: 'https://piksend.com/gallery/abc123'
    }
  })
});

const data = await response.json();
console.log('Email ID:', data.id);
```

---

### Schedule Email

Schedule an email for future delivery.

**Endpoint:** `POST /api/emails/schedule`

**Request Body:**
```json
{
  "templateId": "reminder",
  "to": "user@example.com",
  "scheduledAt": "2024-03-15T09:00:00Z",
  "variables": {
    "eventName": "Gallery Expiration",
    "expirationDate": "2024-03-20"
  }
}
```

**Response:** `200 OK`
```json
{
  "id": "email-queue-456",
  "status": "scheduled",
  "scheduledAt": "2024-03-15T09:00:00Z",
  "message": "Email scheduled successfully"
}
```

---

### Cancel Scheduled Email

Cancel a scheduled email before it's sent.

**Endpoint:** `DELETE /api/emails/{id}/cancel`

**Response:** `200 OK`
```json
{
  "message": "Email cancelled successfully"
}
```

**Example:**
```typescript
await fetch('/api/emails/email-queue-456/cancel', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});
```

---

### Get Email Logs

Retrieve email logs with filtering and pagination.

**Endpoint:** `GET /api/emails/logs`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (string): Filter by status (sent, delivered, opened, clicked, bounced, failed)
- `from` (string): Start date (ISO 8601)
- `to` (string): End date (ISO 8601)
- `recipient` (string): Filter by recipient email
- `templateId` (string): Filter by template

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "log-123",
      "queueId": "email-queue-123",
      "provider": "resend",
      "providerMessageId": "re_abc123",
      "fromAddress": "noreply@piksend.com",
      "toAddress": "customer@example.com",
      "subject": "Your Purchase Confirmation",
      "templateId": "purchase-confirmation",
      "status": "delivered",
      "sentAt": "2024-01-15T10:00:00Z",
      "deliveredAt": "2024-01-15T10:00:05Z",
      "openedAt": "2024-01-15T10:15:00Z",
      "clickedAt": "2024-01-15T10:16:00Z",
      "createdAt": "2024-01-15T09:59:55Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Example:**
```typescript
const response = await fetch(
  '/api/emails/logs?status=delivered&from=2024-01-01&limit=50',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);

const { data, pagination } = await response.json();
console.log(`Showing ${data.length} of ${pagination.total} emails`);
```

---

### Get Email Details

Get detailed information about a specific email.

**Endpoint:** `GET /api/emails/logs/{id}`

**Response:** `200 OK`
```json
{
  "id": "log-123",
  "queueId": "email-queue-123",
  "provider": "resend",
  "providerMessageId": "re_abc123",
  "fromAddress": "noreply@piksend.com",
  "toAddress": "customer@example.com",
  "subject": "Your Purchase Confirmation",
  "templateId": "purchase-confirmation",
  "status": "delivered",
  "sentAt": "2024-01-15T10:00:00Z",
  "deliveredAt": "2024-01-15T10:00:05Z",
  "openedAt": "2024-01-15T10:15:00Z",
  "clickedAt": "2024-01-15T10:16:00Z",
  "events": [
    {
      "type": "sent",
      "timestamp": "2024-01-15T10:00:00Z"
    },
    {
      "type": "delivered",
      "timestamp": "2024-01-15T10:00:05Z"
    },
    {
      "type": "opened",
      "timestamp": "2024-01-15T10:15:00Z",
      "metadata": {
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      }
    },
    {
      "type": "clicked",
      "timestamp": "2024-01-15T10:16:00Z",
      "metadata": {
        "url": "https://piksend.com/gallery/abc123"
      }
    }
  ],
  "metadata": {
    "variables": {
      "buyerName": "John Doe",
      "galleryName": "Summer Wedding 2024"
    }
  }
}
```

---

### Retry Failed Email

Retry sending a failed email.

**Endpoint:** `POST /api/emails/{id}/retry`

**Response:** `200 OK`
```json
{
  "message": "Email queued for retry",
  "retryCount": 2
}
```

---

### Get Analytics

Get email analytics with filtering.

**Endpoint:** `GET /api/emails/analytics`

**Query Parameters:**
- `templateId` (string): Filter by template
- `from` (string): Start date (ISO 8601)
- `to` (string): End date (ISO 8601)
- `groupBy` (string): Group by period (day, week, month)

**Response:** `200 OK`
```json
{
  "summary": {
    "sent": 1250,
    "delivered": 1200,
    "opened": 720,
    "clicked": 180,
    "bounced": 30,
    "complained": 2,
    "failed": 20,
    "openRate": 60.0,
    "clickRate": 15.0,
    "bounceRate": 2.4
  },
  "timeSeries": [
    {
      "date": "2024-01-15",
      "sent": 150,
      "delivered": 145,
      "opened": 87,
      "clicked": 22
    }
  ],
  "byTemplate": [
    {
      "templateId": "purchase-confirmation",
      "templateName": "Purchase Confirmation",
      "sent": 500,
      "delivered": 490,
      "opened": 350,
      "clicked": 100,
      "openRate": 71.4,
      "clickRate": 20.4
    }
  ]
}
```

**Example:**
```typescript
const response = await fetch(
  '/api/emails/analytics?from=2024-01-01&to=2024-01-31&groupBy=day',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);

const analytics = await response.json();
console.log('Open rate:', analytics.summary.openRate + '%');
```

---

### List Templates

Get all email templates.

**Endpoint:** `GET /api/emails/templates`

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `type` (string): Filter by type (transactional, marketing)
- `source` (string): Filter by source (react-email, custom)
- `search` (string): Search by name or subject

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "template-123",
      "name": "Purchase Confirmation",
      "slug": "purchase-confirmation",
      "type": "transactional",
      "source": "react-email",
      "subject": "Your Purchase from {photographerName}",
      "variables": [
        "buyerName",
        "galleryName",
        "photoCount",
        "amountPaid",
        "accessLink"
      ],
      "activeVersion": 3,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

### Get Template

Get a specific template.

**Endpoint:** `GET /api/emails/templates/{id}`

**Response:** `200 OK`
```json
{
  "id": "template-123",
  "name": "Purchase Confirmation",
  "slug": "purchase-confirmation",
  "type": "transactional",
  "source": "react-email",
  "subject": "Your Purchase from {photographerName}",
  "content": {
    "html": "<html>...</html>",
    "design": {...}
  },
  "variables": [
    "buyerName",
    "galleryName",
    "photoCount",
    "amountPaid",
    "accessLink"
  ],
  "activeVersion": 3,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

---

### Create Template

Create a new email template.

**Endpoint:** `POST /api/emails/templates`

**Request Body:**
```json
{
  "name": "Welcome Email",
  "slug": "welcome-email",
  "type": "marketing",
  "source": "custom",
  "subject": "Welcome to PikSend, {userName}!",
  "content": {
    "html": "<html>...</html>",
    "design": {...}
  },
  "variables": ["userName", "activationLink"]
}
```

**Response:** `201 Created`
```json
{
  "id": "template-456",
  "name": "Welcome Email",
  "slug": "welcome-email",
  "message": "Template created successfully"
}
```

---

### Update Template

Update an existing template (creates new version).

**Endpoint:** `PUT /api/emails/templates/{id}`

**Request Body:**
```json
{
  "name": "Welcome Email (Updated)",
  "subject": "Welcome to PikSend!",
  "content": {
    "html": "<html>...</html>"
  }
}
```

**Response:** `200 OK`
```json
{
  "id": "template-456",
  "version": 2,
  "message": "Template updated successfully"
}
```

---

### Delete Template

Soft delete a template.

**Endpoint:** `DELETE /api/emails/templates/{id}`

**Response:** `200 OK`
```json
{
  "message": "Template deleted successfully"
}
```

---

### Get Template Versions

Get all versions of a template.

**Endpoint:** `GET /api/emails/templates/{id}/versions`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "version-123",
      "templateId": "template-456",
      "version": 2,
      "subject": "Welcome to PikSend!",
      "content": {...},
      "createdBy": "user-789",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "version-122",
      "templateId": "template-456",
      "version": 1,
      "subject": "Welcome to PikSend, {userName}!",
      "content": {...},
      "createdBy": "user-789",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Publish Template Version

Set a specific version as active.

**Endpoint:** `POST /api/emails/templates/{id}/versions/{version}/publish`

**Response:** `200 OK`
```json
{
  "message": "Version published successfully",
  "activeVersion": 1
}
```

---

### Preview Template

Generate a preview of a template with sample data.

**Endpoint:** `POST /api/emails/templates/{id}/preview`

**Request Body:**
```json
{
  "variables": {
    "userName": "John Doe",
    "activationLink": "https://piksend.com/activate/abc123"
  }
}
```

**Response:** `200 OK`
```json
{
  "html": "<html>...</html>",
  "text": "Plain text version...",
  "subject": "Welcome to PikSend, John Doe!"
}
```

---

### Get Active Provider

Get the currently active email provider.

**Endpoint:** `GET /api/emails/providers/active`

**Response:** `200 OK`
```json
{
  "name": "resend",
  "isActive": true,
  "status": "connected",
  "lastTested": "2024-01-15T10:00:00Z"
}
```

---

### Set Active Provider

Switch to a different email provider.

**Endpoint:** `POST /api/emails/providers/active`

**Request Body:**
```json
{
  "provider": "aws-ses"
}
```

**Response:** `200 OK`
```json
{
  "message": "Provider switched successfully",
  "provider": "aws-ses"
}
```

---

### Update Provider Config

Update provider configuration.

**Endpoint:** `PUT /api/emails/providers/{provider}`

**Request Body (Resend):**
```json
{
  "config": {
    "apiKey": "re_xxxxxxxxxxxxx"
  }
}
```

**Request Body (AWS SES):**
```json
{
  "config": {
    "accessKeyId": "AKIAXXXXXXXXXXXXX",
    "secretAccessKey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "region": "us-east-1"
  }
}
```

**Response:** `200 OK`
```json
{
  "message": "Provider configuration updated successfully"
}
```

---

### Test Provider Connection

Test if provider credentials are valid.

**Endpoint:** `POST /api/emails/providers/{provider}/test`

**Response:** `200 OK`
```json
{
  "success": true,
  "latency": 245,
  "message": "Connection successful"
}
```

**Error Response:** `502 Bad Gateway`
```json
{
  "success": false,
  "error": "Invalid API key",
  "message": "Connection failed"
}
```

---

### List Sender Addresses

Get all sender addresses.

**Endpoint:** `GET /api/emails/senders`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "sender-123",
      "email": "noreply@piksend.com",
      "name": "PikSend",
      "isVerified": true,
      "isDefault": true,
      "verifiedAt": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Add Sender Address

Add a new sender address.

**Endpoint:** `POST /api/emails/senders`

**Request Body:**
```json
{
  "email": "support@piksend.com",
  "name": "PikSend Support"
}
```

**Response:** `201 Created`
```json
{
  "id": "sender-456",
  "email": "support@piksend.com",
  "isVerified": false,
  "message": "Sender address added. Verification required."
}
```

---

### Verify Sender Address

Initiate verification for a sender address.

**Endpoint:** `POST /api/emails/senders/{id}/verify`

**Response:** `200 OK`
```json
{
  "message": "Verification email sent"
}
```

---

### Get Verification Status

Check verification status of a sender address.

**Endpoint:** `GET /api/emails/senders/{id}/status`

**Response:** `200 OK`
```json
{
  "isVerified": true,
  "verifiedAt": "2024-01-15T10:00:00Z",
  "status": "verified"
}
```

---

### Set Default Sender

Set a sender address as default.

**Endpoint:** `POST /api/emails/senders/{id}/set-default`

**Response:** `200 OK`
```json
{
  "message": "Default sender updated successfully"
}
```

---

### Delete Sender Address

Delete a sender address.

**Endpoint:** `DELETE /api/emails/senders/{id}`

**Response:** `200 OK`
```json
{
  "message": "Sender address deleted successfully"
}
```

---

### Get Domain Records

Get DNS records for domain verification.

**Endpoint:** `GET /api/emails/senders/{id}/domain-records`

**Response:** `200 OK`
```json
{
  "domain": "piksend.com",
  "records": [
    {
      "type": "TXT",
      "name": "_amazonses.piksend.com",
      "value": "abc123def456..."
    },
    {
      "type": "CNAME",
      "name": "abc123._domainkey.piksend.com",
      "value": "abc123.dkim.amazonses.com"
    }
  ]
}
```

## Webhooks

### Resend Webhook

Receives events from Resend.

**Endpoint:** `POST /api/webhooks/email/resend`

**Headers:**
```
svix-id: msg_xxxxxxxxxxxxx
svix-timestamp: 1640000000
svix-signature: v1,xxxxxxxxxxxxx
```

**Payload:**
```json
{
  "type": "email.delivered",
  "created_at": "2024-01-15T10:00:00Z",
  "data": {
    "email_id": "re_abc123",
    "from": "noreply@piksend.com",
    "to": ["customer@example.com"],
    "subject": "Your Purchase Confirmation"
  }
}
```

---

### AWS SES Webhook

Receives events from AWS SES via SNS.

**Endpoint:** `POST /api/webhooks/email/ses`

**Headers:**
```
x-amz-sns-message-type: Notification
```

**Payload:**
```json
{
  "Type": "Notification",
  "MessageId": "xxxxxxxxxxxxx",
  "TopicArn": "arn:aws:sns:us-east-1:123456789012:piksend-ses-events",
  "Message": "{\"eventType\":\"Delivery\",\"mail\":{...}}"
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
class PikSendEmailClient {
  constructor(private apiKey: string, private baseUrl: string) {}
  
  async sendEmail(params: {
    templateId: string;
    to: string;
    variables: Record<string, any>;
  }) {
    const response = await fetch(`${this.baseUrl}/api/emails/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`Email send failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getAnalytics(from: Date, to: Date) {
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString()
    });
    
    const response = await fetch(
      `${this.baseUrl}/api/emails/analytics?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    );
    
    return response.json();
  }
}

// Usage
const client = new PikSendEmailClient(
  'YOUR_API_KEY',
  'https://piksend.com'
);

await client.sendEmail({
  templateId: 'purchase-confirmation',
  to: 'customer@example.com',
  variables: {
    buyerName: 'John Doe',
    galleryName: 'Summer Wedding 2024'
  }
});
```

### Python

```python
import requests
from datetime import datetime

class PikSendEmailClient:
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def send_email(self, template_id: str, to: str, variables: dict):
        response = requests.post(
            f'{self.base_url}/api/emails/send',
            headers=self.headers,
            json={
                'templateId': template_id,
                'to': to,
                'variables': variables
            }
        )
        response.raise_for_status()
        return response.json()
    
    def get_analytics(self, from_date: datetime, to_date: datetime):
        params = {
            'from': from_date.isoformat(),
            'to': to_date.isoformat()
        }
        response = requests.get(
            f'{self.base_url}/api/emails/analytics',
            headers=self.headers,
            params=params
        )
        return response.json()

# Usage
client = PikSendEmailClient('YOUR_API_KEY', 'https://piksend.com')

client.send_email(
    template_id='purchase-confirmation',
    to='customer@example.com',
    variables={
        'buyerName': 'John Doe',
        'galleryName': 'Summer Wedding 2024'
    }
)
```

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API release
- Email sending endpoints
- Template management endpoints
- Analytics endpoints
- Provider configuration endpoints
- Webhook endpoints
