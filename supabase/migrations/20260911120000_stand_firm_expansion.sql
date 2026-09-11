-- STAND FIRM expansion: chapters/levels architecture, branching fields, world binding
-- Additive / backward compatible. Does not delete existing progress.

-- ---------------------------------------------------------------------------
-- Schema expansion (scenarios)
-- ---------------------------------------------------------------------------
ALTER TABLE public.game_scenarios
  ADD COLUMN IF NOT EXISTS level_number integer,
  ADD COLUMN IF NOT EXISTS npc_id text,
  ADD COLUMN IF NOT EXISTS map_id text,
  ADD COLUMN IF NOT EXISTS spawn_x real,
  ADD COLUMN IF NOT EXISTS spawn_z real,
  ADD COLUMN IF NOT EXISTS prerequisite_scenario_id text,
  ADD COLUMN IF NOT EXISTS required_choice_id text,
  ADD COLUMN IF NOT EXISTS required_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scripture_references text[];

UPDATE public.game_scenarios
SET level_number = COALESCE(level_number, sort_order),
    npc_id = COALESCE(npc_id, lower(regexp_replace(coalesce(npc_name, 'npc'), '[^a-zA-Z0-9]+', '-', 'g'))),
    map_id = COALESCE(
      map_id,
      CASE map_spot
        WHEN 'market' THEN 'market_district'
        WHEN 'school' THEN 'school_yard'
        ELSE 'village_center'
      END
    ),
    spawn_x = COALESCE(
      spawn_x,
      CASE map_spot
        WHEN 'market' THEN 220
        WHEN 'school' THEN 760
        ELSE 480
      END
    ),
    spawn_z = COALESCE(
      spawn_z,
      CASE map_spot
        WHEN 'market' THEN 400
        WHEN 'school' THEN 380
        ELSE 220
      END
    )
WHERE level_number IS NULL
   OR npc_id IS NULL
   OR map_id IS NULL
   OR spawn_x IS NULL
   OR spawn_z IS NULL;

ALTER TABLE public.game_scenarios
  ALTER COLUMN level_number SET DEFAULT 1,
  ALTER COLUMN map_id SET DEFAULT 'village_center';

CREATE INDEX IF NOT EXISTS idx_game_scenarios_chapter_level
  ON public.game_scenarios(chapter, level_number);

CREATE INDEX IF NOT EXISTS idx_game_scenarios_map
  ON public.game_scenarios(map_id);

-- ---------------------------------------------------------------------------
-- Schema expansion (choices — branching)
-- ---------------------------------------------------------------------------
ALTER TABLE public.game_choices
  ADD COLUMN IF NOT EXISTS next_scenario_id text,
  ADD COLUMN IF NOT EXISTS flags_granted jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- Schema expansion (player decision flags)
-- ---------------------------------------------------------------------------
ALTER TABLE public.game_profiles
  ADD COLUMN IF NOT EXISTS decision_flags jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ---------------------------------------------------------------------------
-- Achievements (expanded)
-- ---------------------------------------------------------------------------
INSERT INTO public.game_achievements (id, name, description) VALUES
  ('chapter_1', 'Standing Firm', 'Finished Chapter 1 — Standing Firm.'),
  ('chapter_2', 'Truth Walker', 'Finished Chapter 2 — Truth & Integrity.'),
  ('chapter_3', 'Courage Under Pressure', 'Finished Chapter 3 — Peer Pressure.'),
  ('truth_teller', 'Truth Teller', 'Completed truth and integrity scenarios.'),
  ('courage_under_pressure', 'Courage Under Pressure', 'Stood firm through peer-pressure challenges.'),
  ('humble_heart', 'Humble Heart', 'Completed humility-related scenarios.'),
  ('faithful_steward', 'Faithful Steward', 'Completed stewardship scenarios.'),
  ('forgiving_heart', 'Forgiving Heart', 'Completed forgiveness scenarios.'),
  ('stand_firm', 'STAND FIRM', 'Completed the STAND FIRM journey content available in this release.')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Update Chapter 1 original scenarios with world binding + level numbers
-- ---------------------------------------------------------------------------
UPDATE public.game_scenarios SET
  level_number = 1, npc_id = 'jordan', map_id = 'village_center',
  spawn_x = 480, spawn_z = 220, map_spot = 'square'
