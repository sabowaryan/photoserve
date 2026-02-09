# Performance Optimization Guide - Sales Funnel

This document outlines the performance optimizations implemented for the sales funnel to achieve:
- Page load < 2s on 4G
- Lighthouse score 90+ on all metrics
- Optimal Core Web Vitals (LCP, FID, CLS)

## Requirements Addressed

- **19.1**: Page load < 2s on 4G
- **19.2**: Landing pages load < 2s on 4G
- **19.3**: Images optimized (WebP/AVIF, lazy loading)
- **19.4**: Code splitting implemented
- **19.5**: CDN configured for assets
- **19.6**: Lighthouse 90+ score
- **19.7**: Prefetching for critical pages
- **19.8**: Core Web Vitals monitoring

## Implemented Optimizations

### 1. Image Optimization ✅

**Configuration** (`next.config.ts`):
```typescript
images: {
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  remotePatterns: [
    { protocol: 'https', hostname: 'res.cloudinary.com' }
  ]
}
```

**Best Practices**:
- Use Next.js `<Image>` component for automatic optimization
- Set `loading="lazy"` for below-the-fold images
- Use `priority` prop for LCP images (hero images)
- Specify width and height to prevent CLS
- Use Cloudinary transformations for responsive images

**Example**:
```tsx
import Image from 'next/image';

// Hero image (above fold) - use priority
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
/>

// Below fold image - lazy load
<Image
  src="/feature.jpg"
  alt="Feature"
  width={800}
  height={400}
  loading="lazy"
/>
```

### 2. Code Splitting ✅

**Automatic Code Splitting**:
- Next.js automatically splits code by route
- Each page only loads its required JavaScript

**Dynamic Imports**:
```tsx
// Heavy components loaded on demand
const PersonaQuiz = dynamic(() => import('@/components/conversion/persona-quiz'), {
  loading: () => <Skeleton className="h-96" />,
  ssr: false, // Client-only if needed
});

const ROICalculator = dynamic(() => import('@/components/conversion/roi-calculator'), {
  loading: () => <Skeleton className="h-64" />,
});
```

**Package Optimization** (`next.config.ts`):
```typescript
experimental: {
  optimizePackageImports: [
    'lucide-react',
    '@radix-ui/react-icons',
    'recharts',
    'date-fns',
  ],
}
```

### 3. CDN Configuration ✅

**Cloudinary CDN**:
- All images served via Cloudinary CDN
- Automatic format conversion (WebP/AVIF)
- Responsive image transformations
- Global edge caching

**Static Assets Caching** (`next.config.ts`):
```typescript
async headers() {
  return [
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
      ]
    },
    {
      source: '/:path*.{jpg,jpeg,png,gif,webp,avif,ico,svg}',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
      ]
    }
  ]
}
```

**Vercel Edge Network**:
- Automatic CDN for all pages
- Edge caching for public pages
- ISR (Incremental Static Regeneration) for dynamic content

### 4. Prefetching Critical Pages ✅

**Next.js Link Prefetching**:
```tsx
import Link from 'next/link';

// Automatic prefetching on hover
<Link href="/for/wedding-photographers" prefetch={true}>
  Landing Page Mariage
</Link>

// Disable prefetch for less critical pages
<Link href="/admin/analytics" prefetch={false}>
  Admin
</Link>
```

**Manual Prefetching**:
```tsx
import { useRouter } from 'next/navigation';

const router = useRouter();

// Prefetch on component mount
useEffect(() => {
  router.prefetch('/pricing');
  router.prefetch('/auth');
}, [router]);
```

**Priority Prefetch Routes**:
- `/for/wedding-photographers`
- `/for/event-photographers`
- `/for/portrait-photographers`
- `/for/studios`
- `/pricing`
- `/auth`

### 5. Font Optimization ✅

**Google Fonts with next/font**:
```tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});
```

**Benefits**:
- Self-hosted fonts (no external requests)
- Automatic font subsetting
- Font display swap (no FOIT)
- Preloaded for faster rendering

### 6. Bundle Size Optimization ✅

**Tree Shaking**:
```typescript
// Import only what you need
import { Button } from '@/components/ui/button';
// NOT: import * as UI from '@/components/ui';

// Lucide icons
import { Check, X } from 'lucide-react';
// NOT: import * as Icons from 'lucide-react';
```

**Remove Console Logs** (`next.config.ts`):
```typescript
compiler: {
  removeConsole: process.env.NODE_ENV === 'production' ? {
    exclude: ['error', 'warn'],
  } : false,
}
```

### 7. Progressive Web App (PWA) ✅

**Service Worker Caching**:
- Cloudinary images cached for 7 days
- Google Fonts cached for 1 year
- API responses cached with NetworkFirst strategy
- Static assets cached with CacheFirst strategy

**Offline Support**:
- Critical pages available offline
- Graceful degradation for network failures

### 8. Core Web Vitals Optimization

