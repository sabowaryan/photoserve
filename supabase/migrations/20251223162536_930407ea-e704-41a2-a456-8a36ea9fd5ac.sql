-- Fix: Remove user_id from galleries_public view to prevent user enumeration
-- This addresses the PUBLIC_DATA_EXPOSURE security finding

DROP VIEW IF EXISTS public.galleries_public;

CREATE VIEW public.galleries_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  expires_at,
  views_count,
  is_active,
  unique_slug,
  expiration_days,
  created_at,
  updated_at
FROM public.galleries
WHERE is_active = true AND expires_at > NOW();