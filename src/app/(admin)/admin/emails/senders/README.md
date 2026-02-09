# Sender Address Management

This directory contains the sender address management page and components for the email management system.

## Components

### Page Component (`page.tsx`)
- Server component that fetches sender addresses from the database
- Provides loading skeleton during data fetch
- Wraps the client-side content component

### Sender Management Content (`sender-management-content.tsx`)
- Client-side wrapper that manages state for sender addresses
- Coordinates between the list and form components
- Handles state updates when senders are added, deleted, or updated

### Add Sender Form (`add-sender-form.tsx`)
- Form for adding new sender email addresses
- Validates email format
- Initiates domain verification automatically
- Displays success/error feedback

### Sender List (`sender-list.tsx`)
- Displays all sender addresses with status badges
- Shows verification status (verified, pending)
- Indicates default sender
- Provides actions:
  - Check verification status
  - Set as default sender
  - Delete sender (with validation)
- Shows/hides verification instructions

### Verification Instructions (`verification-instructions.tsx`)
- Displays DNS records needed for domain verification
- Shows DKIM, SPF, and DMARC records
- Provides copy-to-clipboard functionality
- Includes step-by-step setup instructions

## API Routes

### `/api/admin/emails/senders`
- **GET**: List all sender addresses
- **POST**: Add new sender address and initiate verification

### `/api/admin/emails/senders/[id]`
- **DELETE**: Delete sender address (prevents deleting only verified sender)

### `/api/admin/emails/senders/[id]/set-default`
- **POST**: Set sender as default (only for verified senders)

### `/api/admin/emails/senders/[id]/verify`
- **POST**: Check verification status with email provider

## Features

1. **Add Sender Addresses**: Add email addresses with optional display names
2. **Domain Verification**: Automatic DNS record generation for DKIM, SPF, DMARC
3. **Verification Status**: Real-time checking of verification status
4. **Default Sender**: Set a verified sender as the default for all emails
5. **Delete Protection**: Prevents deletion of the only verified sender
6. **Copy DNS Records**: Easy copy-to-clipboard for DNS configuration

## Requirements Satisfied

- **6.4**: Sender address list with status badges
- **6.5**: Domain verification instructions and status display
- **6.6**: Sender deletion with validation

## Usage

Navigate to `/admin/emails/senders` to access the sender management page.

### Adding a Sender
1. Enter email address and optional display name
2. Click "Add Sender Address"
3. View DNS records in the verification instructions
4. Add DNS records to your domain
5. Click "Check Status" to verify

### Setting Default Sender
1. Ensure sender is verified
2. Click "Set Default" button
3. Sender will be used as default for all emails

### Deleting a Sender
1. Click trash icon next to sender
2. Confirm deletion
3. System prevents deleting the only verified sender
