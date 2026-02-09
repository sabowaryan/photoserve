# Auth Pages Performance Optimization

## 🔴 Lighthouse Scores (Before)
- **Performance: 25** (Critical)
- **FCP: 1.3s** (Good)
- **LCP: 1.9s** (Good)
- **TBT: 1900ms** (Critical - should be < 200ms)
- **Speed Index: 4.1s** (Needs improvement)
- **CLS: 0** (Excellent ✅)

---

## 🎯 Root Causes Identified

### 1. Total Blocking Time (1900ms)
**Problem**: JavaScript blocking the main thread
**Causes**:
- Heavy client-side JavaScript execution
- React hydration overhead
- Form validation libraries (Zod, React Hook Form)
- Dynamic imports not optimized
- Too many font weights loaded (5 weights)

### 2. Speed Index (4.1s)
**Problem**: Content not appearing quickly enough
**Causes**:
- Background SVG image (`/grid.svg`) blocking render
- Multiple blur effects (backdrop-blur, blur-3xl)
- Excessive transitions on all elements
- Animate-pulse on loading states

---

## ✅ Optimizations Applied

### 1. Font Loading
**Before**:
```tsx
weight: ['400', '500', '600', '700', '800'] // 5 weights
```

**After**:
```tsx
weight: ['400', '600', '700'] // 3 weights only
```
**Impact**: -40% font payload

### 2. Background Grid
**Before**:
```tsx
<div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
```

**After**:
```tsx
<div className="absolute inset-0 opacity-10">
  <div style={{
    backgroundImage: 'linear-gradient(...)',
    backgroundSize: '20px 20px'
  }} />
</div>
```
**Impact**: No HTTP request, pure CSS

### 3. Structured Data
**Before**:
```tsx
<script type="application/ld+json">{organizationSchema}</script>
<script type="application/ld+json">{softwareSchema}</script>
```

**After**:
```tsx
<script type="application/ld+json">
  {{ '@graph': [organizationSchema, softwareSchema] }}
</script>
```
**Impact**: 1 script tag instead of 2

### 4. CSS Transitions
**Before**:
```css
* {
  transition-property: color, background-color, border-color, 
                       text-decoration-color, fill, stroke;
}
```

**After**:
```css
* {
  transition-property: none;
}

button, a, input {
  transition-property: color, background-color, border-color, opacity;
}
```
**Impact**: Reduced paint operations

### 5. Loading States
**Before**:
```tsx
<div className="animate-pulse" />
```

**After**:
```tsx
<div /> // No animation
```
**Impact**: Less CPU usage during loading

---

## 🚀 Additional Recommendations

### 1. Code Splitting (High Priority)
**Current Issue**: All form validation code loads upfront

**Solution**:
```tsx
// Split Zod schemas by tab
const SignInSchema = dynamic(() => import('./schemas/signin'));
const SignUpSchema = dynamic(() => import('./schemas/signup'));
```

**Expected Impact**: -30% TBT

### 2. Defer Non-Critical JavaScript
**Current Issue**: Google Sign-In button loads immediately

**Solution**:
```tsx
const GoogleSignInButton = dynamic(
  () => import('./google-sign-in-button'),
  { 
    ssr: false,
    loading: () => <Skeleton />
  }
);

// Only load when user interacts
const [showGoogle, setShowGoogle] = useState(false);
useEffect(() => {
  const timer = setTimeout(() => setShowGoogle(true), 2000);
  return () => clearTimeout(timer);
}, []);
```

**Expected Impact**: -20% TBT

### 3. Optimize React Hook Form
**Current Issue**: 3 separate form instances

**Solution**:
```tsx
// Use single form with conditional validation
const form = useForm({
  resolver: zodResolver(
    activeTab === 'signin' ? signInSchema : signUpSchema
  )
});
```

**Expected Impact**: -15% TBT

### 4. Preconnect to External Domains
**Add to layout**:
```tsx
<link rel="preconnect" href="https://accounts.google.com" />
<link rel="dns-prefetch" href="https://accounts.google.com" />
```

**Expected Impact**: -200ms for Google OAuth

### 5. Reduce Blur Effects
**Current Issue**: Multiple blur-3xl elements

**Solution**:
```tsx
// Use single blur container
<div className="absolute inset-0 blur-3xl">
  <div className="absolute top-0 right-0 w-96 h-96 bg-white/10" />
  <div className="absolute bottom-0 left-0 w-96 h-96 bg-piksend-violet/20" />
</div>
```

**Expected Impact**: -10% paint time

---

## 📊 Expected Results After All Optimizations

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Performance | 25 | **70-80** | 90+ |
| TBT | 1900ms | **300-400ms** | <200ms |
| Speed Index | 4.1s | **2.5-3.0s** | <3.4s |
| FCP | 1.3s | **1.0s** | <1.8s |
| LCP | 1.9s | **1.5s** | <2.5s |
| CLS | 0 | **0** | <0.1 |

---

## 🔧 Implementation Priority

### Phase 1 (Immediate - Already Done)
- [x] Reduce font weights
- [x] Replace SVG with CSS grid
- [x] Combine structured data scripts
- [x] Optimize CSS transitions
- [x] Remove animate-pulse

### Phase 2 (High Priority - Next)
- [ ] Code split Zod schemas
- [ ] Defer Google Sign-In button
- [ ] Consolidate React Hook Form instances
- [ ] Add preconnect links

### Phase 3 (Medium Priority)
- [ ] Optimize blur effects
- [ ] Lazy load testimonial section
- [ ] Implement intersection observer for sidebar
- [ ] Add resource hints

### Phase 4 (Low Priority)
- [ ] Consider removing backdrop-blur on mobile
- [ ] Implement virtual scrolling for long forms
- [ ] Add service worker for offline support

---

## 🧪 Testing Commands

### Lighthouse CI
```bash
# Run Lighthouse audit
npm run lighthouse -- --only-categories=performance

# Run multiple times for average
for i in {1..5}; do
  npm run lighthouse -- --only-categories=performance
done
```

### WebPageTest
```bash
# Test from multiple locations
https://www.webpagetest.org/
```

### Chrome DevTools
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Reload page
5. Stop recording
6. Analyze:
   - Long Tasks (>50ms)
   - JavaScript execution time
   - Layout shifts

---

## 📚 Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Performance Scoring](https://web.dev/performance-scoring/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance](https://react.dev/learn/render-and-commit)

---

## 🎯 Success Criteria

- [ ] Performance score > 70
- [ ] TBT < 400ms
- [ ] Speed Index < 3.0s
- [ ] All Core Web Vitals pass
- [ ] No accessibility regressions
- [ ] No functionality broken

---

**Last Updated**: February 9, 2026
**Status**: 🟡 Phase 1 Complete, Phase 2 In Progress
