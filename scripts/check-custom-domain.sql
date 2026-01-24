-- Script to check custom domain configuration
-- Run this to verify if photo.joventy.cd is properly configured

-- Check if the domain exists in any profile
SELECT 
  id as user_id,
  email,
  branding->>'customDomain' as custom_domain,
  branding->>'domainVerified' as domain_verified,
  branding->>'sslProvider' as ssl_provider,
  branding->>'sslCertificateId' as ssl_certificate_id,
  subscription_plan
FROM profiles
WHERE branding->>'customDomain' = 'photo.joventy.cd';

-- If no results, check for similar domains (case sensitivity, typos)
SELECT 
  id as user_id,
  email,
  branding->>'customDomain' as custom_domain,
  branding->>'domainVerified' as domain_verified
FROM profiles
WHERE branding->>'customDomain' ILIKE '%joventy%';

-- Check all custom domains in the system
SELECT 
  id as user_id,
  email,
  branding->>'customDomain' as custom_domain,
  branding->>'domainVerified' as domain_verified,
  subscription_plan
FROM profiles
WHERE branding->>'customDomain' IS NOT NULL
ORDER BY created_at DESC;
