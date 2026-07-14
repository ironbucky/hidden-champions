-- Row-Level Security on supplier_contacts
ALTER TABLE public.supplier_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_contacts_select_champion ON public.supplier_contacts;
CREATE POLICY supplier_contacts_select_champion ON public.supplier_contacts
  FOR SELECT TO authenticated
  USING (added_by_user_id = auth.uid());

DROP POLICY IF EXISTS supplier_contacts_select_claimed ON public.supplier_contacts;
CREATE POLICY supplier_contacts_select_claimed ON public.supplier_contacts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = supplier_contacts.supplier_id AND s.claimed_by_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS supplier_contacts_select_unlocked ON public.supplier_contacts;
CREATE POLICY supplier_contacts_select_unlocked ON public.supplier_contacts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.verified_at IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.contact_unlocks cu
        WHERE cu.user_id = auth.uid() AND cu.supplier_id = supplier_contacts.supplier_id
      )
  ));

DROP POLICY IF EXISTS supplier_contacts_select_admin ON public.supplier_contacts;
CREATE POLICY supplier_contacts_select_admin ON public.supplier_contacts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

DROP POLICY IF EXISTS supplier_contacts_insert_champion ON public.supplier_contacts;
CREATE POLICY supplier_contacts_insert_champion ON public.supplier_contacts
  FOR INSERT TO authenticated
  WITH CHECK (added_by_user_id = auth.uid());