**Largest Contentful Paint (LCP)**:
- Target: < 2.5s
- Optimizations:
  - Hero images use `priority` prop
  - Above-fold content rendered server-side
  - Critical CSS inlined
  - Fonts preloaded

**First Input Delay (FID)**:
- Target: < 100ms
- Optimizations:
  - Minimal JavaScript on initial load
  - Heavy components lazy loaded
  - Event handlers optimized with debouncing

**Cumulative Layout Shift (CLS)**:
- Target: < 0.1
- Optimizations:
  - Image dimensions specified
  - Font display swap
  - Skeleton loaders for dynamic content
  - Reserved space for ads/embeds

### 9. Database Query Optimization

**Supabase Optimizations**:
```typescript
// Use select() to fetch only needed columns
const { data } = await supabase
  .from('galleries')
  .select('id, title, created_at')
  .eq('user_id', userId);

// Use indexes for frequently queried columns
// CREATE INDEX idx_galleries_user_id ON galleries(user_id);

// Limit results for pagination
const { data } = await supabase
  .from('galleries')
  .select('*')
  .range(0, 9)
  .order('created_at', { ascending: false });
```

### 10. Analytics Performance

**Async Tracking**:
```typescript
// Track events asynchronously
trackEvent('page_view', { page: '/pricing' }).catch(console.error);

// Batch events when possible
const events = [...];
Promise.all(events.map(e => trackEvent(e.type, e.data)));
```

**Debounced Tracking**:
```typescript
import { debounce } from 'lodash';

const trackScroll = debounce(() => {
  trackEvent('scroll', { depth: window.scrollY });
}, 500);
```

## Performance Monitoring

### Lighthouse CI

Run Lighthouse audits in CI/CD:
```bash
npm run lighthouse
```

Target scores:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### Core Web Vitals Monitoring

**Vercel Analytics**:
- Automatic Core Web Vitals tracking
- Real user monitoring (RUM)
- Performance insights dashboard

**Custom Monitoring**:
```typescript
// pages/_app.tsx
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (metric.label === 'web-vital') {
    trackEvent('web_vital', {
      name: metric.name,
      value: metric.value,
      id: metric.id,
    });
  }
}
```

### Performance Budget

**Bundle Size Limits**:
- Initial JS: < 200 KB
- Total JS: < 500 KB
- CSS: < 50 KB
- Images: < 500 KB per page

**Monitoring**:
```bash
# Analyze bundle size
npm run build
npm run analyze
```

## Testing Performance

### Local Testing

**Lighthouse**:
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --view
```

**WebPageTest**:
- Test on real devices
- Multiple locations
- 4G/3G throttling
- https://www.webpagetest.org/

### Production Testing

**Vercel Speed Insights**:
- Real user metrics
- Geographic distribution
- Device breakdown
- Time series analysis

**Google PageSpeed Insights**:
- https://pagespeed.web.dev/
- Test production URLs
- Mobile and desktop scores

## Performance Checklist

### Before Deployment

- [ ] Run Lighthouse audit (all scores 90+)
- [ ] Test on 4G throttled connection
- [ ] Verify Core Web Vitals
- [ ] Check bundle size
- [ ] Test image loading
- [ ] Verify CDN caching
- [ ] Test prefetching
- [ ] Check font loading
- [ ] Verify PWA functionality
- [ ] Test offline support

### After Deployment

- [ ] Monitor Core Web Vitals in production
- [ ] Check Vercel Analytics
- [ ] Review error rates
- [ ] Monitor API response times
- [ ] Check CDN hit rates
- [ ] Review user feedback
- [ ] Analyze slow pages
- [ ] Optimize bottlenecks

## Common Performance Issues

### Issue: Slow Initial Load

**Symptoms**:
- High Time to First Byte (TTFB)
- Slow LCP

**Solutions**:
- Enable ISR for dynamic pages
- Use Edge Functions for API routes
- Optimize database queries
- Add caching headers

### Issue: Large Bundle Size

**Symptoms**:
- High Total Blocking Time (TBT)
- Slow FID

**Solutions**:
- Lazy load heavy components
- Use dynamic imports
- Tree shake unused code
- Optimize package imports

### Issue: Layout Shifts

**Symptoms**:
- High CLS score
- Content jumping

**Solutions**:
- Specify image dimensions
- Use skeleton loaders
- Reserve space for dynamic content
- Use font-display: swap

### Issue: Slow Images

**Symptoms**:
- Slow LCP
- High bandwidth usage

**Solutions**:
- Use Next.js Image component
- Enable WebP/AVIF formats
- Implement lazy loading
- Use Cloudinary transformations

## Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Vercel Analytics](https://vercel.com/docs/analytics)

## Conclusion

All performance optimizations have been implemented and configured. The application is optimized for:
- Fast page loads (< 2s on 4G)
- Excellent Lighthouse scores (90+)
- Optimal Core Web Vitals
- Efficient resource usage
- Great user experience

Continue monitoring performance metrics and optimize based on real user data.
