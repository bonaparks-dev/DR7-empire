-- 🔒 DR7 EMPIRE - SUPABASE RLS POLICY FIX
-- Exécuter ce script dans Supabase SQL Editor

-- ===================================
-- ÉTAPE 1: DIAGNOSTIC ACTUEL
-- ===================================

-- Vérifier si la table vehicles existe
SELECT 
  schemaname, 
  tablename, 
  tableowner, 
  hasindexes, 
  hasrules, 
  hastriggers
FROM pg_tables 
WHERE tablename = 'vehicles';

-- Vérifier les policies existantes
SELECT 
  schemaname,
  tablename, 
  policyname, 
  roles, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'vehicles';

-- Vérifier les données de test
SELECT 
  COUNT(*) as total_vehicles,
  COUNT(CASE WHEN category = 'urban' THEN 1 END) as urban_vehicles,
  COUNT(CASE WHEN category = 'exotic' THEN 1 END) as exotic_vehicles,
  COUNT(CASE WHEN status = 'available' THEN 1 END) as available_vehicles
FROM vehicles;

-- ===================================
-- ÉTAPE 2: FIX RLS POLICIES  
-- ===================================

-- Activer RLS sur la table vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Supprimer anciennes policies (si elles existent)
DROP POLICY IF EXISTS "public_read_all_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_public_read" ON public.vehicles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.vehicles;

-- Créer la policy principale pour lecture publique
CREATE POLICY "public_read_all_vehicles"
  ON public.vehicles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ===================================
-- ÉTAPE 3: VÉRIFICATION FINALE
-- ===================================

-- Tester l'accès en tant qu'utilisateur anonyme
SET ROLE anon;

-- Cette requête devrait fonctionner
SELECT id, display_name, category, status 
FROM vehicles 
WHERE status != 'retired'
LIMIT 5;

-- Test spécifique urban cars (Chrome issue)
SELECT COUNT(*) as urban_cars_count
FROM vehicles 
WHERE category = 'urban' AND status != 'retired';

-- Restaurer le rôle admin
RESET ROLE;

-- ===================================
-- ÉTAPE 4: RÉSULTATS ATTENDUS
-- ===================================

-- Si tout fonctionne, vous devriez voir :
-- 1. Tables: vehicles existe
-- 2. Policies: "public_read_all_vehicles" active
-- 3. Data test: > 0 véhicules urbains
-- 4. Access test: SELECT fonctionne en mode anon

-- ===================================
-- ÉTAPE 5: LOGS DE DEBUGGING (OPTIONNEL)
-- ===================================

-- En cas de problème, vérifier les logs
SELECT 
  log_time,
  database_name,
  message
FROM pg_stat_statements 
WHERE query LIKE '%vehicles%'
ORDER BY log_time DESC
LIMIT 10;

-- Vérifier les connexions actives
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity 
WHERE datname = current_database()
AND state = 'active';

-- ===================================
-- CONFIRMATION FINALE
-- ===================================

SELECT 
  '✅ RLS SETUP COMPLETE' as status,
  COUNT(*) as total_vehicles,
  COUNT(CASE WHEN category = 'urban' THEN 1 END) as urban_vehicles
FROM vehicles;