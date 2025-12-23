-- Create a view for public gallery access that excludes password_hash
CREATE VIEW public.galleries_public AS
SELECT 
  id,
  title,
  expires_at,
  views_count,
  is_active,
  unique_slug,
  user_id,
  expiration_days,
  created_at,
  updated_at
FROM public.galleries
WHERE is_active = true AND expires_at > NOW();

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.galleries_public TO anon;
GRANT SELECT ON public.galleries_public TO authenticated;

-- Add explicit deny policy for anonymous access to profiles
CREATE POLICY "Block anonymous access to profiles" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (false);

-- Update storage functions to add caller verification
CREATE OR REPLACE FUNCTION public.increment_storage(user_id uuid, size_mb numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow service role or the user themselves
  IF auth.uid() IS NOT NULL AND auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify storage for other users';
  END IF;
  
  -- Validate size is positive and reasonable
  IF size_mb <= 0 OR size_mb > 1000 THEN
    RAISE EXCEPTION 'Invalid size_mb value';
  END IF;
  
  UPDATE profiles
  SET storage_used_mb = storage_used_mb + size_mb
  WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_storage(user_id uuid, size_mb numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow service role or the user themselves
  IF auth.uid() IS NOT NULL AND auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify storage for other users';
  END IF;
  
  -- Validate size is positive and reasonable
  IF size_mb <= 0 OR size_mb > 1000 THEN
    RAISE EXCEPTION 'Invalid size_mb value';
  END IF;
  
  UPDATE profiles
  SET storage_used_mb = GREATEST(0, storage_used_mb - size_mb)
  WHERE id = user_id;
END;
$$;