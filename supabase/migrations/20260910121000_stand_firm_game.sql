-- STAND FIRM — Christian choice adventure game tables + RLS + seed content
-- Requires: profiles, public.is_staff(), public.is_super_admin()

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  current_chapter integer NOT NULL DEFAULT 1 CHECK (current_chapter >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.game_scenarios (
  id text PRIMARY KEY,
  chapter integer NOT NULL DEFAULT 1 CHECK (chapter >= 1),
  sort_order integer NOT NULL DEFAULT 0,
  theme text NOT NULL,
  title text NOT NULL,
  situation text NOT NULL,
  scripture_reference text NOT NULL,
  explanation text NOT NULL,
  reflection_prompt text NOT NULL,
  npc_name text,
  map_spot text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.game_choices (
  id text PRIMARY KEY,
  scenario_id text NOT NULL REFERENCES public.game_scenarios(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  choice_text text NOT NULL,
  consequence text NOT NULL,
  is_preferred boolean NOT NULL DEFAULT false,
  xp_reward integer NOT NULL DEFAULT 0 CHECK (xp_reward >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_choices_scenario ON public.game_choices(scenario_id);

CREATE TABLE IF NOT EXISTS public.game_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scenario_id text NOT NULL REFERENCES public.game_scenarios(id) ON DELETE CASCADE,
  choice_id text NOT NULL REFERENCES public.game_choices(id) ON DELETE CASCADE,
  xp_earned integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scenario_id)
);

CREATE INDEX IF NOT EXISTS idx_game_progress_user ON public.game_progress(user_id);

CREATE TABLE IF NOT EXISTS public.game_achievements (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.game_player_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES public.game_achievements(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_game_player_achievements_user
  ON public.game_player_achievements(user_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.game_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_player_achievements ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
  pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'game_profiles',
    'game_scenarios',
    'game_choices',
    'game_progress',
    'game_achievements',
    'game_player_achievements'
  ]
  LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- Content: public read active scenarios/choices/achievements; staff write
CREATE POLICY "game_scenarios_public_read"
  ON public.game_scenarios FOR SELECT
  USING (is_active = true OR public.is_staff());

CREATE POLICY "game_scenarios_staff_write"
  ON public.game_scenarios FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "game_choices_public_read"
  ON public.game_choices FOR SELECT USING (true);

CREATE POLICY "game_choices_staff_write"
  ON public.game_choices FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "game_achievements_public_read"
  ON public.game_achievements FOR SELECT USING (true);

CREATE POLICY "game_achievements_staff_write"
  ON public.game_achievements FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Player data: own rows only for SELECT. Mutations go through server (service role).
CREATE POLICY "game_profiles_select_own"
  ON public.game_profiles FOR SELECT
  USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "game_progress_select_own"
  ON public.game_progress FOR SELECT
  USING (user_id = auth.uid() OR public.is_super_admin());

CREATE POLICY "game_player_achievements_select_own"
  ON public.game_player_achievements FOR SELECT
  USING (user_id = auth.uid() OR public.is_super_admin());

-- No INSERT/UPDATE/DELETE policies for player tables for authenticated clients.
-- Server actions / API use the service role after validating choice IDs.

-- ---------------------------------------------------------------------------
-- Seed content (idempotent)
-- ---------------------------------------------------------------------------
INSERT INTO public.game_achievements (id, name, description) VALUES
  ('first_stand', 'First Stand', 'Completed your first STAND FIRM scenario.'),
  ('peer_pressure', 'Unmoved', 'Stood firm under peer pressure.'),
  ('honest_heart', 'Honest Heart', 'Chose honesty when it cost something.'),
  ('chapter_one', 'Village Path', 'Completed every Chapter 1 scenario.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.game_scenarios (
  id, chapter, sort_order, theme, title, situation, scripture_reference,
  explanation, reflection_prompt, npc_name, map_spot, is_active
) VALUES
(
  'peer-pressure-01',
  1, 1, 'peer_pressure', 'The Shortcut',
  'Your friends gather near the village square and urge you to join a plan that would hurt another person''s reputation for a laugh. They say everyone is doing it and you will look weak if you refuse.',
  'Proverbs 1:10',
  'Friendship is a gift, but true friends do not require you to abandon what is right. Standing firm may feel lonely for a moment, yet integrity builds trust that shortcuts cannot give. God invites us to refuse invitations to harm others, even when the crowd insists.',
  'Where in your life do you feel pressure to go along with something you know is wrong?',
  'Jordan', 'square', true
),
(
  'honesty-01',
  1, 2, 'honesty', 'Extra Change',
  'At the market stall you are handed more money back than you should receive. No one else notices. Keeping it would be easy, and you could use the extra coins.',
  'Proverbs 11:1',
  'Honesty is not only about big decisions. Small private moments reveal the direction of the heart. Returning what is not yours honors God and protects both your conscience and the other person''s livelihood.',
  'What would help you choose honesty when no one is watching?',
  'Mira', 'market', true
),
(
  'integrity-01',
  1, 3, 'academic_integrity', 'The Easy Answer',
  'Before a community quiz that matters for a scholarship recommendation, a classmate offers you the answer sheet. They say the leaders will never know and that you deserve the help.',
  'Proverbs 12:22',
  'Integrity means telling the truth with your actions as well as your words. A reward gained by deceit is fragile. Choosing fairness may cost short-term advantage, but it keeps your character whole before God and others.',
  'Why might a quick dishonest win become a heavier burden later?',
  'Eli', 'school', true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.game_choices (id, scenario_id, sort_order, choice_text, consequence, is_preferred, xp_reward) VALUES
  (
    'peer-pressure-01-a', 'peer-pressure-01', 1,
    'Join them so you will not be rejected.',
    'You feel included for a moment, but unease follows. Participating in harm distances you from the kind of friendship God values.',
    false, 5
  ),
  (
    'peer-pressure-01-b', 'peer-pressure-01', 2,
    'Stay silent and go along without speaking up.',
    'Silence can look peaceful, yet it can also allow harm to continue. Avoiding conflict is not the same as standing for what is right.',
    false, 10
  ),
  (
    'peer-pressure-01-c', 'peer-pressure-01', 3,
    'Respectfully refuse and stand by what you know is right.',
    'Some friends pull away, but your conscience is clear. You leave room for better friendship built on respect rather than pressure.',
    true, 25
  ),
  (
    'honesty-01-a', 'honesty-01', 1,
    'Keep the extra money. They will never notice.',
    'The coins feel heavier than they should. A private gain can still wound trust and dull your sensitivity to truth.',
    false, 5
  ),
  (
    'honesty-01-b', 'honesty-01', 2,
    'Walk away quickly so you do not have to decide.',
    'Avoiding the decision leaves the wrong uncorrected. Honesty often requires a small, clear action.',
    false, 10
  ),
  (
    'honesty-01-c', 'honesty-01', 3,
    'Return the extra change and explain the mistake.',
    'The seller is grateful. You keep a clean conscience and practice faithfulness in a quiet moment.',
    true, 25
  ),
  (
    'integrity-01-a', 'integrity-01', 1,
    'Take the answers. You need every advantage.',
    'Fear of missing out pushes you toward deceit. The score may rise, but your peace and credibility fall.',
    false, 5
  ),
  (
    'integrity-01-b', 'integrity-01', 2,
    'Decline the sheet but stay quiet about the offer.',
    'You avoid cheating yourself, yet the unfair system continues. Sometimes integrity also means protecting others from harm when you can do so wisely.',
    false, 15
  ),
  (
    'integrity-01-c', 'integrity-01', 3,
    'Refuse the answers and prepare honestly.',
    'You choose a harder path that keeps your word trustworthy. Real readiness matters more than a stolen score.',
    true, 25
  )
ON CONFLICT (id) DO NOTHING;
