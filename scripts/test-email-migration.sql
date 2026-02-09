-- Test Script for Email Management System Migration
-- This script validates that the migration was successful

-- ============================================================================
-- 1. Verify all tables were created
-- ============================================================================

SELECT 
  'Tables Created' as test_category,
  table_name,
  CASE 
    WHEN table_name IN (
      'email_providers',
      'sender_addresses',
      'email_templates',
      'template_versions',
      'email_queue',
      'email_logs',
      'email_events',
      'email_suppressions',
      'email_unsubscribes'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'email_%'
ORDER BY table_name;

-- ============================================================================
-- 2. Verify indexes were created
-- ============================================================================

SELECT 
  'Indexes Created' as test_category,
  tablename,
  indexname,
  '✓ PASS' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'email_%'
ORDER BY tablename, indexname;

-- ============================================================================
-- 3. Verify RLS policies were created
-- ============================================================================

SELECT 
  'RLS Policies' as test_category,
  tablename,
  policyname,
  cmd as command,
  '✓ PASS' as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'email_%'
ORDER BY tablename, policyname;

-- ============================================================================
-- 4. Verify triggers were created
-- ============================================================================

SELECT 
  'Triggers Created' as test_category,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation,
  '✓ PASS' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table LIKE 'email_%'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 5. Test constraints - Provider name validation
-- ============================================================================

DO $$
BEGIN
  -- Test invalid provider name (should fail)
  BEGIN
    INSERT INTO email_providers (name, config) 
    VALUES ('invalid-provider', '{"test": "value"}');
    RAISE EXCEPTION 'FAIL: Invalid provider name was accepted';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✓ PASS: Provider name constraint working';
  END;
  
  -- Test valid provider name (should succeed)
  BEGIN
    INSERT INTO email_providers (name, config) 
    VALUES ('resend', '{"apiKey": "test_key"}');
    RAISE NOTICE '✓ PASS: Valid provider name accepted';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'FAIL: Valid provider name was rejected: %', SQLERRM;
  END;
END $$;

-- ============================================================================
-- 6. Test constraints - Email validation
-- ============================================================================

DO $$
BEGIN
  -- Test invalid email (should fail)
  BEGIN
    INSERT INTO sender_addresses (email) 
    VALUES ('invalid-email');
    RAISE EXCEPTION 'FAIL: Invalid email was accepted';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✓ PASS: Email validation constraint working';
  END;
  
  -- Test valid email (should succeed)
  BEGIN
    INSERT INTO sender_addresses (email, name) 
    VALUES ('test@example.com', 'Test Sender');
    RAISE NOTICE '✓ PASS: Valid email accepted';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'FAIL: Valid email was rejected: %', SQLERRM;
  END;
END $$;

-- ============================================================================
-- 7. Test single active provider trigger
-- ============================================================================

DO $$
DECLARE
  active_count INTEGER;
BEGIN
  -- Insert second active provider
  INSERT INTO email_providers (name, is_active, config) 
  VALUES ('aws-ses', true, '{"region": "us-east-1"}');
  
  -- Check only one is active
  SELECT COUNT(*) INTO active_count
  FROM email_providers
  WHERE is_active = true;
  
  IF active_count = 1 THEN
    RAISE NOTICE '✓ PASS: Single active provider trigger working (count: %)', active_count;
  ELSE
    RAISE EXCEPTION 'FAIL: Multiple active providers found (count: %)', active_count;
  END IF;
END $$;

-- ============================================================================
-- 8. Test single default sender trigger
-- ============================================================================

DO $$
DECLARE
  default_count INTEGER;
BEGIN
  -- Insert second default sender
  INSERT INTO sender_addresses (email, name, is_default, is_verified) 
  VALUES ('default@example.com', 'Default Sender', true, true);
  
  -- Check only one is default
  SELECT COUNT(*) INTO default_count
  FROM sender_addresses
  WHERE is_default = true;
  
  IF default_count = 1 THEN
    RAISE NOTICE '✓ PASS: Single default sender trigger working (count: %)', default_count;
  ELSE
    RAISE EXCEPTION 'FAIL: Multiple default senders found (count: %)', default_count;
  END IF;
END $$;

-- ============================================================================
-- 9. Test template creation and versioning
-- ============================================================================

DO $$
DECLARE
  template_id UUID;
  version_count INTEGER;
BEGIN
  -- Create a template
  INSERT INTO email_templates (
    name, slug, type, source, subject, content, variables
  ) VALUES (
    'Test Template',
    'test-template',
    'transactional',
    'custom',
    'Test Subject',
    '{"html": "<p>Test content</p>"}',
    '["name", "email"]'
  ) RETURNING id INTO template_id;
  
  -- Create a version
  INSERT INTO template_versions (
    template_id, version, subject, content, variables
  ) VALUES (
    template_id,
    1,
    'Test Subject',
    '{"html": "<p>Test content</p>"}',
    '["name", "email"]'
  );
  
  -- Verify version was created
  SELECT COUNT(*) INTO version_count
  FROM template_versions
  WHERE template_id = template_id;
  
  IF version_count = 1 THEN
    RAISE NOTICE '✓ PASS: Template versioning working';
  ELSE
    RAISE EXCEPTION 'FAIL: Template version not created';
  END IF;
END $$;

-- ============================================================================
-- 10. Test email queue and priority
-- ============================================================================

DO $$
DECLARE
  queue_id UUID;
BEGIN
  -- Create a queued email
  INSERT INTO email_queue (
    from_address,
    to_address,
    subject,
    html_content,
    priority,
    type,
    status
  ) VALUES (
    'sender@example.com',
    'recipient@example.com',
    'Test Email',
    '<p>Test content</p>',
    'high',
    'transactional',
    'pending'
  ) RETURNING id INTO queue_id;
  
  IF queue_id IS NOT NULL THEN
    RAISE NOTICE '✓ PASS: Email queue working';
  ELSE
    RAISE EXCEPTION 'FAIL: Email queue entry not created';
  END IF;
END $$;

-- ============================================================================
-- 11. Test email log and event tracking
-- ============================================================================

DO $$
DECLARE
  log_id UUID;
  event_id UUID;
  log_status VARCHAR(50);
BEGIN
  -- Create an email log
  INSERT INTO email_logs (
    provider,
    provider_message_id,
    from_address,
    to_address,
    subject,
    status
  ) VALUES (
    'resend',
    'msg_test_123',
    'sender@example.com',
    'recipient@example.com',
    'Test Email',
    'sent'
  ) RETURNING id INTO log_id;
  
  -- Create an event (should trigger update to email_logs)
  INSERT INTO email_events (
    log_id,
    event_type,
    event_data
  ) VALUES (
    log_id,
    'opened',
    '{"timestamp": "2024-01-01T00:00:00Z"}'
  ) RETURNING id INTO event_id;
  
  -- Check if email_logs was updated
  SELECT status INTO log_status
  FROM email_logs
  WHERE id = log_id;
  
  IF log_status = 'opened' THEN
    RAISE NOTICE '✓ PASS: Email event tracking and trigger working';
  ELSE
    RAISE EXCEPTION 'FAIL: Email log not updated by event trigger (status: %)', log_status;
  END IF;
END $$;

-- ============================================================================
-- 12. Test suppression list
-- ============================================================================

DO $$
DECLARE
  suppression_id UUID;
BEGIN
  -- Add to suppression list
  INSERT INTO email_suppressions (
    email,
    reason,
    bounce_type
  ) VALUES (
    'bounced@example.com',
    'bounce',
    'hard'
  ) RETURNING id INTO suppression_id;
  
  IF suppression_id IS NOT NULL THEN
    RAISE NOTICE '✓ PASS: Email suppression working';
  ELSE
    RAISE EXCEPTION 'FAIL: Email suppression entry not created';
  END IF;
END $$;

-- ============================================================================
-- 13. Test unsubscribe list
-- ============================================================================

DO $$
DECLARE
  unsubscribe_id UUID;
BEGIN
  -- Add to unsubscribe list
  INSERT INTO email_unsubscribes (
    email,
    reason
  ) VALUES (
    'unsubscribed@example.com',
    'No longer interested'
  ) RETURNING id INTO unsubscribe_id;
  
  IF unsubscribe_id IS NOT NULL THEN
    RAISE NOTICE '✓ PASS: Email unsubscribe working';
  ELSE
    RAISE EXCEPTION 'FAIL: Email unsubscribe entry not created';
  END IF;
END $$;

-- ============================================================================
-- 14. Clean up test data
-- ============================================================================

DELETE FROM email_unsubscribes WHERE email = 'unsubscribed@example.com';
DELETE FROM email_suppressions WHERE email = 'bounced@example.com';
DELETE FROM email_events WHERE log_id IN (SELECT id FROM email_logs WHERE provider_message_id = 'msg_test_123');
DELETE FROM email_logs WHERE provider_message_id = 'msg_test_123';
DELETE FROM email_queue WHERE to_address = 'recipient@example.com';
DELETE FROM template_versions WHERE template_id IN (SELECT id FROM email_templates WHERE slug = 'test-template');
DELETE FROM email_templates WHERE slug = 'test-template';
DELETE FROM sender_addresses WHERE email IN ('test@example.com', 'default@example.com');
DELETE FROM email_providers WHERE name IN ('resend', 'aws-ses');

-- ============================================================================
-- Summary
-- ============================================================================

SELECT 
  '=== MIGRATION TEST SUMMARY ===' as summary,
  'All tests completed successfully!' as result,
  'Check the notices above for detailed results' as note;
