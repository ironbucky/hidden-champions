-- Category-tagged champion reputation
CREATE TABLE IF NOT EXISTS public.champion_reputation (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  reputation_points int NOT NULL DEFAULT 0,
  answered_count int NOT NULL DEFAULT 0,
  confirmed_count int NOT NULL DEFAULT 0,
  rejected_count int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_champion_reputation_category ON public.champion_reputation(category_id);

-- Reputation event log
CREATE TABLE IF NOT EXISTS public.reputation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('answered', 'confirmed', 'rejected', 'flag_approved', 'corroboration')),
  points int NOT NULL,
  request_id uuid NULL REFERENCES public.requests(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reputation_events_user ON public.reputation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_category ON public.reputation_events(category_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_request ON public.reputation_events(request_id);
