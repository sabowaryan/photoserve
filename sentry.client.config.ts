/**
 * Sentry Client Configuration
 * 
 * This file configures Sentry for client-side error tracking.
 * It captures errors, performance data, and user feedback from the browser.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';

// Only initialize Sentry if DSN is provided
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Environment (development, staging, production)
    environment: SENTRY_ENVIRONMENT,
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,
    
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
    
    // Replay configuration for session replay
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Filter out certain errors
    beforeSend(event, hint) {
      // Filter out network errors that are not actionable
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        
        // Ignore common browser extension errors
        if (
          message.includes('Extension context invalidated') ||
          message.includes('chrome-extension://') ||
          message.includes('moz-extension://')
        ) {
          return null;
        }
        
        // Ignore ResizeObserver errors (common and harmless)
        if (message.includes('ResizeObserver')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Add custom tags
    initialScope: {
      tags: {
        'app.component': 'client',
      },
    },
  });
}
