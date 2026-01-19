-- Correction de la galerie "Belle monde" pour supprimer la protection par mot de passe
-- Cette galerie a actuellement un hash bcrypt mais ne devrait pas avoir de mot de passe

UPDATE galleries 
SET password_hash = ''
WHERE id = '679af0dc-5494-4b57-b684-0eee8719ff91'
  AND title = 'Belle monde';

-- Vérification du résultat
SELECT 
  id,
  title,
  unique_slug,
  password_hash,
  LENGTH(password_hash) as hash_length,
  CASE 
    WHEN password_hash = '' THEN '✅ PAS DE MOT DE PASSE'
    WHEN LENGTH(password_hash) > 0 THEN '🔒 PROTÉGÉ PAR MOT DE PASSE'
    ELSE '❓ ÉTAT INCONNU'
  END as status
FROM galleries
WHERE id = '679af0dc-5494-4b57-b684-0eee8719ff91';
