// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry in production to avoid massive dev performance hit
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  Sentry.init({
    dsn: "https://f38662b3b274e79a370144b9a5e78250@o4509445026152448.ingest.us.sentry.io/4510840176836608",

    // Optimized integrations - replay is expensive, only on errors
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      })
    ],

    // Reduced sampling for better performance
    tracesSampleRate: 0.1, // Reduced from 1 to 0.1 (10%)
    
    // Disable logs in production for performance
    enableLogs: false,

    // Reduced replay sampling
    replaysSessionSampleRate: 0.01, // Reduced from 0.1 to 0.01 (1%)

    // Keep error replay at 100%
    replaysOnErrorSampleRate: 1.0,

    // Disable PII for better privacy and performance
    sendDefaultPii: false,
    
    // Performance optimizations
    beforeSend(event) {
      // Filter out non-critical errors
      if (event.level === 'info' || event.level === 'debug') {
        return null;
      }
      return event;
    },
  });
}

// Export no-op in development, real function in production
export const onRouterTransitionStart = isProduction 
  ? Sentry.captureRouterTransitionStart 
  : () => {};
