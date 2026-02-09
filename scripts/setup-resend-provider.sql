-- Setup Resend Email Provider
-- This script configures Resend as the active email provider

-- Check if provider already exists
DO $$
DECLARE
  provider_exists BOOLEAN;
  provider_count INTEGER;
BEGIN
  -- Check if resend provider exists
  SELECT EXISTS (
    SELECT 1 FROM public.email_providers WHERE name = 'resend'
  ) INTO provider_exists;
  
  IF provider_exists THEN
    RAISE NOTICE 'Resend provider already exists, updating...';
    
    -- Update existing provider to be active
    UPDATE public.email_providers
    SET is_active = TRUE,
        updated_at = NOW()
    WHERE name = 'resend';
    
    RAISE NOTICE '✓ Resend provider activated';
  ELSE
    RAISE NOTICE 'Creating new Resend provider...';
    
    -- Insert new provider (config will be encrypted by the application)
    -- The actual API key should be in RESEND_API_KEY environment variable
    INSERT INTO public.email_providers (name, is_active, config)
    VALUES ('resend', TRUE, 'encrypted_config_placeholder');
    
    RAISE NOTICE '✓ Resend provider created and activated';
  END IF;
  
  -- Verify only one provider is active
  SELECT COUNT(*) INTO provider_count
  FROM public.email_providers
  WHERE is_active = TRUE;
  
  IF provider_count = 1 THEN
    RAISE NOTICE '✓ Only one active provider (correct)';
  ELSE
    RAISE WARNING '⚠ Multiple active providers found: %', provider_count;
  END IF;
  
  -- Show current providers
  RAISE NOTICE '';
  RAISE NOTICE 'Current email providers:';
  FOR provider_exists IN 
    SELECT name, is_active FROM public.email_providers
  LOOP
    RAISE NOTICE '  - % (active: %)', provider_exists.name, provider_exists.is_active;
  END LOOP;
END $$;
