-- Fix the view to use SECURITY INVOKER (default) instead of SECURITY DEFINER
DROP VIEW IF EXISTS public.galleries_public;

CREATE VIEW public.galleries_public 
WITH (security_invoker = true)
AS
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

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.galleries_public TO anon;
GRANT SELECT ON public.galleries_public TO authenticated;