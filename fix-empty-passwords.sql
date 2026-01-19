-- Script pour corriger les galeries avec des mots de passe vides hashés
-- Ce script identifie et corrige les galeries qui ont un hash bcrypt d'une chaîne vide
-- et les remplace par une chaîne vide pour indiquer "pas de mot de passe"

-- ATTENTION: Ce script va modifier les données existantes
-- Assurez-vous de faire une sauvegarde avant de l'exécuter

-- Étape 1: Identifier les galeries potentiellement affectées
-- (Celles créées récemment qui pourraient avoir un hash de chaîne vide)
SELECT 
  id,
  title,
  unique_slug,
  password_hash,
  LENGTH(password_hash) as hash_length,
  created_at
FROM galleries
WHERE LENGTH(password_hash) = 60  -- Longueur typique d'un hash bcrypt
ORDER BY created_at DESC;

-- Étape 2: Pour corriger manuellement une galerie spécifique sans mot de passe
-- Remplacez 'GALLERY_ID_HERE' par l'ID de la galerie
-- UPDATE galleries 
-- SET password_hash = ''
-- WHERE id = 'GALLERY_ID_HERE';

-- Étape 3: Vérifier le résultat
-- SELECT id, title, password_hash, LENGTH(password_hash) as hash_length
-- FROM galleries
-- WHERE id = 'GALLERY_ID_HERE';

-- NOTE: Il n'est pas possible de détecter automatiquement si un hash bcrypt
-- correspond à une chaîne vide sans tester chaque hash, ce qui serait très lent.
-- Vous devez identifier manuellement les galeries qui ne devraient pas avoir de mot de passe
-- et les mettre à jour individuellement.
