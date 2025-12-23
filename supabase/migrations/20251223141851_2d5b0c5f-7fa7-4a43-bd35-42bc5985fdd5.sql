-- Drop the public SELECT policy that exposes password_hash and user_id
DROP POLICY IF EXISTS "Anyone can view active galleries by slug" ON public.galleries;

-- The galleries_public view already exists and excludes password_hash and user_id
-- It should be used for all public gallery access