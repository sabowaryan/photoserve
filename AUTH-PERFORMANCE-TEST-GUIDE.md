# Auth Performance Testing Guide

## Quick Test Commands

### 1. Build and Test Production Bundle
```bash
# Build for production
npm run build

# Check bundle sizes in output
# Look for: First Load JS shared by all

# Start production server
npm start

# Open http://localhost:3000/auth
```

### 2. Lighthouse Audit (Chrome DevTools)
```
1. Open Chrome DevTools (F12)
2. Go to Lighthouse tab
3. Select:
   - Performance ✓
   - Device: Mobile
   - Throttling: Slow 4G
4. Click "Analyze page load"
5. Check scores:
   - Performance > 70 (target: 85+)
   - LCP < 2.5s
   - TBT < 300ms
```

### 3. Verify Sentry Disabled in Dev
```bash
# Start dev server
npm run dev

# Open http://localhost:3000/auth
# Open DevTools > Network tab
# Filter: "sentry"
# Should see: NO sentry requests
```

### 4. Check Bundle Analysis
```bash
# Install analyzer
npm install @next/bundle-analyzer --save-dev

# Add to next.config.ts (temporarily)
# const withBundleAnalyzer = require('@next/bundle-analyzer')({
#   enabled: process.env.ANALYZE === 'true',
# })

# Run analysis
ANALYZE=true npm run build

# Opens browser with bundle visualization
```

## Expected Results

### Development Mode
- **No Sentry network requests**
- **Faster page load** (~1-2s vs 3-4s before)
- **Smoother interactions** (no 1.5s blocking)

### Production Mode
- **Performance Score:** 85+ (was 25-50)
- **LCP:** < 1.5s (was 2.3s)
- **TBT:** < 300ms (was 1,510ms)
- **Bundle Size:** ~400KB (was 1.2MB)

## What to Check

### ✅ Functionality
- [ ] Sign in with email/password works
- [ ] Sign up flow works (all 3 steps)
- [ ] Google OAuth works
- [ ] Forgot password link works
- [ ] Error messages display correctly
- [ ] Success messages display correctly
- [ ] Form validation works
- [ ] Password visibility toggle works
- [ ] Redirect after auth works

### ✅ Performance
- [ ] Page loads in < 2s on Fast 3G
- [ ] No layout shift (CLS = 0)
- [ ] Smooth scrolling
- [ ] Fast button clicks (no delay)
- [ ] Google button loads quickly

### ✅ Visual
- [ ] Fonts load correctly (no FOIT)
- [ ] Icons display properly
- [ ] Gradient backgrounds work
- [ ] Mobile responsive
- [ ] Dark mode (if applicable)

## Troubleshooting

### Issue: Sentry still loading in dev
**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue: Fonts not loading
**Solution:**
Check that Inter font is preloaded:
```typescript
// src/app/(auth)/layout.tsx
const inter = Inter({
  preload: true,
  display: 'swap',
});
```

### Issue: Google OAuth slow
**Solution:**
Verify preconnect in layout:
```tsx
<link rel="preconnect" href="https://accounts.google.com" />
```

### Issue: Build fails
**Solution:**
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules/.cache
npm run build
```

## Performance Comparison

### Before Optimizations
```
Performance: 25
LCP: 2.3s
TBT: 1,510ms
Bundle: 1.2MB
Sentry: 972ms execution
```

### After Optimizations
```
Performance: 85+ (target)
LCP: 1.2s (target)
TBT: 200ms (target)
Bundle: 400KB (target)
Sentry: 0ms (disabled in dev)
```

## Next Steps

1. **Test in staging environment**
2. **Monitor production metrics** (Vercel Analytics)
3. **Check Sentry error rates** (should be same or lower)
4. **Gather user feedback** on perceived performance
5. **Consider additional optimizations** from docs/AUTH-PERFORMANCE-CRITICAL-FIXES.md

## Quick Wins Still Available

1. **Remove unused dependencies** (-200KB)
2. **Implement critical CSS** (-200ms LCP)
3. **Add service worker caching** (instant repeat visits)
4. **Optimize images** (if any added later)
5. **Enable Brotli compression** (-60% transfer)

---

**Last Updated:** 2026-02-09
**Status:** Ready for testing
