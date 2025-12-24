-- Fix Security Definer View issue by recreating the view with SECURITY INVOKER
DROP VIEW IF EXISTS public.galleries_public;

-- Recreate with explicit SECURITY INVOKER (default, but making it explicit)
CREATE VIEW public.galleries_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  title,
  unique_slug,
  created_at,
  updated_at,
  expires_at,
  expiration_days,
  views_count,
  is_active
FROM public.galleries
WHERE is_active = true 
  AND expires_at > now();