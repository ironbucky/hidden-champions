-- Deferred finder's fee entitlement (payout Phase 2+)
CREATE TABLE IF NOT EXISTS public.finder_fee_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  champion_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  fee_percent numeric NOT NULL,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  paid_out_at timestamptz NULL,
  paid_amount numeric NULL,
  UNIQUE (champion_user_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_finder_fee_ledger_champion ON public.finder_fee_ledger(champion_user_id);
CREATE INDEX IF NOT EXISTS idx_finder_fee_ledger_supplier ON public.finder_fee_ledger(supplier_id);
