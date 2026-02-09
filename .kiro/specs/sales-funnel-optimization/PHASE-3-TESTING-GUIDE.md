# Phase 3 Manual Testing Guide

Quick reference guide for testing the complete Phase 3 conversion flow.

---

## 🎯 Test Flow Overview

```
Guest Upload → Soft Signup → Onboarding → First Gallery → Email Triggers
```

---

## 📋 Test Scenario 1: Complete Guest-to-User Journey

### Prerequisites
- Clear browser cookies
- Use incognito/private window
- Have 3-5 test images ready (JPEG/PNG, <50MB each)

### Steps

#### 1. Guest Upload (5 minutes)
1. Navigate to homepage
2. Click "Essayer gratuitement" or guest upload CTA
3. Upload 3-5 photos via drag-and-drop or file picker
4. Enter gallery title (optional)
5. Click "Créer ma galerie"

**Expected Results:**
- ✅ Gallery created in <30 seconds
- ✅ Unique URL generated
- ✅ "Créé avec PikSend" banner visible
- ✅ Locked features (ZIP, branding) show upgrade prompts
- ✅ After 2 minutes: Soft signup modal appears

#### 2. Progressive Signup (3 minutes)
1. Click "Créer mon compte" from modal or banner
2. **Step 1:** Enter email address
   - Try invalid email → should show error
   - Try existing email → should show error
   - Enter valid new email → proceed to step 2
3. **Step 2:** Enter password
   - Try weak password → should show strength indicator
   - Enter strong password (8+ chars, uppercase, number)
   - Confirm password → proceed to step 3
4. **Step 3:** Profile (optional)
   - Enter name and business name, OR
   - Click "Je ferai ça plus tard"

**Expected Results:**
- ✅ Account created and authenticated
- ✅ Redirected to dashboard
- ✅ Welcome email received within 5 minutes
- ✅ "Pas de CB requise" visible at each step
- ✅ Progress indicator shows 1/3, 2/3, 3/3

#### 3. Onboarding Guide (10 minutes)
1. View onboarding guide on dashboard
2. Verify 4 tasks displayed:
   - Create first gallery ⭐ (required)
   - Customize profile
   - Add logo
   - Invite test client
3. Click "Créer une galerie" from task 1
4. Upload photos and create gallery
5. Return to dashboard

**Expected Results:**
- ✅ Confetti animation on first gallery creation
- ✅ Progress bar updates (25% → 100% if all tasks done)
- ✅ Task marked as complete with checkmark
- ✅ Congratulations email received
- ✅ Can dismiss and re-show guide

#### 4. Email Verification (24-48 hours)
Check email inbox for scheduled emails:

**Immediate:**
- ✅ Welcome email (within 5 minutes of signup)
- ✅ First gallery congratulations (within 5 minutes of gallery creation)

**Scheduled:**
- ✅ D+1: First gallery reminder (if no gallery created)
- ✅ D+3: Help email (if no gallery created)
- ✅ D+7: Upgrade invitation
- ✅ D+14: Upgrade invitation

**Test Unsubscribe:**
- Click unsubscribe link in marketing email
- Verify unsubscribe confirmation
- Verify no more marketing emails received
- Verify transactional emails still received

---

## 📋 Test Scenario 2: Authenticated User (Skip Guest Upload)

### Steps
1. Navigate to signup page directly
2. Complete progressive signup (3 steps)
3. Verify onboarding guide appears
4. Complete onboarding tasks
5. Verify emails received

**Expected Results:**
- ✅ Same signup flow as guest-to-user
- ✅ Onboarding guide appears immediately
- ✅ All email triggers work correctly

---

## 📋 Test Scenario 3: Returning User

### Steps
1. Login with existing account
2. Verify onboarding guide state:
   - If incomplete: Shows with progress
   - If dismissed: Can re-show from help menu
   - If complete: Does not show

**Expected Results:**
- ✅ Onboarding state persists across sessions
- ✅ Completed tasks remain checked
- ✅ Can re-show dismissed guide

---

## 📋 Test Scenario 4: Edge Cases

### Guest Upload Limits
- ✅ Upload <3 photos → Error: "Minimum 3 photos"
- ✅ Upload >5 photos → Error: "Maximum 5 photos"
- ✅ Upload file >50MB → Error: "File too large"
- ✅ Upload non-image file → Error: "Invalid file type"

### Signup Validation
- ✅ Invalid email format → Error shown
- ✅ Existing email → Error: "Email already exists"
- ✅ Weak password → Strength indicator shows weak
- ✅ Mismatched passwords → Error shown

### Onboarding Persistence
- ✅ Complete task → Refresh page → Task still complete
- ✅ Dismiss guide → Logout → Login → Guide can be re-shown
- ✅ Complete all tasks → Celebration shown once

---

## 🔍 Analytics Verification

### Events to Track

**Guest Upload:**
- `guest_upload_started` - When files are selected
- `guest_upload_completed` - When gallery is created

**Signup:**
- `signup_started` - When email is entered
- `signup_step_completed` - After each step (1, 2, 3)
- `signup_completed` - When account is created

**Onboarding:**
- `onboarding_task_completed` - When each task is done
- `onboarding_completed` - When all tasks are done

**Conversion:**
- `guest_to_user_conversion` - Guest who creates account
- `first_gallery_created` - User's first gallery
- `upgrade_modal_shown` - When upgrade prompt appears

### Verify in Analytics Dashboard
1. Navigate to `/admin/analytics` (if available)
2. Check funnel metrics:
   - Guest upload → Signup conversion rate (target: 40%)
   - Signup completion rate (target: 80%)
   - Onboarding completion rate (target: 70%)

---

## 🐛 Common Issues & Solutions

### Issue: Soft signup modal doesn't appear
**Solution:** Wait full 2 minutes on guest gallery page

### Issue: Welcome email not received
**Solution:** 
1. Check spam folder
2. Verify email templates exist in database
3. Check Resend API key is configured
4. Check email service logs

### Issue: Onboarding tasks don't persist
**Solution:**
1. Check database connection
2. Verify `/api/onboarding/tasks` endpoint works
3. Check browser localStorage

### Issue: Confetti doesn't show
**Solution:**
1. Check browser console for errors
2. Verify `canvas-confetti` library is loaded
3. Try different browser

---

## ✅ Success Criteria

Phase 3 is successful if:

- ✅ Guest can upload 3-5 photos and create gallery
- ✅ Soft signup modal appears after 2 minutes
- ✅ Progressive signup completes in 3 steps
- ✅ Onboarding guide displays with 4 tasks
- ✅ First gallery creation triggers celebration
- ✅ All email triggers send correctly
- ✅ Unsubscribe functionality works
- ✅ Analytics events are tracked
- ✅ State persists across sessions

---

## 📊 Metrics to Monitor

### Conversion Rates
- Guest upload → Signup: Target 40%
- Signup step 1 → 2: Target 90%
- Signup step 2 → 3: Target 85%
- Onboarding started → completed: Target 70%

### Performance
- Gallery creation time: <30 seconds
- Page load time: <2 seconds
- Email delivery time: <5 minutes

### User Experience
- Signup abandonment rate: <20%
- Onboarding dismissal rate: <30%
- Email unsubscribe rate: <5%

---

**Last Updated:** February 7, 2026  
**Version:** 1.0  
**Status:** Ready for Testing
