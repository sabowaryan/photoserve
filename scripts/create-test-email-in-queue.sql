-- Create a test email directly in the queue
-- This bypasses the API to test the queue processing directly

INSERT INTO public.email_queue (
  from_address,
  to_address,
  subject,
  html_content,
  text_content,
  priority,
  type,
  status,
  retry_count,
  max_retries
) VALUES (
  'noreply@piksend.com',
  'sabowaryan@gmail.com',
  '[TEST] Direct Queue Test',
  '<html><body><h1>Test Email</h1><p>This email was created directly in the queue for testing.</p><p>Time: ' || NOW() || '</p></body></html>',
  'Test Email - This email was created directly in the queue for testing.',
  'high',
  'transactional',
  'pending',
  0,
  5
);

-- Show the created email
SELECT 
  id,
  from_address,
  to_address,
  subject,
  status,
  created_at
FROM public.email_queue
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 1;