WHERE id = 'peer-pressure-01';

UPDATE public.game_scenarios SET
  level_number = 2, npc_id = 'mira', map_id = 'village_center',
  spawn_x = 220, spawn_z = 400, map_spot = 'market',
  prerequisite_scenario_id = 'peer-pressure-01'
WHERE id = 'honesty-01';

UPDATE public.game_scenarios SET
  level_number = 3, npc_id = 'eli', map_id = 'village_center',
  spawn_x = 760, spawn_z = 380, map_spot = 'school',
  prerequisite_scenario_id = 'honesty-01'
WHERE id = 'integrity-01';

-- ---------------------------------------------------------------------------
-- Chapter 1 levels 4–5 + Chapters 2–3 scenarios
-- Application seed (lib/game/content) remains authoritative fallback.
-- ---------------------------------------------------------------------------
INSERT INTO public.game_scenarios (
  id, chapter, sort_order, level_number, theme, title, situation, scripture_reference,
  explanation, reflection_prompt, npc_name, npc_id, map_spot, map_id, spawn_x, spawn_z,
  prerequisite_scenario_id, is_active
) VALUES
(
  'gossip-01', 1, 4, 4, 'gossip', 'The Private Message',
  'A friend shows you a private message meant to embarrass someone who is not present. They ask you to forward it to the group chat. ''It is only a joke,'' they say, ''and everyone will forget tomorrow.''',
  'Ephesians 4:29',
  'Words can build up or tear down. Sharing a private humiliation may feel like belonging in the moment, but it multiplies harm. Scripture calls believers to speech that gives grace to those who hear — including people who are not in the room.',
  'How do you decide whether a ''joke'' about someone is actually kindness or harm?',
  'Sam', 'sam', 'square', 'village_center', 340, 300, 'integrity-01', true
),
(
  'integrity-test-01', 1, 5, 5, 'integrity', 'The Difficult Truth',
  'A village leader asks whether you know who started a rumor that hurt a younger student. You know the answer involves people you care about. Staying quiet would keep your friendships comfortable. Speaking truthfully may cost you socially.',
  'Zechariah 8:16',
  'Chapter 1 ends where integrity becomes costly. Truth-telling is not cruelty; silence that protects harm is not kindness. God calls His people to speak truth to one another — carefully, without revenge, and with a desire to restore rather than destroy.',
  'When truth and comfort conflict, which one usually wins in your life — and why?',
  'Ruth', 'ruth', 'square', 'village_center', 600, 260, 'gossip-01', true
),
(
  'truth-01', 2, 1, 6, 'truth', 'The Missing Credit',
  'A project you helped finish is praised in the market square. The leader names only your teammate. Your teammate stays silent. Correcting them would feel awkward; staying silent would leave the record incomplete.',
  'Proverbs 27:2',
  'Seeking praise can become pride, yet hiding the truth can become false humility that lets another carry a false story. Wisdom asks for honest credit without self-exaltation — and for teammates who will not steal what they did not earn.',
  'How can you seek truth about credit without making the moment about your ego?',
  'Noah', 'noah', 'market', 'market_district', 260, 280, 'integrity-test-01', true
),
(
  'truth-02', 2, 2, 7, 'honesty', 'The Hidden Mistake',
  'While helping at a stall, you accidentally damage a display item. No one saw it. Reporting it means paying from your own money. Hiding it means someone else may be blamed later.',
  'Psalm 15:2',
  'Walking blamelessly includes owning what we break. Confession can be costly in the short term, but hidden faults often expand into larger injustices when blame falls on the wrong person.',
  'What makes admitting a quiet mistake feel so hard?',
  'Leah', 'leah', 'market', 'market_district', 700, 320, 'truth-01', true
),
(
  'truth-03', 2, 3, 8, 'academic_integrity', 'Borrowed Words',
  'You are asked to present a short speech. A friend offers a polished script that won praise last year and says, ''Just change a few lines. No one will remember.'' Using it would save hours.',
  'Colossians 3:9',
  'Presenting another person''s work as your own is a form of falsehood. Diligence and honesty honor God more than impressive words that are not yours.',
  'Where is the line between learning from others and claiming their work as yours?',
  'Caleb', 'caleb', 'square', 'market_district', 480, 200, 'truth-02', true
),
(
  'truth-04', 2, 4, 9, 'honesty', 'The Softened Report',
  'A supervisor asks you to report how many supplies remain. The real number is low. A higher number would keep everyone calm for one more week. Your supervisor suggests, ''Round it up. We will fix it later.''',
  'Proverbs 12:19',
  'False numbers create false security. Temporary comfort built on inaccurate reports often delays needed help and shifts pain onto others. Truthful lips endure; lying reports eventually collapse.',
  'Have you ever softened a report to avoid short-term conflict? What happened later?',
  'Hannah', 'hannah', 'market', 'market_district', 180, 420, 'truth-03', true
),
(
  'truth-test-01', 2, 5, 10, 'truth', 'Truth Under Pressure',
  'A visiting inspector asks who authorized an unsafe shortcut in the market storeroom. The person responsible is a mentor who helped you. They quietly ask you to keep their name out of it ''just this once,'' promising it will never happen again.',
  'Proverbs 28:13',
  'Loyalty becomes corrupted when it asks you to hide harm. Covering sin protects comfort, not people. Chapter 2''s final challenge asks whether truth still matters when the person you respect wants silence.',
  'How do you show loyalty to a mentor without joining them in covering wrong?',
  'Isaiah', 'isaiah', 'market', 'market_district', 620, 450, 'truth-04', true
),
(
  'pressure-01', 3, 1, 11, 'peer_pressure', 'The After-Class Dare',
  'After lessons, classmates dare you to mock a quiet student''s project in front of everyone. They say it is tradition and that refusing means you think you are better than the group.',
  'Romans 12:2',
  'Fitting in is not the same as being transformed. Groups can normalize cruelty by calling it tradition. Faithfulness may look like stepping out of a pattern others refuse to question.',
  'Which ''traditions'' in your circles might actually be pressure to harm?',
  'Talia', 'talia', 'school', 'school_yard', 300, 260, 'truth-test-01', true
),
(
  'pressure-02', 3, 2, 12, 'peer_pressure', 'The Exclusive Invite',
  'A popular circle invites you to an evening gathering — if you stop spending time with a friend they call ''awkward.'' They frame it as ''just being selective.''',
  'James 2:1',
  'Favoritism dressed as social strategy still wounds image-bearers of God. Belonging that requires discarding a friend is a costly ticket. Scripture warns against judging people by status and popularity.',
  'Have you ever been asked to drop someone to keep a social place? What did you do?',
  'Marcus', 'marcus', 'school', 'school_yard', 680, 300, 'pressure-01', true
),
(
  'pressure-03', 3, 3, 13, 'temptation', 'The Shared Shortcut',
  'Before a timed challenge, several classmates share a prohibited device that gives answers. They say, ''Everyone who matters is using it. Teachers never check this corner.''',
  '1 Corinthians 10:13',
  'Common practice does not make a practice righteous. Temptation often argues from majority and secrecy. God provides ways to endure — including the courage to lose an unfair advantage.',
  'When ''everyone is doing it,'' what helps you remember that majority is not morality?',
  'Priya', 'priya', 'school', 'school_yard', 420, 420, 'pressure-02', true
),
(
  'pressure-04', 3, 4, 14, 'peer_pressure', 'The Silent Majority',
  'In a group discussion, a false rumor about a teacher spreads. Most students nod along. One student looks uneasy but says nothing. The leader asks, ''We all agree, right?'' Eyes turn toward you.',
  'Proverbs 18:17',
  'The first story sounds convincing until another is heard. A silent majority can still be wrong. Standing firm may mean asking for fairness when agreement is being assumed, not proven.',
  'What stops you from speaking when a group treats an unverified story as fact?',
  'Daniel', 'daniel', 'school', 'school_yard', 560, 220, 'pressure-03', true
),
(
  'pressure-test-01', 3, 5, 15, 'peer_pressure', 'Standing Alone',
  'The popular group plans a public prank that will humiliate a staff member who once corrected them. They say anyone who reports it is a traitor. You know when and where it will happen. Staying silent keeps your place. Warning someone may leave you standing alone.',
  'Joshua 1:9',
  'Chapter 3 culminates in lonely courage. Seeking approval from people can become a master. Faithfulness is not reckless confrontation; it is refusing to partner with planned humiliation — even when courage feels isolating. God does not measure your worth by your social rank in a crowd.',
  'If standing firm meant losing a social place for a week, would you still do it? Why or why not?',
  'Grace', 'grace', 'school', 'school_yard', 480, 360, 'pressure-04', true
)
ON CONFLICT (id) DO UPDATE SET
  chapter = EXCLUDED.chapter,
  sort_order = EXCLUDED.sort_order,
  level_number = EXCLUDED.level_number,
  theme = EXCLUDED.theme,
  title = EXCLUDED.title,
  situation = EXCLUDED.situation,
  scripture_reference = EXCLUDED.scripture_reference,
  explanation = EXCLUDED.explanation,
  reflection_prompt = EXCLUDED.reflection_prompt,
  npc_name = EXCLUDED.npc_name,
  npc_id = EXCLUDED.npc_id,
  map_spot = EXCLUDED.map_spot,
  map_id = EXCLUDED.map_id,
  spawn_x = EXCLUDED.spawn_x,
  spawn_z = EXCLUDED.spawn_z,
  prerequisite_scenario_id = EXCLUDED.prerequisite_scenario_id,
  is_active = EXCLUDED.is_active;

