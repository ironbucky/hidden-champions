-- Row-Level Security on suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read public Tier 2+ non-deleted suppliers
DROP POLICY IF EXISTS suppliers_select_public ON public.suppliers;
CREATE POLICY suppliers_select_public ON public.suppliers
  FOR SELECT TO anon, authenticated
  USING (tier >= 2 AND deleted_at IS NULL);

-- Logged-in users can read all non-deleted suppliers
DROP POLICY IF EXISTS suppliers_select_logged_in ON public.suppliers;
CREATE POLICY suppliers_select_logged_in ON public.suppliers
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- Champions can update their own unclaimed listings
DROP POLICY IF EXISTS suppliers_update_champion ON public.suppliers;
CREATE POLICY suppliers_update_champion ON public.suppliers
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.supplier_id = suppliers.id
      AND l.champion_user_id = auth.uid()
      AND suppliers.claimed_by_user_id IS NULL
  ))
  WITH CHECK (claimed_by_user_id IS NULL);

-- Claimed suppliers can update their claimed listing
DROP POLICY IF EXISTS suppliers_update_claimed ON public.suppliers;
CREATE POLICY suppliers_update_claimed ON public.suppliers
  FOR UPDATE TO authenticated
  USING (claimed_by_user_id = auth.uid())
  WITH CHECK (claimed_by_user_id = auth.uid());

-- Admins can update/delete (soft-delete via update only)
DROP POLICY IF EXISTS suppliers_update_admin ON public.suppliers;
CREATE POLICY suppliers_update_admin ON public.suppliers
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));
