-- supplier_photos
ALTER TABLE public.supplier_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_photos_select_public ON public.supplier_photos;
CREATE POLICY supplier_photos_select_public ON public.supplier_photos
  FOR SELECT TO anon, authenticated
  USING (ocr_status = 'clean' AND published_at IS NOT NULL);

DROP POLICY IF EXISTS supplier_photos_select_owner ON public.supplier_photos;
CREATE POLICY supplier_photos_select_owner ON public.supplier_photos
  FOR SELECT TO authenticated
  USING (ocr_status = 'clean' AND published_at IS NOT NULL);

DROP POLICY IF EXISTS supplier_photos_admin ON public.supplier_photos;
CREATE POLICY supplier_photos_admin ON public.supplier_photos
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- listings
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listings_select_public ON public.listings;
CREATE POLICY listings_select_public ON public.listings
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.suppliers s
    WHERE s.id = listings.supplier_id AND s.tier >= 2 AND s.deleted_at IS NULL
  ));

DROP POLICY IF EXISTS listings_select_logged_in ON public.listings;
CREATE POLICY listings_select_logged_in ON public.listings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS listings_insert_verified ON public.listings;
CREATE POLICY listings_insert_verified ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (champion_user_id = auth.uid());

DROP POLICY IF EXISTS listings_admin ON public.listings;
CREATE POLICY listings_admin ON public.listings
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- requests
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS requests_select_logged_in ON public.requests;
CREATE POLICY requests_select_logged_in ON public.requests
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS requests_insert_verified ON public.requests;
CREATE POLICY requests_insert_verified ON public.requests
  FOR INSERT TO authenticated
  WITH CHECK (requester_user_id = auth.uid());

DROP POLICY IF EXISTS requests_update_requester ON public.requests;
CREATE POLICY requests_update_requester ON public.requests
  FOR UPDATE TO authenticated
  USING (requester_user_id = auth.uid())
  WITH CHECK (requester_user_id = auth.uid());

DROP POLICY IF EXISTS requests_admin ON public.requests;
CREATE POLICY requests_admin ON public.requests
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- answers
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS answers_select_logged_in ON public.answers;
CREATE POLICY answers_select_logged_in ON public.answers
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS answers_insert_verified ON public.answers;
CREATE POLICY answers_insert_verified ON public.answers
  FOR INSERT TO authenticated
  WITH CHECK (champion_user_id = auth.uid());

DROP POLICY IF EXISTS answers_admin ON public.answers;
CREATE POLICY answers_admin ON public.answers
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- request_upvotes
ALTER TABLE public.request_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS request_upvotes_select_logged_in ON public.request_upvotes;
CREATE POLICY request_upvotes_select_logged_in ON public.request_upvotes
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS request_upvotes_insert_user ON public.request_upvotes;
CREATE POLICY request_upvotes_insert_user ON public.request_upvotes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS request_upvotes_delete_user ON public.request_upvotes;
CREATE POLICY request_upvotes_delete_user ON public.request_upvotes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- champion_reputation
ALTER TABLE public.champion_reputation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS champion_reputation_select ON public.champion_reputation;
CREATE POLICY champion_reputation_select ON public.champion_reputation
  FOR SELECT TO authenticated
  USING (true);

-- reputation_events
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reputation_events_select_user ON public.reputation_events;
CREATE POLICY reputation_events_select_user ON public.reputation_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS reputation_events_admin ON public.reputation_events;
CREATE POLICY reputation_events_admin ON public.reputation_events
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- finder_fee_ledger
ALTER TABLE public.finder_fee_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS finder_fee_ledger_select_owner ON public.finder_fee_ledger;
CREATE POLICY finder_fee_ledger_select_owner ON public.finder_fee_ledger
  FOR SELECT TO authenticated
  USING (champion_user_id = auth.uid());

DROP POLICY IF EXISTS finder_fee_ledger_admin ON public.finder_fee_ledger;
CREATE POLICY finder_fee_ledger_admin ON public.finder_fee_ledger
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- contact_unlocks
ALTER TABLE public.contact_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_unlocks_select_user ON public.contact_unlocks;
CREATE POLICY contact_unlocks_select_user ON public.contact_unlocks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS contact_unlocks_insert_user ON public.contact_unlocks;
CREATE POLICY contact_unlocks_insert_user ON public.contact_unlocks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categories_select_all ON public.categories;
CREATE POLICY categories_select_all ON public.categories
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS categories_admin ON public.categories;
CREATE POLICY categories_admin ON public.categories
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- admin_queue
ALTER TABLE public.admin_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_queue_select_admin ON public.admin_queue;
CREATE POLICY admin_queue_select_admin ON public.admin_queue
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

DROP POLICY IF EXISTS admin_queue_admin ON public.admin_queue;
CREATE POLICY admin_queue_admin ON public.admin_queue
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- config
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS config_select_all ON public.config;
CREATE POLICY config_select_all ON public.config
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS config_admin ON public.config;
CREATE POLICY config_admin ON public.config
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));