-- Choice seeds for new scenarios (idempotent). Full choice text mirrors lib/game/content.
INSERT INTO public.game_choices (id, scenario_id, sort_order, choice_text, consequence, is_preferred, xp_reward, flags_granted, next_scenario_id) VALUES
  ('gossip-01-a', 'gossip-01', 1, 'Forward it. You do not want to seem boring.', 'The message spreads quickly. Later you see the person''s face and realize laughter can leave a lasting bruise.', false, 10, '["spread_private_message"]'::jsonb, NULL),
  ('gossip-01-b', 'gossip-01', 2, 'Laugh quietly but do not forward it.', 'You avoid spreading it, yet your silence still signals approval. Sometimes faithfulness requires a clear no.', false, 16, '[]'::jsonb, NULL),
  ('gossip-01-c', 'gossip-01', 3, 'Refuse to share it and ask them to delete it.', 'The moment feels awkward, but you protect someone''s dignity. Courage often looks like a quiet refusal.', true, 32, '["protected_private_dignity"]'::jsonb, 'integrity-test-01'),
  ('integrity-test-01-a', 'integrity-test-01', 1, 'Protect your friends and say you know nothing.', 'The leader walks away without help. The younger student remains wounded, and your comfort feels thinner than you expected.', false, 12, '["hid_truth_from_leader"]'::jsonb, NULL),
  ('integrity-test-01-b', 'integrity-test-01', 2, 'Hint vaguely without naming anyone.', 'You give partial help while avoiding the hardest part. Half-truths often leave both justice and friendship unfinished.', false, 20, '[]'::jsonb, NULL),
  ('integrity-test-01-c', 'integrity-test-01', 3, 'Tell the truth carefully, seeking repair rather than revenge.', 'Some friendships cool. The leader can protect the student. You practice integrity that seeks healing, not status.', true, 40, '["spoke_costly_truth"]'::jsonb, NULL),
  ('truth-01-a', 'truth-01', 1, 'Publicly demand recognition right away.', 'You may get credit, but the confrontation damages trust. Truth spoken only to win applause can still wound.', false, 12, '[]'::jsonb, NULL),
  ('truth-01-b', 'truth-01', 2, 'Say nothing and resent them privately.', 'Silence grows into bitterness. Unspoken truth often becomes a heavier burden than a careful conversation.', false, 16, '["swallowed_credit_resentment"]'::jsonb, NULL),
  ('truth-01-c', 'truth-01', 3, 'Speak privately with your teammate and seek an honest correction.', 'The conversation is tense, but honesty has a chance to repair the record without a public spectacle.', true, 34, '["sought_honest_credit"]'::jsonb, NULL),
  ('truth-02-a', 'truth-02', 1, 'Hide the damage and leave quickly.', 'You escape the cost for now. Later, another worker is questioned. Your relief turns into guilt.', false, 10, '["hid_market_damage"]'::jsonb, NULL),
  ('truth-02-b', 'truth-02', 2, 'Leave anonymous coins without explaining.', 'You try to fix the money problem without facing the relationship. Partial repair is better than none, but truth still matters.', false, 20, '[]'::jsonb, NULL),
  ('truth-02-c', 'truth-02', 3, 'Admit the mistake and offer to make it right.', 'The owner is surprised, then grateful. Honesty costs coins and earns trust that secrecy cannot buy.', true, 36, '["admitted_market_mistake"]'::jsonb, NULL),
  ('truth-03-a', 'truth-03', 1, 'Use the script and hope no one notices.', 'Applause feels hollow. You know the praise belongs to someone else''s labor.', false, 10, '["used_borrowed_speech"]'::jsonb, NULL),
  ('truth-03-b', 'truth-03', 2, 'Use parts of it without saying where it came from.', 'Partial honesty still misleads listeners about what you created. Integrity asks for clearer credit.', false, 18, '[]'::jsonb, NULL),
  ('truth-03-c', 'truth-03', 3, 'Thank them, then write your own words honestly.', 'Your speech is simpler, but it is yours. Truthfulness leaves you freer than borrowed brilliance.', true, 36, '["wrote_own_words"]'::jsonb, NULL),
  ('truth-04-a', 'truth-04', 1, 'Inflate the number as suggested.', 'Calm lasts a few days. When supplies run out, trust in the report system breaks harder.', false, 12, '["inflated_supply_report"]'::jsonb, NULL),
  ('truth-04-b', 'truth-04', 2, 'Give a vague answer that avoids the real count.', 'You avoid a direct lie and avoid a direct truth. Ambiguity still leaves leaders unprepared.', false, 18, '[]'::jsonb, NULL),
  ('truth-04-c', 'truth-04', 3, 'Report the accurate count and explain the urgency.', 'The conversation is uncomfortable. Planning can begin. Honesty serves the community better than soothing fiction.', true, 38, '["accurate_supply_report"]'::jsonb, NULL),
  ('truth-test-01-a', 'truth-test-01', 1, 'Protect your mentor and deny knowing anything.', 'The unsafe practice continues. Your mentor''s relief feels like a debt you now share.', false, 14, '["covered_mentor"]'::jsonb, NULL),
  ('truth-test-01-b', 'truth-test-01', 2, 'Redirect the inspector without answering clearly.', 'You delay accountability. Partial evasion still leaves the storeroom dangerous.', false, 22, '[]'::jsonb, NULL),
  ('truth-test-01-c', 'truth-test-01', 3, 'Tell the truth and urge your mentor to take responsibility with you.', 'The relationship strains. Safety improves. Truthful loyalty seeks restoration, not cover-ups.', true, 42, '["truth_under_pressure"]'::jsonb, NULL),
  ('pressure-01-a', 'pressure-01', 1, 'Join the dare so you are not excluded.', 'You gain acceptance from the group. The quiet student withdraws. Later, a different opportunity for trust becomes harder to earn.', false, 12, '["joined_mocking_dare"]'::jsonb, 'pressure-02'),
  ('pressure-01-b', 'pressure-01', 2, 'Laugh along but do not speak the mockery yourself.', 'You feel safer than joining fully, yet your laughter still adds weight to the harm.', false, 18, '["laughed_at_dare"]'::jsonb, NULL),
  ('pressure-01-c', 'pressure-01', 3, 'Respectfully refuse and stand with the student.', 'You may feel isolated at first. Your refusal opens a quieter friendship and a different path through later pressure.', true, 36, '["refused_mocking_dare"]'::jsonb, NULL),
  ('pressure-02-a', 'pressure-02', 1, 'Accept and distance yourself from your friend.', 'The new circle feels exciting. Your friend notices. Later you realize acceptance bought with betrayal is unstable.', false, 12, '["dropped_friend_for_status"]'::jsonb, NULL),
  ('pressure-02-b', 'pressure-02', 2, 'Try to keep both groups without telling anyone.', 'You stretch yourself thin and become less honest with everyone. Dual loyalty without integrity eventually snaps.', false, 18, '[]'::jsonb, NULL),
  ('pressure-02-c', 'pressure-02', 3, 'Decline the condition and keep the friendship.', 'You lose a status invite. You keep a real friend. Integrity sometimes chooses the quieter table.', true, 36, '["kept_loyal_friendship"]'::jsonb, NULL),
  ('pressure-03-a', 'pressure-03', 1, 'Use the device so you are not left behind.', 'Your score rises. Your confidence in your own preparation falls. The shortcut trains dependence, not skill.', false, 12, '["used_prohibited_device"]'::jsonb, NULL),
  ('pressure-03-b', 'pressure-03', 2, 'Refuse for yourself but stay near the group using it.', 'You avoid direct cheating, yet remaining close can still look like endorsement and keep pressure alive.', false, 20, '[]'::jsonb, NULL),
  ('pressure-03-c', 'pressure-03', 3, 'Refuse, move away, and prepare without the device.', 'You may finish lower on the board. You keep a clear conscience and practice resisting majority temptation.', true, 38, '["refused_prohibited_device"]'::jsonb, NULL),
  ('pressure-04-a', 'pressure-04', 1, 'Agree with the group to keep the peace.', 'The rumor hardens. Peace bought by false agreement often costs someone''s reputation.', false, 12, '["agreed_with_false_rumor"]'::jsonb, NULL),
  ('pressure-04-b', 'pressure-04', 2, 'Stay silent and hope it passes.', 'You avoid conflict and also avoid courage. Silence can function as consent.', false, 18, '[]'::jsonb, NULL),
  ('pressure-04-c', 'pressure-04', 3, 'Ask for evidence and refuse to treat rumor as fact.', 'The mood cools. A few students look relieved. Truth-seeking can interrupt a crowd''s momentum.', true, 40, '["challenged_false_rumor"]'::jsonb, NULL),
  ('pressure-test-01-a', 'pressure-test-01', 1, 'Stay silent to keep your place in the group.', 'The prank proceeds. You keep short-term acceptance. A staff member is shamed, and your silence becomes part of the story.', false, 14, '["silent_during_prank"]'::jsonb, NULL),
  ('pressure-test-01-b', 'pressure-test-01', 2, 'Hint that they should be careful without clearly warning anyone.', 'You try to reduce harm without risking yourself fully. Ambiguous warnings often arrive too late.', false, 24, '[]'::jsonb, NULL),
  ('pressure-test-01-c', 'pressure-test-01', 3, 'Warn a trusted adult in time and accept the social cost.', 'You may stand alone for a season. Harm is prevented. Standing firm is not spiritual superiority — it is choosing faithfulness when approval is expensive.', true, 45, '["warned_to_prevent_harm"]'::jsonb, NULL)
