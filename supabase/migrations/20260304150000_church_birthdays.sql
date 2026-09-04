-- Church member / family birthdays (no account required).
-- Run in Supabase Dashboard → SQL Editor if not applied via CLI.

CREATE TABLE IF NOT EXISTS public.church_birthdays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  birthday date NOT NULL,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_church_birthdays_month_day
  ON public.church_birthdays (
    (EXTRACT(MONTH FROM birthday)),
    (EXTRACT(DAY FROM birthday))
  )
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_church_birthdays_active
  ON public.church_birthdays (is_active, birthday);

ALTER TABLE public.church_birthdays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active church birthdays" ON public.church_birthdays;
CREATE POLICY "Public can read active church birthdays"
  ON public.church_birthdays
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated can manage church birthdays" ON public.church_birthdays;
CREATE POLICY "Authenticated can manage church birthdays"
  ON public.church_birthdays
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.church_birthdays IS
  'Birthdays for church members and families. Does not require a user account.';
