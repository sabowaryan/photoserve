# PhotoServe Documentation

Welcome to the PhotoServe documentation! This directory contains comprehensive guides for deploying, configuring, and understanding the PhotoServe platform.

## 📚 Documentation Index

### Getting Started

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide with step-by-step instructions
- **[ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md)** - Quick reference for all environment variables
- **[../.env.example](../.env.example)** - Template file for environment configuration

### Features

- **[custom-domain-implementation.md](./custom-domain-implementation.md)** - Custom domain feature for Pro plan users
- **[white-label-branding.md](./white-label-branding.md)** - Branding and customization options
- **[photographer-branding-guide.md](./photographer-branding-guide.md)** - Guide for photographers
- **[photographer-gallery-monetization.md](./photographer-gallery-monetization.md)** - Monetization features
- **[public-profile-specification.md](./public-profile-specification.md)** - Public profile system
- **[slideshow-feature.md](./slideshow-feature.md)** - Gallery slideshow functionality
- **[pwa-implementation-summary.md](./pwa-implementation-summary.md)** - Progressive Web App features
- **[analytics-tracking-system.md](./analytics-tracking-system.md)** - Analytics and tracking

### Technical Documentation

- **[FEATURES-BY-PLAN.md](./FEATURES-BY-PLAN.md)** - Feature availability by subscription plan
- **[database-migrations/](./database-migrations/)** - Database schema and migrations
- **[i18n/](./i18n/)** - Internationalization documentation

### Implementation Summaries

- **[task-13-implementation-summary.md](./task-13-implementation-summary.md)** - Gallery page updates
- **[task-15.1-implementation-summary.md](./task-15.1-implementation-summary.md)** - Logo upload service
- **[task-16-implementation-summary.md](./task-16-implementation-summary.md)** - Logo upload API
- **[task-17-implementation-summary.md](./task-17-implementation-summary.md)** - Gallery header logo display
- **[task-18.1-implementation-summary.md](./task-18.1-implementation-summary.md)** - Branding section UI

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

See [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md) for detailed variable descriptions.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Services

You'll need accounts and API keys for:

- ✅ **Supabase** - Database and authentication
- ✅ **Stripe** - Payment processing
- ✅ **Cloudinary** - Image hosting
- ✅ **Google OAuth** - Social authentication
- ✅ **Resend** - Email delivery
- ✅ **Gemini AI** - Translations
- ⚠️ **Cloudflare** - Custom domains (optional, Pro feature only)

### 4. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

## 🎨 Custom Domain Feature

The custom domain feature allows Pro plan photographers to use their own domain (e.g., `photos.theirsite.com`) for their galleries.

### Quick Setup

1. **Configure Cloudflare credentials** in `.env`:
   ```env
   CLOUDFLARE_API_TOKEN=your_token
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   NEXT_PUBLIC_APP_DOMAIN=piksend.com
   ```

2. **Photographer adds domain** in Settings > Branding

3. **System verifies DNS** automatically

4. **SSL provisioned** automatically via Cloudflare

See [custom-domain-implementation.md](./custom-domain-implementation.md) for detailed architecture and implementation.

## 📊 Feature Availability

| Feature | Free | Premium | Pro |
|---------|------|---------|-----|
| Gallery Creation | ✅ | ✅ | ✅ |
| Custom Colors | ❌ | ✅ | ✅ |
| Custom Logo | ❌ | ❌ | ✅ |
| Custom Domain | ❌ | ❌ | ✅ |
| Analytics | ❌ | ✅ | ✅ |
| Slideshow | ✅ | ✅ | ✅ |

See [FEATURES-BY-PLAN.md](./FEATURES-BY-PLAN.md) for complete feature matrix.

## 🔒 Security

### Environment Variables

- Never commit `.env` files to version control
- Use different keys for development and production
- Keep service role keys secret (server-side only)
- Rotate secrets regularly

### Best Practices

- Enable Row Level Security (RLS) on all Supabase tables
- Validate all user inputs
- Use CSRF protection on mutations
- Implement rate limiting
- Enable HTTPS in production

## 🐛 Troubleshooting

### Common Issues

**Custom Domain Not Working**
- Check DNS propagation: `dig photos.yoursite.com`
- Verify Cloudflare credentials
- Wait up to 48 hours for DNS propagation

**Image Upload Fails**
- Verify Cloudinary credentials
- Check file size (max 2MB)
- Check file type (PNG, JPG, WebP only)

**Authentication Issues**
- Verify Google OAuth redirect URIs
- Check NEXTAUTH_URL matches deployment URL
- Clear browser cookies

See [DEPLOYMENT.md#troubleshooting](./DEPLOYMENT.md#troubleshooting) for more solutions.

## 📖 Additional Resources

### External Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Cloudflare API](https://developers.cloudflare.com/api/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

### Support

For issues or questions:
1. Check documentation in this directory
2. Review error logs
3. Check service status pages
4. Contact support with error details

## 🔄 Updates

This documentation is regularly updated. Last major update: 2024

### Recent Changes

- ✅ Added comprehensive deployment guide
- ✅ Added environment variables reference
- ✅ Updated custom domain documentation
- ✅ Added troubleshooting sections

## 📝 Contributing

When adding new features:
1. Update relevant documentation
2. Add environment variables to `.env.example`
3. Update this README if adding new docs
4. Include implementation summaries

---

**Version:** 1.0.0  
**Last Updated:** 2024
