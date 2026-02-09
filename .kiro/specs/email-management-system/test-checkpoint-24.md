# Checkpoint 24 Testing Guide

## Quick Start Testing

### Prerequisites
1. Ensure the development server is running: `npm run dev`
2. Ensure Supabase is running: `npx supabase start`
3. Have test credentials ready (or use mock values)

### Test URLs
- Provider Configuration: http://localhost:3000/admin/emails/providers
- Sender Management: http://localhost:3000/admin/emails/senders

## Manual Testing Steps

### Part 1: Provider Configuration (15 minutes)

#### Test 1.1: Access Provider Page
1. Open browser to http://localhost:3000/admin/emails/providers
2. **Verify**: Page loads without errors
3. **Verify**: Two provider cards are visible (Resend and AWS SES)
4. **Verify**: No provider is marked as "Active" initially

#### Test 1.2: Configure Resend Provider
1. Click on the "Resend" card
2. **Verify**: Resend configuration form appears
3. Enter API Key: `re_test_123` (test value)
4. Click "Save Configuration"
5. **Verify**: Success message appears
6. **Verify**: "Test Connection" button becomes enabled

#### Test 1.3: Test Resend Connection
1. Click "Test Connection" button
2. **Verify**: Button shows loading state
3. **Verify**: Result message appears (may fail with test key - that's expected)
4. **Note**: With a real Resend API key, this should succeed

#### Test 1.4: Configure AWS SES Provider
1. Click on the "AWS SES" card
2. **Verify**: AWS SES configuration form appears with 3 fields
3. Enter Access Key ID: `AKIATEST123`
4. Enter Secret Access Key: `test_secret_key`
5. Select Region: `us-east-1`
6. Click "Save Configuration"
7. **Verify**: Success message appears

#### Test 1.5: Switch Active Provider
1. Ensure Resend is configured
2. Click "Set as Active Provider" button
3. **Verify**: Success message appears
4. **Verify**: Page reloads
5. **Verify**: "Active" badge appears on Resend card
6. Switch to AWS SES and click "Set as Active Provider"
7. **Verify**: "Active" badge moves to AWS SES card

#### Test 1.6: Error Handling
1. Select Resend provider
2. Clear the API key field
3. Click "Save Configuration"
4. **Verify**: Error message appears: "Resend API key is required"

### Part 2: Sender Address Management (15 minutes)

#### Test 2.1: Access Sender Page
1. Open browser to http://localhost:3000/admin/emails/senders
2. **Verify**: Page loads without errors
3. **Verify**: "Add Sender Address" form is visible
4. **Verify**: Sender list is visible (may be empty initially)

#### Test 2.2: Add New Sender Address
1. Enter Email: `noreply@piksend.com`
2. Enter Name: `PikSend`
3. Click "Add Sender Address"
4. **Verify**: Success message appears
5. **Verify**: New sender appears in the list
6. **Verify**: Status badge shows "Pending Verification"

#### Test 2.3: View Verification Instructions
1. Find the newly added sender in the list
2. Click "View Verification" or similar button
3. **Verify**: Verification instructions appear
4. **Verify**: DNS records are displayed (DKIM, SPF)
5. **Verify**: Instructions are clear and actionable

#### Test 2.4: Add Multiple Senders
1. Add another sender: `support@piksend.com` with name `PikSend Support`
2. **Verify**: Both senders appear in the list
3. **Verify**: Each has its own status badge

#### Test 2.5: Duplicate Prevention
1. Try to add `noreply@piksend.com` again
2. **Verify**: Error message appears: "Sender address already exists"
3. **Verify**: Duplicate is not added to the list

#### Test 2.6: Set Default Sender
1. Click "Set as Default" on one of the senders
2. **Verify**: "Default" badge appears on that sender
3. Click "Set as Default" on a different sender
4. **Verify**: "Default" badge moves to the new sender
5. **Verify**: Only one sender has "Default" badge at a time

#### Test 2.7: Delete Sender
1. Click "Delete" button on a non-default sender
2. **Verify**: Confirmation dialog appears
3. Confirm deletion
4. **Verify**: Sender is removed from the list
5. Try to delete the default sender
6. **Verify**: Error message or disabled button prevents deletion

### Part 3: Responsive Design (10 minutes)

#### Test 3.1: Desktop View (1920x1080)
1. Set browser to full screen
2. Navigate to provider page
3. **Verify**: Provider cards are side-by-side
4. **Verify**: Forms are properly aligned
5. Navigate to sender page
6. **Verify**: Table displays all columns
7. **Verify**: Buttons are appropriately sized

#### Test 3.2: Tablet View (768x1024)
1. Resize browser to 768px width
2. Navigate to provider page
3. **Verify**: Provider cards stack vertically or remain side-by-side
4. **Verify**: Forms remain usable
5. Navigate to sender page
6. **Verify**: Table is scrollable or responsive
7. **Verify**: Touch targets are adequate (44x44px minimum)

#### Test 3.3: Mobile View (375x667)
1. Resize browser to 375px width (or use mobile device)
2. Navigate to provider page
3. **Verify**: All content is accessible
4. **Verify**: Forms are mobile-friendly
5. **Verify**: Buttons are touch-friendly
6. Navigate to sender page
7. **Verify**: List is scrollable
8. **Verify**: Actions are accessible

### Part 4: Accessibility (10 minutes)

#### Test 4.1: Keyboard Navigation
1. Navigate to provider page
2. Press Tab repeatedly
3. **Verify**: Focus moves through all interactive elements
4. **Verify**: Focus indicators are visible
5. Press Enter on a provider card
6. **Verify**: Provider is selected
7. Tab to "Save Configuration" button
8. Press Enter
9. **Verify**: Configuration is saved

#### Test 4.2: Screen Reader (Optional)
1. Enable screen reader (NVDA on Windows, VoiceOver on Mac)
2. Navigate to provider page
3. **Verify**: Form labels are announced
4. **Verify**: Status messages are announced
5. Navigate to sender page
6. **Verify**: Table structure is announced
7. **Verify**: Button purposes are clear

#### Test 4.3: Color Contrast
1. Use browser DevTools or contrast checker
2. Check text against backgrounds
3. **Verify**: All text meets WCAG AA (4.5:1 for normal text)
4. **Verify**: Status badges are distinguishable
5. **Verify**: Error messages are clearly visible

## Test Results Template

### Provider Configuration
- [ ] Page loads correctly
- [ ] Resend configuration works
- [ ] AWS SES configuration works
- [ ] Provider switching works
- [ ] Connection testing works
- [ ] Error handling works

### Sender Management
- [ ] Page loads correctly
- [ ] Add sender works
- [ ] Verification instructions display
- [ ] Duplicate prevention works
- [ ] Set default works
- [ ] Delete sender works

### Responsive Design
- [ ] Desktop view is correct
- [ ] Tablet view is correct
- [ ] Mobile view is correct

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader support is adequate
- [ ] Color contrast is sufficient

## Common Issues and Solutions

### Issue: Page doesn't load
**Solution**: Check that the development server is running and Supabase is started

### Issue: API errors
**Solution**: Check browser console for detailed error messages. Verify database migrations are applied.

### Issue: Provider test fails
**Solution**: This is expected with test credentials. Use real API keys to test actual connections.

### Issue: Sender verification doesn't work
**Solution**: Verification requires a real email provider to be configured and active.

## Next Steps After Testing

1. Document any issues found in CHECKPOINT-24-VERIFICATION.md
2. Fix critical issues before proceeding
3. Mark task 24 as complete
4. Proceed to Phase 7: Template Management (Task 25)

## Notes

- Some functionality requires real API credentials to fully test
- Mock/test credentials will save but may fail connection tests
- This is expected behavior and doesn't indicate a bug
- Focus on UI/UX functionality and error handling
