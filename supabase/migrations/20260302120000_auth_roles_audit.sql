-- Harvest Souls: roles extension, profile fields, audit logs, birthday support
-- Fixes recursive RLS on profiles (stack depth limit exceeded).
-- Run in Supabase SQL Editor if DATABASE_URL is not available.

-- 1) Super Admin role
INSERT INTO roles (name, description)
SELECT 'SUPER_ADMIN', 'Full system control: user management, stats, audit logs, and all content'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'SUPER_ADMIN');

-- 2) Extend profiles for birthdays, active flag, creator tracking
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_profiles_birthday_month
  ON profiles ((EXTRACT(MONTH FROM birthday)), (EXTRACT(DAY FROM birthday)))
  WHERE birthday IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON profiles(role_id);

-- 3) Audit logs (Super Admin only)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- 4) Role helpers that bypass RLS (avoids infinite recursion on profiles policies)
CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT r.name
  FROM profiles p
  JOIN roles r ON r.id = p.role_id
  WHERE p.id = auth.uid()
    AND COALESCE(p.is_active, true) = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT COALESCE(public.current_role_name() = 'SUPER_ADMIN', false);
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT COALESCE(public.current_role_name() IN ('SUPER_ADMIN', 'ADMIN', 'EDITOR'), false);
$$;

REVOKE ALL ON FUNCTION public.current_role_name() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_role_name() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, anon;

-- 5) Reset profiles RLS (drop recursive policies)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
  END LOOP;
END $$;

-- Authenticated users can read active profiles (for birthdays/directory) and always their own
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR COALESCE(is_active, true) = true
    OR public.is_super_admin()
  );

CREATE POLICY "profiles_update_self_or_super"
  ON profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_super_admin())
  WITH CHECK (id = auth.uid() OR public.is_super_admin());

CREATE POLICY "profiles_insert_super"
  ON profiles FOR INSERT
  WITH CHECK (public.is_super_admin());

-- 6) RLS: audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON audit_logs', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "audit_logs_super_select"
  ON audit_logs FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "audit_logs_staff_insert"
  ON audit_logs FOR INSERT
  WITH CHECK (public.is_staff() AND actor_id = auth.uid());

-- 7) Content: ensure public read + staff write
DO $$
DECLARE
  t text;
  pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY['posts', 'announcements', 'events', 'sermons', 'media', 'songs']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, t);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (true)',
      t || '_public_read', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())',
      t || '_staff_write', t
    );
  END LOOP;
END $$;

-- 8) roles: public can read role names (needed for joins)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON roles', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "roles_public_read" ON roles FOR SELECT USING (true);
CREATE POLICY "roles_super_write" ON roles FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
