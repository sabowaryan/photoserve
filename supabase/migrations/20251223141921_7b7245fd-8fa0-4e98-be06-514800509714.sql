-- Drop the public SELECT policy on images that allows anyone to view images
-- Images should only be accessible through the verify-gallery-password edge function
-- or by authenticated gallery owners
DROP POLICY IF EXISTS "Anyone can view images in active galleries" ON public.images;