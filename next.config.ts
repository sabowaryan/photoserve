import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Empty turbopack config to silence the warning
  turbopack: {},
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    // Enable image optimization
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Configure image qualities to support both 75 (default) and 85
    qualities: [75, 85],
  },

  // Performance optimizations (Requirement 12.3, 12.4, 12.5)
  experimental: {
    // Enable optimized package imports for better code splitting
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'date-fns',
      'react-hook-form',
      '@hookform/resolvers',
    ],
    // Optimize CSS
    optimizeCss: true,
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Webpack configuration for better tree-shaking
  webpack: (config, { dev, isServer }) => {
    // CRITICAL: Completely disable Sentry in development to save 1+ second of execution time
    if (dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sentry/nextjs': false,
        '@sentry/browser': false,
        '@sentry/core': false,
        '@sentry/react': false,
        '@sentry-internal/replay': false,
        '@sentry-internal/browser-utils': false,
      };
    }
    
    // Optimize bundle size
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }
    
    return config;
  },

  // Headers for CDN caching (Requirement 12.5)
  async headers() {
    return [
      {
        // Security headers for all routes (Requirements: 4.1)
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://accounts.google.com https://www.google-analytics.com https://res.cloudinary.com wss://*.supabase.co",
              "frame-src 'self' https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      {
        // Cache public profile pages
        source: '/p/:slug',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=3600',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=3600',
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images
        source: '/:path*.{jpg,jpeg,png,gif,webp,avif,ico,svg}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(
  withPWA({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "cloudinary-images",
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-webfonts",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "google-fonts-stylesheets",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
            },
          },
        },
        {
          urlPattern: /^https:\/\/accounts\.google\.com\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "google-oauth",
            networkTimeoutSeconds: 5,
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60, // 1 hour
            },
          },
        },
        {
          urlPattern: /\/api\/galleries\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-galleries",
            networkTimeoutSeconds: 10,
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 5 * 60, // 5 minutes
            },
          },
        },
        {
          urlPattern: /\/g\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "gallery-pages",
            networkTimeoutSeconds: 10,
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 24 * 60 * 60, // 24 hours
            },
          },
        },
        {
          urlPattern: /\/_next\/static\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "next-static",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
            },
          },
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
          handler: "CacheFirst",
          options: {
            cacheName: "static-images",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
          },
        },
      ],
    },
  })(nextConfig),
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "stelm-technologies",
    project: "piksend",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Disable Sentry in development for performance
    disableLogger: process.env.NODE_ENV === 'development',

    // Webpack-specific options (not supported with Turbopack)
    webpack: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      treeshake: {
        removeDebugLogging: true,
      },
      // Enables automatic instrumentation of Vercel Cron Monitors
      // (Does not yet work with App Router route handlers)
      automaticVercelMonitors: true,
    },
  }
);
