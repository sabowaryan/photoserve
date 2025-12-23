-- Function to increment storage usage
CREATE OR REPLACE FUNCTION public.increment_storage(user_id UUID, size_mb NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET storage_used_mb = storage_used_mb + size_mb
  WHERE id = user_id;
END;
$$;

-- Function to decrement storage usage
CREATE OR REPLACE FUNCTION public.decrement_storage(user_id UUID, size_mb NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET storage_used_mb = GREATEST(0, storage_used_mb - size_mb)
  WHERE id = user_id;
END;
$$;

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION public.generate_unique_slug()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
  slug_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM galleries WHERE unique_slug = result) INTO slug_exists;
    
    IF NOT slug_exists THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$;