-- Script de débogage pour vérifier les settings de la galerie
-- Exécutez ce script dans votre console Supabase SQL Editor

SELECT 
  g.id,
  g.title,
  g.unique_slug,
  g.settings,
  g.settings->>'videoCoverUrl' as video_cover_url,
  g.settings->>'audioUrl' as audio_url,
  g.settings->>'enableComments' as enable_comments,
  g.settings->>'enableFavorites' as enable_favorites,
  g.settings->>'enableLeadMagnet' as enable_lead_magnet,
  p.subscription_plan as owner_plan,
  g.user_id
FROM galleries g
LEFT JOIN profiles p ON g.user_id = p.id
WHERE g.unique_slug = 'kc9dqfrr'  -- Remplacez par votre slug
ORDER BY g.created_at DESC;

-- Vérifier aussi le format JSON complet des settings
SELECT 
  id,
  title,
  jsonb_pretty(settings) as settings_formatted
FROM galleries
WHERE unique_slug = 'kc9dqfrr';  -- Remplacez par votre slug
