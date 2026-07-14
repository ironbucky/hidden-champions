-- Searcher requests and champion answers
CREATE TABLE IF NOT EXISTS public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id uuid NOT NULL REFERENCES public.users(id),
  what text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.categories(id),
  area text NOT NULL,
  unfindable_attestations jsonb NOT NULL,
  upvotes int NOT NULL DEFAULT 0,
  state text NOT NULL DEFAULT 'open' CHECK (state IN ('draft', 'open', 'answered', 'confirmed', 'rejected', 'expired', 'flagged-closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  stale_bounty_at timestamptz NOT NULL,
  answered_at timestamptz NULL,
  confirmed_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_requests_state ON public.requests(state);
CREATE INDEX IF NOT EXISTS idx_requests_category ON public.requests(category_id);
CREATE INDEX IF NOT EXISTS idx_requests_requester ON public.requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_requests_expires_at ON public.requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_requests_stale_bounty ON public.requests(stale_bounty_at);

CREATE TABLE IF NOT EXISTS public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  champion_user_id uuid NOT NULL REFERENCES public.users(id),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  state text NOT NULL DEFAULT 'answered' CHECK (state IN ('answered', 'confirmed', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL,
  UNIQUE (request_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_request ON public.answers(request_id);
CREATE INDEX IF NOT EXISTS idx_answers_champion ON public.answers(champion_user_id);
CREATE INDEX IF NOT EXISTS idx_answers_supplier ON public.answers(supplier_id);