ON CONFLICT (id) DO UPDATE SET
  choice_text = EXCLUDED.choice_text,
  consequence = EXCLUDED.consequence,
  is_preferred = EXCLUDED.is_preferred,
  xp_reward = EXCLUDED.xp_reward,
  flags_granted = EXCLUDED.flags_granted,
  next_scenario_id = EXCLUDED.next_scenario_id;

-- Refresh XP on original Chapter 1 choices to match seed curve (non-destructive)
UPDATE public.game_choices SET xp_reward = 8 WHERE id IN ('peer-pressure-01-a', 'honesty-01-a', 'integrity-01-a');
UPDATE public.game_choices SET xp_reward = 14 WHERE id IN ('peer-pressure-01-b', 'honesty-01-b');
UPDATE public.game_choices SET xp_reward = 18 WHERE id = 'integrity-01-b';
UPDATE public.game_choices SET xp_reward = 28 WHERE id IN ('peer-pressure-01-c', 'honesty-01-c');
UPDATE public.game_choices SET xp_reward = 30 WHERE id = 'integrity-01-c';

-- Branching FK after seeds so referenced scenarios exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'game_choices_next_scenario_fk'
  ) THEN
    ALTER TABLE public.game_choices
      ADD CONSTRAINT game_choices_next_scenario_fk
      FOREIGN KEY (next_scenario_id) REFERENCES public.game_scenarios(id)
      ON DELETE SET NULL;
  END IF;
END $$;
