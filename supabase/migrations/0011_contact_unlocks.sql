-- Contact unlock records used by RLS + daily quota count
CREATE TABLE IF NOT EXISTS public.contact_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_unlocks_user ON public.contact_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_unlocks_supplier ON public.contact_unlocks(supplier_id);
CREATE INDEX IF NOT EXISTS idx_contact_unlocks_time ON public.contact_unlocks(unlocked_at);
