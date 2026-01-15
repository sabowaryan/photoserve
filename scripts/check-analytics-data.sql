-- Script pour vérifier les données analytics dans la base de données

-- 1. Voir les dernières vues trackées
SELECT 
  ga.id,
  g.title as gallery_title,
  ga.visitor_ip,
  ga.country_code,
  ga.user_agent,
  ga.viewed_at
FROM gallery_analytics ga
JOIN galleries g ON g.id = ga.gallery_id
ORDER BY ga.viewed_at DESC
LIMIT 10;

-- 2. Compter les vues avec et sans country_code
SELECT 
  COUNT(*) as total_views,
  COUNT(country_code) as views_with_country,
  COUNT(*) - COUNT(country_code) as views_without_country
FROM gallery_analytics;

-- 3. Voir la distribution par pays
SELECT 
  country_code,
  COUNT(*) as view_count
FROM gallery_analytics
WHERE country_code IS NOT NULL
GROUP BY country_code
ORDER BY view_count DESC;

-- 4. Voir les IPs trackées (pour debug)
SELECT 
  visitor_ip,
  country_code,
  COUNT(*) as view_count
FROM gallery_analytics
GROUP BY visitor_ip, country_code
ORDER BY view_count DESC
LIMIT 20;
