# Implementation Notes - Task 3.5

## Progressive Signup Triggers Integration

### Overview
Integrated progressive signup triggers in the funnel to capture users at strategic moments:
- After 2 minutes of viewing a guest gallery
- When clicking on locked features (ZIP download, custom branding)
- When reaching plan limits (to be integrated with existing upgrade modal)

### Components Created

#### 1. SoftSignupModal (`src/components/conversion/soft-signup-modal.tsx`)
A progressive 3-step signup modal:
- **Step 1**: Email collection
- **Step 2**: Password creation with account setup
- **Step 3**: Optional profile completion

Features:
- Trigger-specific messaging (guest_upload, feature_locked, limit_reached, time_based)
- Auto-authentication after signup
- Event tracking integration
- Dismissal cooldown (24 hours per trigger type)

#### 2. useSignupTrigger Hook (`src/hooks/use-signup-trigger.ts`)
Manages signup trigger logic:
- Time-based trigger (2 minutes after viewing)
- Manual trigger for feature locked/limit reached
- Dismissal tracking in localStorage
- 24-hour cooldown per trigger type

#### 3. Funnel Tracker (`src/lib/analytics/funnel-tracker.ts`)
Global utility for tracking funnel events:
- Exposed as `window.trackFunnelEvent()`
- Integrates with existing analytics service
- Tracks: signup_modal_shown, signup_step_completed, signup_completed, etc.

#### 4. FunnelTrackerProvider (`src/components/providers/funnel-tracker-provider.tsx`)
Initializes the global funnel tracker on app load

### Integration Points

#### Gallery View (`src/app/g/[slug]/gallery-view-client.tsx`)
- Added `useSignupTrigger` hook with 2-minute timer for guest viewers
- Integrated `SoftSignupModal` component
- Passes `onFeatureLocked` callback to GuestGalleryBanner

#### Guest Gallery Banner (`src/components/gallery-view/guest-gallery-banner.tsx`)
- Made locked feature boxes clickable
- Triggers signup modal when locked features are clicked
- Features: ZIP download, Custom branding

#### Root Layout (`src/app/layout.tsx`)
- Added `FunnelTrackerProvider` to initialize global tracking

### Event Tracking

The following events are tracked:
- `signup_trigger_shown` - When a trigger condition is met
- `signup_modal_shown` - When the modal is displayed
- `signup_modal_dismissed` - When the user closes the modal
- `signup_step_completed` - When each step is completed
- `signup_completed` - When the account is created

### Usage

#### Trigger Signup Manually
```typescript
const signupTrigger = useSignupTrigger({
  isAuthenticated: false,
  enableTimeTrigger: true,
  triggerDelay: 2 * 60 * 1000 // 2 minutes
});

// Trigger for locked feature
signupTrigger.triggerSignup('feature_locked', 'ZIP Download');

// Trigger for limit reached
signupTrigger.triggerSignup('limit_reached');
```

#### Track Funnel Events
```typescript
// From any component
if (typeof window !== 'undefined' && (window as any).trackFunnelEvent) {
  (window as any).trackFunnelEvent('custom_event', {
    data: 'value'
  });
}
```

### Requirements Satisfied

✅ **Requirement 5.6**: Trigger after guest upload (2 min de visualisation)
- Implemented time-based trigger with 2-minute delay
- Only triggers for guest gallery viewers (non-owners)

✅ **Requirement 6.8**: Use existing analytics service to track events
- Integrated with existing `analytics.service.ts`
- Tracks started, step_completed, completed events
- Uses existing `trackFunnelEvent` method

✅ **Trigger sur feature lockée**
- Made locked features in GuestGalleryBanner clickable
- Triggers signup modal with feature-specific messaging

✅ **Trigger sur limite atteinte**
- Hook supports limit_reached trigger type
- Can be integrated with existing upgrade modal logic

### Testing

To test the implementation:

1. **Time-based trigger (2 minutes)**:
   - Create a guest gallery
   - View it as a non-owner
   - Wait 2 minutes
   - Signup modal should appear

2. **Feature locked trigger**:
   - View a guest gallery
   - Click on "Téléchargement ZIP" or "Branding personnalisé"
   - Signup modal should appear with feature-specific messaging

3. **Dismissal cooldown**:
   - Dismiss a signup modal
   - Try to trigger the same type again within 24 hours
   - Modal should not appear

### Future Enhancements

1. **Limit Reached Trigger**: Integrate with existing upgrade modal when user reaches gallery limits
2. **A/B Testing**: Test different trigger timings and messaging
3. **Conversion Tracking**: Track conversion rates per trigger type
4. **Email Pre-fill**: Pre-fill email from lead magnet if available
5. **Social Proof**: Add testimonials or user count to modal

### Notes

- The signup modal uses the existing `/api/auth/signup` endpoint
- Auto-authentication uses NextAuth's `signIn` function
- Dismissal tracking uses localStorage with 24-hour expiry
- All tracking is non-blocking and fails silently to not break UX
