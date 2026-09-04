-- Minimal fix: add birthday + related profile columns used by User Management.
-- Run this in Supabase Dashboard → SQL Editor → New query → Run.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_profiles_birthday_month
  ON profiles ((EXTRACT(MONTH FROM birthday)), (EXTRACT(DAY FROM birthday)))
  WHERE birthday IS NOT NULL;

-- Optional: full auth helpers + audit (recommended). If this fails on existing objects, the columns above are still enough for birthdays.
-- Then also run: supabase/migrations/20260302120000_auth_roles_audit.sql
