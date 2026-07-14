-- Suppliers: phone numbers live ONLY in supplier_contacts
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.categories(id),
  area text NOT NULL,
  geopoint geography(point, 4326) NULL,
  tier int NOT NULL DEFAULT 1 CHECK (tier BETWEEN 1 AND 4),
  tier_updated_at timestamptz NULL,
  claimed_by_user_id uuid NULL REFERENCES public.users(id),
  claimed_at timestamptz NULL,
  deleted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_category ON public.suppliers(category_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_area ON public.suppliers(area);
CREATE INDEX IF NOT EXISTS idx_suppliers_tier ON public.suppliers(tier);
CREATE INDEX IF NOT EXISTS idx_suppliers_deleted_at ON public.suppliers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_suppliers_claimed_by ON public.suppliers(claimed_by_user_id);

-- Gated phone storage
CREATE TABLE IF NOT EXISTS public.supplier_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  phone text NOT NULL,
  source text NOT NULL CHECK (source IN ('champion_typed', 'ocr_detected', 'claim_otp')),
  added_by_user_id uuid NOT NULL REFERENCES public.users(id),
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_supplier_contacts_supplier ON public.supplier_contacts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_contacts_added_by ON public.supplier_contacts(added_by_user_id);
