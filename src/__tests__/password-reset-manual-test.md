# Password Reset Flow - Manual Test Guide

This document provides step-by-step instructions for manually testing the password reset flow end-to-end.

## Prerequisites

- Application running locally or in a test environment
- Access to email inbox (or email logs if using a test email service)
- Test user account

## Test Scenarios

### Scenario 1: Complete Password Reset Flow

**Objective**: Verify the complete password reset flow from request to completion

**Steps**:
1. Navigate to `/forgot-password`
2. Enter a valid email address for an existing user
3. Click "Send Reset Link"
4. Verify success message is displayed
5. Check email inbox for password reset email
6. Verify email contains:
   - Reset link with token
   - Expiration notice (1 hour)
   - Clear instructions
7. Click the reset link in the email
8. Verify you're redirected to `/reset-password?token=...`
9. Enter a new password (minimum 6 characters)
10. Confirm the new password
11. Click "Reset Password"
12. Verify success message is displayed
13. Verify automatic redirect to sign-in page (or manual button)
14. Sign in with the new password
15. Verify sign-in is successful
16. Check email inbox for password changed notification
17. Verify notification email contains:
    - Confirmation that password was changed
    - Timestamp of change
    - IP address or location (if available)
    - Instructions if change was unauthorized

**Expected Results**:
- ✅ Password reset email sent within 30 seconds
- ✅ Reset link works and loads reset form
- ✅ Password successfully updated
- ✅ Can sign in with new password
- ✅ Password changed notification email sent
- ✅ Old password no longer works

---

### Scenario 2: Expired Token Handling

**Objective**: Verify expired tokens are properly rejected

**Steps**:
1. Request a password reset email
2. Wait for the token to expire (1 hour) OR manually expire it in the database:
   ```sql
   UPDATE email_verification_tokens 
   SET expires_at = NOW() - INTERVAL '1 hour'
   WHERE token = 'your-token-here';
   ```
3. Click the reset link
4. Try to reset the password

**Expected Results**:
- ✅ Error message displayed: "This reset link has expired"
- ✅ Option to request a new reset link provided
- ✅ Password is NOT changed

---

### Scenario 3: Invalid Token Handling

**Objective**: Verify invalid tokens are properly rejected

**Steps**:
1. Navigate to `/reset-password?token=invalid-token-12345`
2. Try to reset the password

**Expected Results**:
- ✅ Error message displayed: "Invalid or expired reset link"
- ✅ Option to request a new reset link provided
- ✅ Password is NOT changed

---

### Scenario 4: Token Reuse Prevention

**Objective**: Verify tokens can only be used once

**Steps**:
1. Request a password reset email
2. Use the token to successfully reset password
3. Try to use the same token again

**Expected Results**:
- ✅ Error message displayed: "This reset link has already been used"
- ✅ Option to request a new reset link provided
- ✅ Password is NOT changed again

---

### Scenario 5: Multiple Token Invalidation

**Objective**: Verify all reset tokens are invalidated after password change

**Steps**:
1. Request a password reset email (Token A)
2. Request another password reset email (Token B)
3. Use Token A to reset the password
4. Try to use Token B

**Expected Results**:
- ✅ Token B is rejected as already used
- ✅ Error message displayed
- ✅ Only one password change occurred

---

### Scenario 6: Rate Limiting

**Objective**: Verify rate limiting prevents abuse

**Steps**:
1. Request a password reset email
2. Immediately request another password reset email
3. Repeat 2 more times (total of 4 requests)

**Expected Results**:
- ✅ First 3 requests succeed
- ✅ 4th request is rate limited
- ✅ Error message displayed with retry time
- ✅ After waiting (1 hour), requests work again

---

### Scenario 7: Non-Existent Email (Security)

**Objective**: Verify system doesn't reveal if email exists

**Steps**:
1. Navigate to `/forgot-password`
2. Enter an email that doesn't exist in the system
3. Click "Send Reset Link"

**Expected Results**:
- ✅ Success message displayed (same as for existing email)
- ✅ No email is actually sent
- ✅ System doesn't reveal whether email exists or not

---

### Scenario 8: Password Validation

**Objective**: Verify password requirements are enforced

**Steps**:
1. Request a password reset and get to the reset form
2. Try to set a password that's too short (< 6 characters)
3. Try to set passwords that don't match in confirmation field

**Expected Results**:
- ✅ Error message for password too short
- ✅ Error message for password mismatch
- ✅ Password is NOT changed until valid

---

### Scenario 9: Email Delivery Timing

**Objective**: Verify emails are sent within 30 seconds

**Steps**:
1. Note the current time
2. Request a password reset
3. Check when the email arrives

**Expected Results**:
- ✅ Email received within 30 seconds of request
- ✅ Email contains correct information

---

### Scenario 10: UI/UX Verification

**Objective**: Verify user interface is clear and accessible

**Steps**:
1. Navigate through the entire password reset flow
2. Check for:
   - Clear instructions at each step
   - Appropriate loading states
   - Error messages are helpful
   - Success messages are clear
   - Buttons are properly labeled
   - Forms are accessible (keyboard navigation, screen readers)

**Expected Results**:
- ✅ All UI elements are clear and intuitive
- ✅ Loading states prevent double-submission
- ✅ Error messages are actionable
- ✅ Keyboard navigation works throughout
- ✅ Screen reader announces all important information

---

## Database Verification Queries

### Check Token Creation
```sql
SELECT * FROM email_verification_tokens 
WHERE user_id = 'your-user-id' 
AND token_type = 'password_reset'
ORDER BY created_at DESC;
```

### Check Token Usage
```sql
SELECT token, expires_at, used_at, created_at 
FROM email_verification_tokens 
WHERE user_id = 'your-user-id' 
AND token_type = 'password_reset'
ORDER BY created_at DESC;
```

### Verify All Tokens Invalidated
```sql
SELECT COUNT(*) as active_tokens
FROM email_verification_tokens 
WHERE user_id = 'your-user-id' 
AND token_type = 'password_reset'
AND used_at IS NULL
AND expires_at > NOW();
```

## Checklist

Use this checklist to track testing progress:

- [ ] Scenario 1: Complete Password Reset Flow
- [ ] Scenario 2: Expired Token Handling
- [ ] Scenario 3: Invalid Token Handling
- [ ] Scenario 4: Token Reuse Prevention
- [ ] Scenario 5: Multiple Token Invalidation
- [ ] Scenario 6: Rate Limiting
- [ ] Scenario 7: Non-Existent Email (Security)
- [ ] Scenario 8: Password Validation
- [ ] Scenario 9: Email Delivery Timing
- [ ] Scenario 10: UI/UX Verification

## Notes

- All tests should be performed in a test environment, not production
- Keep track of any issues or unexpected behavior
- Verify email templates render correctly in different email clients
- Test on different browsers and devices
- Verify accessibility with screen readers

## Requirements Validated

This manual test validates the following requirements:
- **9.1**: Password reset email sent within 30 seconds
- **9.2**: Unique reset token generated
- **9.3**: Reset token expires after 1 hour
- **9.6**: Token validation works correctly
- **9.7**: Reset link displays password reset form
- **9.8**: All reset tokens invalidated after password change
- **9.9**: Password changed notification email sent
