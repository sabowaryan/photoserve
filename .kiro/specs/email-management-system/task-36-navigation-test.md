# Task 36: Admin Navigation Testing Guide

## Test Checklist

### 1. Email Menu Item Display
- [ ] Navigate to `/admin`
- [ ] Verify "Emails" menu item is visible with Mail icon
- [ ] Verify chevron icon (right arrow) is displayed next to "Emails"

### 2. Sub-Menu Expansion
- [ ] Click on "Emails" menu item
- [ ] Verify sub-menu expands showing 7 items:
  - Dashboard
  - Providers
  - Senders
  - Templates
  - Logs
  - Analytics
  - Suppressions
- [ ] Verify chevron changes to down arrow when expanded
- [ ] Click "Emails" again to collapse
- [ ] Verify sub-menu collapses and chevron returns to right arrow

### 3. Sub-Menu Navigation
- [ ] Expand "Emails" menu
- [ ] Click "Dashboard" - verify navigation to `/admin/emails`
- [ ] Click "Providers" - verify navigation to `/admin/emails/providers`
- [ ] Click "Senders" - verify navigation to `/admin/emails/senders`
- [ ] Click "Templates" - verify navigation to `/admin/emails/templates`
- [ ] Click "Logs" - verify navigation to `/admin/emails/logs`
- [ ] Click "Analytics" - verify navigation to `/admin/emails/analytics`
- [ ] Click "Suppressions" - verify navigation to `/admin/emails/suppressions`

### 4. Active State Highlighting
- [ ] Navigate to `/admin/emails`
- [ ] Verify "Emails" menu item is highlighted (indigo background)
- [ ] Verify "Dashboard" sub-item is highlighted
- [ ] Navigate to `/admin/emails/templates`
- [ ] Verify "Templates" sub-item is highlighted
- [ ] Verify "Emails" parent remains highlighted

### 5. Auto-Expansion
- [ ] Navigate directly to `/admin/emails/logs` (via URL)
- [ ] Verify "Emails" menu automatically expands
- [ ] Verify "Logs" sub-item is highlighted
- [ ] Navigate to `/admin/users`
- [ ] Verify "Emails" menu collapses

### 6. Failed Email Badge
- [ ] Create some failed emails in the queue (set status to 'failed')
- [ ] Navigate to `/admin`
- [ ] Verify red badge appears next to "Emails" menu item
- [ ] Verify badge shows correct count of failed emails
- [ ] Verify badge updates automatically (wait 30 seconds)
- [ ] If count > 99, verify badge shows "99+"

### 7. Mobile Responsiveness
- [ ] Resize browser to mobile width (< 1024px)
- [ ] Verify hamburger menu button appears
- [ ] Click hamburger to open menu
- [ ] Verify "Emails" menu item is visible
- [ ] Click "Emails" to expand sub-menu
- [ ] Verify sub-menu expands properly
- [ ] Click a sub-menu item
- [ ] Verify mobile menu closes after navigation
- [ ] Verify overlay closes menu when clicked

### 8. Badge Display (No Failed Emails)
- [ ] Ensure no failed emails in queue
- [ ] Navigate to `/admin`
- [ ] Verify NO badge is displayed next to "Emails"
- [ ] Badge should only appear when count > 0

## Expected Behavior

### Sub-Menu Structure
```
Emails (with badge if failed > 0)
├── Dashboard
├── Providers
├── Senders
├── Templates
├── Logs
├── Analytics
└── Suppressions
```

### Badge Appearance
- Color: Red (bg-red-500)
- Shape: Rounded pill
- Position: Right side of menu item
- Text: White, bold, 10px
- Display: Only when failed count > 0
- Update: Every 30 seconds via API

### API Endpoint
- Endpoint: `/api/emails/queue/status`
- Returns: `{ status: { pending, processing, failed }, scheduled: [] }`
- Badge uses: `data.status.failed`

## Manual Testing Steps

1. Start the development server: `npm run dev`
2. Navigate to `/admin` (requires admin authentication)
3. Follow the test checklist above
4. Verify all functionality works as expected

## Notes

- The badge fetches data from `/api/emails/queue/status` every 30 seconds
- Sub-menu auto-expands when navigating to any email sub-page
- Mobile menu closes automatically on navigation
- Escape key closes mobile menu
- Body scroll is prevented when mobile menu is open
