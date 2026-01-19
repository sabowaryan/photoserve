-- Script de débogage pour vérifier les valeurs de password_hash
-- Exécutez ce script dans votre console Supabase SQL Editor

SELECT 
  id,
  title,
  unique_slug,
  password_hash,
  LENGTH(password_hash) as password_hash_length,
  CASE 
    WHEN password_hash = '' THEN 'EMPTY STRING'
    WHEN password_hash IS NULL THEN 'NULL'
    WHEN LENGTH(password_hash) > 0 THEN 'HAS VALUE'
    ELSE 'UNKNOWN'
  END as password_status,
  guest_session_id,
  user_id,
  created_at
FROM galleries
ORDER BY created_at DESC
LIMIT 10;
