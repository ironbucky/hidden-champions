-- Champion uploads; a second listing for an existing supplier is corroboration
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  champion_user_id uuid NOT NULL REFERENCES public.users(id),
  how_i_know_note text NULL,
  unfindable_attestations jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_supplier ON public.listings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_listings_champion ON public.listings(champion_user_id);
