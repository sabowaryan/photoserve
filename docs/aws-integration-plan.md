# PikSend - AWS Free Tier Integration Plan

## Overview

This document outlines the integration of 7 AWS Free Tier services into PikSend to enhance performance, scalability, and functionality.

---

## 1. Amazon S3 (Simple Storage Service)

**Purpose:** Secure photo storage

**Integration:**
- Store original high-resolution gallery images
- Store photographer logos and branding assets
- Store watermark overlay images
- Store generated thumbnails
- Organize files by photographer ID and gallery ID
- Configure bucket policies for secure access
- Enable versioning for image protection

---

## 2. Amazon CloudFront

**Purpose:** Global content delivery network (CDN)

**Integration:**
- Distribute gallery images with low latency worldwide
- Cache images at edge locations for faster loading
- Serve S3 content through CloudFront URLs
- Configure signed URLs for protected content
- Enable HTTPS for secure image delivery
- Set cache policies for optimal performance
- Reduce bandwidth costs with edge caching

---

## 3. Amazon SES (Simple Email Service)

**Purpose:** Transactional email delivery

**Integration:**
- Send purchase confirmation emails to buyers
- Send sale notification emails to photographers
- Send payout confirmation emails
- Send dispute alert emails
- Send refund confirmation emails
- Send password reset and authentication emails
- Configure email templates with React Email
- Track email delivery and bounce rates

---

## 4. AWS Lambda

**Purpose:** Serverless image processing

**Integration:**
- Generate thumbnails on image upload
- Apply watermarks to preview images
- Compress images for optimized delivery
- Process images asynchronously in background
- Trigger functions on S3 upload events
- Handle webhook processing for high volume
- Resize images for different display sizes

---

## 5. Amazon ElastiCache (Redis)

**Purpose:** High-performance caching layer

**Integration:**
- Cache gallery monetization configurations
- Cache purchase access verification results
- Cache revenue statistics and analytics
- Cache conversion funnel data
- Implement cache invalidation on updates
- Reduce database load for frequent queries
- Store session data for faster access

---

## 6. Amazon SNS (Simple Notification Service)

**Purpose:** Push notifications and alerts

**Integration:**
- Send real-time push notifications to photographers
- Notify on new gallery purchases
- Alert on payout completions
- Warn on dispute creation
- Notify on refund processing
- Support mobile push for PWA application
- Fan-out notifications to multiple channels

---

## 7. Amazon CloudWatch

**Purpose:** Monitoring, logging, and alerting

**Integration:**
- Monitor application performance metrics
- Track API response times and error rates
- Log webhook processing events
- Monitor Lambda function executions
- Set alarms for error thresholds
- Track S3 storage and bandwidth usage
- Monitor ElastiCache performance
- Create dashboards for operational visibility

---

## Free Tier Limits

| Service | Free Tier Allocation |
|---------|---------------------|
| S3 | 5 GB storage, 20,000 GET, 2,000 PUT per month |
| CloudFront | 1 TB transfer, 10M requests per month |
| SES | 62,000 emails per month (from EC2) |
| Lambda | 1M requests, 400,000 GB-seconds per month |
| ElastiCache | 750 hours t2.micro per month (12 months) |
| SNS | 1M publishes, 1M mobile notifications per month |
| CloudWatch | 10 custom metrics, 10 alarms, 5 GB logs |

---

## Architecture Diagram

```
                         PikSend Architecture
                         
    ┌─────────────────────────────────────────────────────┐
    │                    Clients                           │
    └─────────────────────┬───────────────────────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────────────────┐
    │              CloudFront (CDN)                        │
    │              - Image delivery                        │
    │              - Edge caching                          │
    └─────────────────────┬───────────────────────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────────────────┐
    │              Next.js (Vercel)                        │
    │              - Application server                    │
    │              - API routes                            │
    └───┬─────────┬─────────┬─────────┬─────────┬────────┘
        │         │         │         │         │
        ▼         ▼         ▼         ▼         ▼
    ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
    │  S3   │ │  SES  │ │Lambda │ │ElastiC│ │  SNS  │
    │Storage│ │Emails │ │Process│ │ache   │ │Notify │
    └───────┘ └───────┘ └───────┘ └───────┘ └───────┘
        │                   │
        └───────────────────┘
              S3 triggers Lambda
              
    ┌─────────────────────────────────────────────────────┐
    │              CloudWatch                              │
    │              - Monitoring all services               │
    │              - Logs and alerts                       │
    └─────────────────────────────────────────────────────┘
    
    ┌─────────────────────────────────────────────────────┐
    │              External Services                       │
    │              - Supabase (Database + Auth)           │
    │              - Stripe Connect (Payments)            │
    └─────────────────────────────────────────────────────┘
```

---

## Implementation Priority

| Priority | Service | Reason |
|----------|---------|--------|
| 1 | SES | Complete email functionality (Task 8.1) |
| 2 | S3 | Foundation for image storage |
| 3 | CloudFront | Optimize image delivery |
| 4 | Lambda | Enable async image processing |
| 5 | ElastiCache | Production-ready caching |
| 6 | SNS | Real-time notifications |
| 7 | CloudWatch | Production monitoring |

---

*Document created: January 2026*
