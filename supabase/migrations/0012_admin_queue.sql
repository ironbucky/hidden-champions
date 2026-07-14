-- Admin review queue
CREATE TABLE IF NOT EXISTS public.admin_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('photo', 'fuzzy_match', 'flag_findable', 'category_suggest', 'user_verify', 'listing_moderation')),
  item_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
  assigned_to uuid NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL,
  metadata jsonb NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_queue_status ON public.admin_queue(status);
CREATE INDEX IF NOT EXISTS idx_admin_queue_type ON public.admin_queue(item_type);
CREATE INDEX IF NOT EXISTS idx_admin_queue_assigned ON public.admin_queue(assigned_to);
