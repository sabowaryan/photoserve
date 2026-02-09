/**
 * Prefetch Utilities
 * 
 * Utilities for prefetching critical pages to improve navigation performance.
 * 
 * Requirements: 19.7 - Implement prefetching for critical pages
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Critical pages that should be prefetched
 */
export const CRITICAL_PAGES = [
  '/for/photographers/wedding',
  '/for/photographers/event',
  '/for/photographers/portrait',
  '/for/studios',
  '/pricing',
  '/auth',
  '/demo',
  '/success-stories',
] as const;

/**
 * Hook to prefetch critical pages on mount
 * 
 * Usage:
 * ```tsx
 * function HomePage() {
 *   usePrefetchCriticalPages();
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePrefetchCriticalPages() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch all critical pages
    CRITICAL_PAGES.forEach((page) => {
      router.prefetch(page);
    });
  }, [router]);
}

/**
 * Hook to prefetch specific pages
 * 
 * Usage:
 * ```tsx
 * function Component() {
 *   usePrefetchPages(['/pricing', '/auth']);
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePrefetchPages(pages: string[]) {
  const router = useRouter();

  useEffect(() => {
    pages.forEach((page) => {
      router.prefetch(page);
    });
  }, [router, pages]);
}

/**
 * Prefetch a page on hover
 * 
 * Usage:
 * ```tsx
 * <div onMouseEnter={() => prefetchOnHover('/pricing')}>
 *   Hover to prefetch
 * </div>
 * ```
 */
export function prefetchOnHover(page: string) {
  if (typeof window !== 'undefined') {
    const router = (window as any).__NEXT_ROUTER__;
    if (router) {
      router.prefetch(page);
    }
  }
}

/**
 * Prefetch pages based on user persona
 * 
 * Usage:
 * ```tsx
 * function Component() {
 *   const persona = getPersona();
 *   usePrefetchPersonaPages(persona);
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePrefetchPersonaPages(persona: string | null) {
  const router = useRouter();

  useEffect(() => {
    if (!persona) return;

    // Prefetch persona-specific landing page
    const landingPage = `/for/photographers/${persona}`;
    router.prefetch(landingPage);

    // Prefetch related pages
    router.prefetch('/pricing');
    router.prefetch('/auth');
    router.prefetch('/success-stories');
  }, [router, persona]);
}

/**
 * Prefetch pages on idle
 * 
 * Prefetches pages when the browser is idle to avoid impacting performance.
 * 
 * Usage:
 * ```tsx
 * function Component() {
 *   usePrefetchOnIdle(['/pricing', '/auth']);
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePrefetchOnIdle(pages: string[]) {
  const router = useRouter();

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const idleCallback = window.requestIdleCallback(() => {
        pages.forEach((page) => {
          router.prefetch(page);
        });
      });

      return () => {
        window.cancelIdleCallback(idleCallback);
      };
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      const timeout = setTimeout(() => {
        pages.forEach((page) => {
          router.prefetch(page);
        });
      }, 1000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [router, pages]);
}
