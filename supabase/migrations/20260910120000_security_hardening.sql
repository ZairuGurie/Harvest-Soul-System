-- Security hardening before game tables:
-- 1) Prevent privilege escalation via profiles self-update (role_id / is_active / created_by)
-- 2) Restrict church_birthdays writes to staff
-- Safe / idempotent.

-- ---------------------------------------------------------------------------
-- 1) Profiles: lock sensitive columns for non–super-admins
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Super admins may change anything.
  IF public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  -- Non–super-admins cannot escalate or deactivate themselves via client update.
  NEW.role_id := OLD.role_id;
  NEW.is_active := OLD.is_active;
  NEW.created_by := OLD.created_by;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_sensitive_columns ON public.profiles;
CREATE TRIGGER trg_guard_profile_sensitive_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.guard_profile_sensitive_columns();

REVOKE ALL ON FUNCTION public.guard_profile_sensitive_columns() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 2) church_birthdays: staff write only (public may still read active rows)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can manage church birthdays" ON public.church_birthdays;
DROP POLICY IF EXISTS "church_birthdays_staff_write" ON public.church_birthdays;

CREATE POLICY "church_birthdays_staff_write"
  ON public.church_birthdays
  FOR ALL
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());
