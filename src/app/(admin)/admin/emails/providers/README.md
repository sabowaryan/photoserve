# Email Provider Configuration Page

## Overview

This page allows administrators to configure and manage email service providers (Resend or AWS SES) for the email management system.

## Features

- **Provider Selection**: Choose between Resend and AWS SES
- **Configuration Forms**: Provider-specific forms for entering credentials
- **Connection Testing**: Test provider connection before activating
- **Provider Switching**: Switch between configured providers
- **Visual Feedback**: Success/error notifications for all actions

## Requirements Implemented

- **6.1**: Multi-provider email delivery configuration
- **6.2**: Provider credential management with validation
- **6.3**: Connection testing with visual feedback

## Files Created

1. `page.tsx` - Main page component with server-side data fetching
2. `provider-config-form.tsx` - Client-side form component with provider selection and configuration
3. `../../../api/admin/emails/providers/route.ts` - API route for saving and listing providers
4. `../../../api/admin/emails/providers/[provider]/test/route.ts` - API route for testing provider connection
5. `../../../api/admin/emails/providers/active/route.ts` - API route for getting/setting active provider

## How to Test

### Prerequisites

1. Ensure the email management system database migrations have been run
2. Set the `EMAIL_PROVIDER_ENCRYPTION_KEY` environment variable:
   ```bash
   # Generate a secure key
   openssl rand -base64 32
   
   # Add to .env
   EMAIL_PROVIDER_ENCRYPTION_KEY=<generated-key>
   ```

### Testing Resend Configuration

1. Navigate to `/admin/emails/providers`
2. Select "Resend" provider
3. Enter your Resend API key (get from https://resend.com/api-keys)
4. Click "Save Configuration"
5. Click "Test Connection" to verify the API key works
6. Click "Set as Active Provider" to activate Resend

### Testing AWS SES Configuration

1. Navigate to `/admin/emails/providers`
2. Select "AWS SES" provider
3. Enter your AWS credentials:
   - Access Key ID
   - Secret Access Key
   - Region (e.g., us-east-1)
4. Click "Save Configuration"
5. Click "Test Connection" to verify the credentials work
6. Click "Set as Active Provider" to activate AWS SES

### Testing Provider Switching

1. Configure both Resend and AWS SES
2. Activate one provider
3. Switch to the other provider
4. Verify the active provider badge updates correctly

## API Endpoints

### POST /api/admin/emails/providers
Save provider configuration with encrypted credentials.

**Request Body:**
```json
{
  "provider": "resend" | "aws-ses",
  "config": {
    // Resend
    "apiKey": "re_..."
    
    // OR AWS SES
    "accessKeyId": "AKIA...",
    "secretAccessKey": "...",
    "region": "us-east-1"
  }
}
```

**Response:**
```json
{
  "success": true,
  "providerId": "uuid",
  "message": "Provider configuration saved successfully"
}
```

### GET /api/admin/emails/providers
List all configured providers.

**Response:**
```json
{
  "success": true,
  "providers": [
    {
      "id": "uuid",
      "name": "resend",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/admin/emails/providers/[provider]/test
Test provider connection.

**Response:**
```json
{
  "success": true,
  "message": "Successfully connected to resend"
}
```

### POST /api/admin/emails/providers/active
Set the active provider.

**Request Body:**
```json
{
  "provider": "resend" | "aws-ses"
}
```

**Response:**
```json
{
  "success": true,
  "message": "resend is now the active email provider"
}
```

### GET /api/admin/emails/providers/active
Get the currently active provider.

**Response:**
```json
{
  "success": true,
  "provider": "resend"
}
```

## Security Considerations

1. **Credential Encryption**: All provider credentials are encrypted using AES-256-GCM before storage
2. **Admin-Only Access**: Only users with `is_admin=true` can access this page
3. **Connection Testing**: Credentials are validated before saving
4. **Secure Storage**: Encrypted credentials are stored in the database

## Error Handling

The form handles various error scenarios:

- **Invalid Credentials**: Shows error message from provider
- **Connection Failure**: Shows connection test failure message
- **Missing Fields**: Validates required fields before submission
- **Network Errors**: Shows generic error message for network issues

## UI Components Used

- `LoadingButton` - Button with loading state
- `Input` - Text input for credentials
- `Label` - Form labels
- `Select` - Dropdown for AWS region selection
- `Skeleton` - Loading skeleton for server-side rendering

## Next Steps

After implementing this task, the following tasks should be completed:

- Task 23: Create sender address management page
- Task 24: Checkpoint - Verify provider and sender UI
- Task 36: Add email management to admin navigation (to make this page accessible from the menu)
