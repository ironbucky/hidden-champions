-- Demand aggregation on open requests
CREATE TABLE IF NOT EXISTS public.request_upvotes (
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_request_upvotes_user ON public.request_upvotes(user_id);
