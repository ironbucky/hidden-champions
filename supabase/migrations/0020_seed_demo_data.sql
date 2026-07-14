-- Seed demo data for Hidden Champions
-- Creates test users, suppliers, listings, requests, answers, upvotes, reputation, unlocks, admin queue items.
-- Idempotent: skips entirely if seed data already exists.

DO $$
DECLARE
  existing_count int;
BEGIN
  SELECT count(*) INTO existing_count FROM public.suppliers WHERE name = 'Rana Metal Works';
  IF existing_count > 0 THEN
    RETURN;
  END IF;
END;
$$;

DO $$
DECLARE
  now_ts timestamptz := now();
  pass text;

  -- User UUIDs (generated once via gen_random_uuid())
  champ_a uuid := gen_random_uuid();
  champ_b uuid := gen_random_uuid();
  champ_c uuid := gen_random_uuid();
  requester uuid := gen_random_uuid();
  unverified uuid := gen_random_uuid();

  -- Supplier UUIDs
  sup_rana uuid := gen_random_uuid();
  sup_leather uuid := gen_random_uuid();
  sup_haji uuid := gen_random_uuid();
  sup_butt uuid := gen_random_uuid();
  sup_green uuid := gen_random_uuid();
  sup_laser uuid := gen_random_uuid();
  sup_shalimar uuid := gen_random_uuid();
  sup_johar uuid := gen_random_uuid();
  sup_mughal uuid := gen_random_uuid();
  sup_riaz uuid := gen_random_uuid();
  sup_wood uuid := gen_random_uuid();
  sup_gulberg uuid := gen_random_uuid();

  -- Request UUIDs
  req_brass uuid := gen_random_uuid();
  req_leather_jrnl uuid := gen_random_uuid();
  req_bike_racks uuid := gen_random_uuid();
  req_patches uuid := gen_random_uuid();
  req_cake uuid := gen_random_uuid();
  req_chess uuid := gen_random_uuid();
  req_totes uuid := gen_random_uuid();
  req_tiles uuid := gen_random_uuid();

  -- Category UUIDs (looked up from seed)
  cat_metal uuid;
  cat_printing uuid;
  cat_garment uuid;
  cat_cnc uuid;
  cat_embroid uuid;
  cat_plastics uuid;
  cat_leather uuid;
  cat_food_pack uuid;
  cat_wood uuid;
  cat_ceramics uuid;
  cat_packaging uuid;

  -- Attestation JSON
  att jsonb := '{"searched_google":true,"searched_maps":true,"searched_b2b":true,"searched_social":false,"asked_around":true}'::jsonb;
  att_small jsonb := '{"searched_google":true,"searched_maps":true,"searched_b2b":true}'::jsonb;
  att_cer jsonb := '{"searched_google":true,"searched_maps":true,"searched_b2b":true,"asked_around":true}'::jsonb;
  att_embroid jsonb := '{"searched_google":true,"searched_social":true,"asked_around":true}'::jsonb;
  att_chess jsonb := '{"searched_google":true,"searched_maps":true,"asked_around":true}'::jsonb;
BEGIN
  pass := crypt('password123', gen_salt('bf'));

  ----------------------------------------
  -- 1. AUTH USERS + PUBLIC.USERS
  ----------------------------------------

  -- Champion A: Usman Malik
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
  VALUES (champ_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    '923001111111@hiddenchampions.phone', pass, now_ts,
    '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"phone":"+923001111111"}'::jsonb, false, now_ts, now_ts)
  ON CONFLICT DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  VALUES (gen_random_uuid(), champ_a, champ_a::text,
    jsonb_build_object('sub', champ_a::text, 'email', '923001111111@hiddenchampions.phone', 'email_verified', false, 'phone_verified', false),
    'email', now_ts, now_ts)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.users (id, phone, verification_method, verified_at, role, display_name, created_at)
  VALUES (champ_a, '+923001111111', 'manual', now_ts, 'user', 'Usman Malik', now_ts)
  ON CONFLICT DO NOTHING;

  -- Champion B: Fatima Iqbal
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
  VALUES (champ_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    '923002222222@hiddenchampions.phone', pass, now_ts,
    '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"phone":"+923002222222"}'::jsonb, false, now_ts, now_ts)
  ON CONFLICT DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  VALUES (gen_random_uuid(), champ_b, champ_b::text,
    jsonb_build_object('sub', champ_b::text, 'email', '923002222222@hiddenchampions.phone', 'email_verified', false, 'phone_verified', false),
    'email', now_ts, now_ts)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.users (id, phone, verification_method, verified_at, role, display_name, created_at)
  VALUES (champ_b, '+923002222222', 'manual', now_ts, 'user', 'Fatima Iqbal', now_ts)
  ON CONFLICT DO NOTHING;

  -- Champion C: Ahmed Shah
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
  VALUES (champ_c, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    '923003333333@hiddenchampions.phone', pass, now_ts,
    '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"phone":"+923003333333"}'::jsonb, false, now_ts, now_ts)
  ON CONFLICT DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  VALUES (gen_random_uuid(), champ_c, champ_c::text,
    jsonb_build_object('sub', champ_c::text, 'email', '923003333333@hiddenchampions.phone', 'email_verified', false, 'phone_verified', false),
    'email', now_ts, now_ts)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.users (id, phone, verification_method, verified_at, role, display_name, created_at)
  VALUES (champ_c, '+923003333333', 'manual', now_ts, 'user', 'Ahmed Shah', now_ts)
  ON CONFLICT DO NOTHING;

  -- Requester: Bilal Khan
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
  VALUES (requester, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    '923004444444@hiddenchampions.phone', pass, now_ts,
    '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"phone":"+923004444444"}'::jsonb, false, now_ts, now_ts)
  ON CONFLICT DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  VALUES (gen_random_uuid(), requester, requester::text,
    jsonb_build_object('sub', requester::text, 'email', '923004444444@hiddenchampions.phone', 'email_verified', false, 'phone_verified', false),
    'email', now_ts, now_ts)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.users (id, phone, verification_method, verified_at, role, display_name, created_at)
  VALUES (requester, '+923004444444', 'manual', now_ts, 'user', 'Bilal Khan', now_ts)
  ON CONFLICT DO NOTHING;

  -- Unverified user
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
  VALUES (unverified, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    '923005555555@hiddenchampions.phone', pass, now_ts,
    '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"phone":"+923005555555"}'::jsonb, false, now_ts, now_ts)
  ON CONFLICT DO NOTHING;

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  VALUES (gen_random_uuid(), unverified, unverified::text,
    jsonb_build_object('sub', unverified::text, 'email', '923005555555@hiddenchampions.phone', 'email_verified', false, 'phone_verified', false),
    'email', now_ts, now_ts)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.users (id, phone, verification_method, verified_at, role, display_name, created_at)
  VALUES (unverified, '+923005555555', 'manual', NULL, 'user', NULL, now_ts)
  ON CONFLICT DO NOTHING;

  -- Update existing admin display name if it exists
  UPDATE public.users SET display_name = 'Admin Sahab' WHERE phone = '+923234919183';

  ----------------------------------------
  -- 2. LOOKUP CATEGORIES
  ----------------------------------------
  SELECT id INTO cat_metal FROM public.categories WHERE slug = 'metal-fabrication' LIMIT 1;
  SELECT id INTO cat_printing FROM public.categories WHERE slug = 'printing' LIMIT 1;
  SELECT id INTO cat_garment FROM public.categories WHERE slug = 'garment-stitching' LIMIT 1;
  SELECT id INTO cat_cnc FROM public.categories WHERE slug = 'cnc-machining' LIMIT 1;
  SELECT id INTO cat_embroid FROM public.categories WHERE slug = 'embroidery' LIMIT 1;
  SELECT id INTO cat_plastics FROM public.categories WHERE slug = 'plastics' LIMIT 1;
  SELECT id INTO cat_leather FROM public.categories WHERE slug = 'leather-goods' LIMIT 1;
  SELECT id INTO cat_food_pack FROM public.categories WHERE slug = 'food-processing' LIMIT 1;
  SELECT id INTO cat_wood FROM public.categories WHERE slug = 'woodwork' LIMIT 1;
  SELECT id INTO cat_ceramics FROM public.categories WHERE slug = 'ceramics' LIMIT 1;
  SELECT id INTO cat_packaging FROM public.categories WHERE slug = 'packaging' LIMIT 1;

  ----------------------------------------
  -- 3. SUPPLIERS (12)
  ----------------------------------------
  -- Tier 4
  INSERT INTO public.suppliers (id, name, category_id, area, tier, tier_updated_at, claimed_by_user_id, claimed_at, created_at)
  VALUES (sup_rana, 'Rana Metal Works', cat_metal, 'Township', 4, now_ts, champ_c, now_ts - interval '30 days', now_ts - interval '60 days');
  INSERT INTO public.supplier_contacts (id, supplier_id, phone, source, added_by_user_id, added_at)
  VALUES (gen_random_uuid(), sup_rana, '+923214567890', 'champion_typed', champ_c, now_ts - interval '60 days');

  INSERT INTO public.suppliers (id, name, category_id, area, tier, tier_updated_at, claimed_by_user_id, claimed_at, created_at)
  VALUES (sup_leather, 'Lahore Leather Crafts', cat_leather, 'Mozang', 4, now_ts, champ_a, now_ts - interval '25 days', now_ts - interval '50 days');
  INSERT INTO public.supplier_contacts (id, supplier_id, phone, source, added_by_user_id, added_at)
  VALUES (gen_random_uuid(), sup_leather, '+923005670123', 'champion_typed', champ_a, now_ts - interval '50 days');

  -- Tier 3
  INSERT INTO public.suppliers (id, name, category_id, area, tier, tier_updated_at, claimed_by_user_id, claimed_at, created_at)
  VALUES (sup_haji, 'Haji Sahab Printing', cat_printing, 'Azam Cloth', 3, now_ts - interval '20 days', champ_a, now_ts - interval '20 days', now_ts - interval '45 days');
  INSERT INTO public.supplier_contacts (id, supplier_id, phone, source, added_by_user_id, added_at)
  VALUES (gen_random_uuid(), sup_haji, '+923334567890', 'champion_typed', champ_a, now_ts - interval '45 days');

  INSERT INTO public.suppliers (id, name, category_id, area, tier, tier_updated_at, claimed_by_user_id, claimed_at, created_at)
  VALUES (sup_butt, 'Butt Sahab Stitching Unit', cat_garment, 'Ichra', 3, now_ts - interval '15 days', champ_b, now_ts - interval '15 days', now_ts - interval '40 days');
  INSERT INTO public.supplier_contacts (id, supplier_id, phone, source, added_by_user_id, added_at)
  VALUES (gen_random_uuid(), sup_butt, '+923001234567', 'champion_typed', champ_b, now_ts - interval '40 days');

  INSERT INTO public.suppliers (id, name, category_id, area, tier, tier_updated_at, claimed_by_user_id, claimed_at, created_at)
  VALUES (sup_green, 'Green Tech Plastics', cat_plastics, 'Sundar Estate', 3, now_ts - interval '10 days', champ_a, now_ts - interval '10 days', now_ts - interval '35 days');
  INSERT INTO public.supplier_contacts (id, supplier_id, phone, source, added_by_user_id, added_at)
  VALUES (gen_random_uuid(), sup_green, '+923008901234', 'champion_typed', champ_a, now_ts - interval '35 days');

  -- Tier 2
  INSERT INTO public.suppliers (id, name, category_id, area, tier, created_at)
  VALUES (sup_laser, 'Model Town Laser Cutting', cat_cnc, 'Model Town', 2, now_ts - interval '30 days');
  INSERT INTO public.supplier_contacts (id, supplier_id, phone, source, added_by_user_id, added_at)
  VALUES (gen_random_uuid(), sup_laser, '+923219876543', 'champion_typed', champ_b, now_ts - interval '30 days');

  INSERT INTO public.suppliers (id, name, category_id, area, tier, created_at)
  VALUES (sup_shalimar, 'Shalimar Embroidery House', cat_embroid, 'Shalimar', 2, now_ts - interval '28 days');
  INSERT INTO public.supplier_contacts (id, supplier_id, phone, source, added_by_user_id, added_at)
  VALUES (gen_random_uuid(), sup_shalimar, '+923224561234', 'champion_typed', champ_c, now_ts - interval '28 days');

  INSERT INTO public.suppliers (id, name, category_id, area, tier, created_at)
  VALUES (sup_johar, 'Johar Town CNC', cat_cnc, 'Johar Town', 2, now_ts - interval '22 days');
  INSERT INTO public.supplier_contacts (id, supplier_id, phone, source, added_by_user_id, added_at)
  VALUES (gen_random_uuid(), sup_johar, '+923104561237', 'champion_typed', champ_a, now_ts - interval '22 days');

  INSERT INTO public.suppliers (id, name, category_id, area, tier, created_at)
  VALUES (sup_mughal, 'Mughal Food Packaging', cat_food_pack, 'Badami Bagh', 2, now_ts - interval '18 days');
  INSERT INTO public.supplier_contacts (id, supplier_id, phone, source, added_by_user_id, added_at)
  VALUES (gen_random_uuid(), sup_mughal, '+923004561235', 'champion_typed', champ_b, now_ts - interval '18 days');

  -- Tier 1
  INSERT INTO public.suppliers (id, name, category_id, area, tier, created_at)
  VALUES (sup_riaz, 'Riaz Hosiery', cat_garment, 'Faisal Town', 1, now_ts - interval '14 days');

  INSERT INTO public.suppliers (id, name, category_id, area, tier, created_at)
  VALUES (sup_wood, 'Shah Alam Woodworks', cat_wood, 'Shah Alam', 1, now_ts - interval '10 days');

  INSERT INTO public.suppliers (id, name, category_id, area, tier, created_at)
  VALUES (sup_gulberg, 'Gulberg Digital Prints', cat_printing, 'Gulberg', 1, now_ts - interval '5 days');

  ----------------------------------------
  -- 4. LISTINGS (8)
  ----------------------------------------
  INSERT INTO public.listings (id, supplier_id, champion_user_id, how_i_know_note, unfindable_attestations, created_at) VALUES
    (gen_random_uuid(), sup_haji, champ_a, 'Family friend running shop since 2008', att, now_ts - interval '45 days'),
    (gen_random_uuid(), sup_green, champ_a, 'Did 3 orders — reliable plastic molding', att, now_ts - interval '35 days'),
    (gen_random_uuid(), sup_johar, champ_a, 'Ex-colleague started this CNC workshop', att, now_ts - interval '22 days'),
    (gen_random_uuid(), sup_butt, champ_b, 'Neighborhood stitching unit, been there for 15 years', att, now_ts - interval '40 days'),
    (gen_random_uuid(), sup_laser, champ_b, 'Found through mutual contact, excellent precision work', att, now_ts - interval '30 days'),
    (gen_random_uuid(), sup_mughal, champ_b, 'Only packaging supplier in Badami Bagh worth ordering from', att, now_ts - interval '18 days'),
    (gen_random_uuid(), sup_rana, champ_c, 'Personal workshop — father started in the 1980s', att, now_ts - interval '60 days'),
    (gen_random_uuid(), sup_shalimar, champ_c, 'Cousin runs this embroidery house near Shalimar Gardens', att, now_ts - interval '28 days');

  ----------------------------------------
  -- 5. REQUESTS (8)
  ----------------------------------------
  INSERT INTO public.requests (id, requester_user_id, what, category_id, area, unfindable_attestations, upvotes, state, created_at, expires_at, stale_bounty_at) VALUES
    (req_brass, requester, 'Custom brass door handles, Mughal geometric motif', cat_metal, 'Gulberg', att, 9, 'open', now_ts - interval '5 days', now_ts + interval '2 days', now_ts - interval '1 day');

  INSERT INTO public.requests (id, requester_user_id, what, category_id, area, unfindable_attestations, upvotes, state, created_at, expires_at, stale_bounty_at, answered_at) VALUES
    (req_leather_jrnl, requester, 'Leather journal binding 500 pieces with logo emboss', cat_leather, 'Mozang', att_small, 4, 'answered', now_ts - interval '4 days', now_ts + interval '3 days', now_ts + interval '3 days', now_ts - interval '2 days');

  INSERT INTO public.requests (id, requester_user_id, what, category_id, area, unfindable_attestations, upvotes, state, created_at, expires_at, stale_bounty_at) VALUES
    (req_bike_racks, requester, 'Steel bicycle racks powder-coated, 200 units', cat_metal, 'Johar Town', att, 12, 'open', now_ts - interval '3 days', now_ts + interval '4 days', now_ts + interval '1 day');

  INSERT INTO public.requests (id, requester_user_id, what, category_id, area, unfindable_attestations, upvotes, state, created_at, expires_at, stale_bounty_at, answered_at, confirmed_at) VALUES
    (req_patches, requester, 'Embroidered patches for school blazers, 1000 units', cat_embroid, 'Shalimar', att_embroid, 7, 'confirmed', now_ts - interval '10 days', now_ts + interval '4 days', now_ts + interval '4 days', now_ts - interval '6 days', now_ts - interval '3 days');

  INSERT INTO public.requests (id, requester_user_id, what, category_id, area, unfindable_attestations, upvotes, state, created_at, expires_at, stale_bounty_at) VALUES
    (req_cake, requester, 'Corrugated cake boxes with window, 5000 pcs monthly', cat_packaging, 'Township', att, 2, 'open', now_ts - interval '2 days', now_ts + interval '5 days', now_ts + interval '2 days');

  INSERT INTO public.requests (id, requester_user_id, what, category_id, area, unfindable_attestations, upvotes, state, created_at, expires_at, stale_bounty_at) VALUES
    (req_chess, requester, 'Wooden chess sets bulk order for export to UAE', cat_wood, 'Shah Alam', att_chess, 3, 'expired', now_ts - interval '14 days', now_ts - interval '1 day', now_ts - interval '5 days');

  INSERT INTO public.requests (id, requester_user_id, what, category_id, area, unfindable_attestations, upvotes, state, created_at, expires_at, stale_bounty_at) VALUES
    (req_totes, requester, 'Screen-printed canvas tote bags, 1000 units', cat_printing, 'Azam Cloth', att, 5, 'open', now_ts - interval '1 day', now_ts + interval '6 days', now_ts + interval '3 days');

  INSERT INTO public.requests (id, requester_user_id, what, category_id, area, unfindable_attestations, upvotes, state, created_at, expires_at, stale_bounty_at) VALUES
    (req_tiles, requester, 'Hand-painted ceramic tiles 20x20cm, traditional motifs', cat_ceramics, 'Ichra', att_cer, 1, 'open', now_ts - interval '6 days', now_ts + interval '1 day', now_ts + interval '1 day');

  ----------------------------------------
  -- 6. ANSWERS (6)
  ----------------------------------------
  INSERT INTO public.answers (id, request_id, champion_user_id, supplier_id, state, created_at) VALUES
    (gen_random_uuid(), req_brass, champ_a, sup_haji, 'answered', now_ts - interval '3 days'),
    (gen_random_uuid(), req_brass, champ_c, sup_rana, 'answered', now_ts - interval '2 days');

  INSERT INTO public.answers (id, request_id, champion_user_id, supplier_id, state, created_at) VALUES
    (gen_random_uuid(), req_leather_jrnl, champ_a, sup_leather, 'answered', now_ts - interval '2 days');

  INSERT INTO public.answers (id, request_id, champion_user_id, supplier_id, state, created_at, resolved_at) VALUES
    (gen_random_uuid(), req_patches, champ_b, sup_butt, 'confirmed', now_ts - interval '6 days', now_ts - interval '3 days');

  INSERT INTO public.answers (id, request_id, champion_user_id, supplier_id, state, created_at) VALUES
    (gen_random_uuid(), req_totes, champ_a, sup_haji, 'answered', now_ts - interval '12 hours');

  INSERT INTO public.answers (id, request_id, champion_user_id, supplier_id, state, created_at, resolved_at) VALUES
    (gen_random_uuid(), req_tiles, champ_b, sup_butt, 'rejected', now_ts - interval '4 days', now_ts - interval '3 days');

  ----------------------------------------
  -- 7. UPVOTES
  ----------------------------------------
  -- Brass handles (9 upvotes from DB count, 4 rows + 5 implicit)
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_brass, champ_a, now_ts - interval '4 days');
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_brass, champ_b, now_ts - interval '4 days');
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_brass, champ_c, now_ts - interval '3 days');
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_brass, requester, now_ts - interval '5 days');

  -- Bike racks (12)
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_bike_racks, champ_a, now_ts - interval '2 days');
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_bike_racks, champ_b, now_ts - interval '2 days');
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_bike_racks, champ_c, now_ts - interval '1 day');
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_bike_racks, requester, now_ts - interval '3 days');

  -- Leather journals (4)
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_leather_jrnl, champ_b, now_ts - interval '3 days');
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_leather_jrnl, champ_c, now_ts - interval '2 days');

  -- Tote bags (5)
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_totes, champ_a, now_ts - interval '1 day');
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_totes, champ_b, now_ts - interval '1 day');
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_totes, requester, now_ts - interval '1 day');

  -- Patches (7)
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_patches, champ_a, now_ts - interval '8 days');
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_patches, champ_c, now_ts - interval '7 days');

  -- Cake boxes (2)
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_cake, champ_a, now_ts - interval '1 day');

  -- Chess (3)
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_chess, champ_a, now_ts - interval '10 days');
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_chess, champ_b, now_ts - interval '9 days');

  -- Tiles (1)
  INSERT INTO public.request_upvotes (request_id, user_id, created_at) VALUES (req_tiles, requester, now_ts - interval '6 days');

  ----------------------------------------
  -- 8. CHAMPION REPUTATION
  ----------------------------------------
  -- Champ A: Metal, Printing, Plastics, Leather
  INSERT INTO public.champion_reputation (user_id, category_id, reputation_points, answered_count, confirmed_count, rejected_count)
  VALUES (champ_a, cat_metal, 30, 1, 0, 0),
         (champ_a, cat_printing, 50, 3, 0, 0),
         (champ_a, cat_plastics, 40, 1, 0, 0),
         (champ_a, cat_leather, 20, 1, 0, 0);

  -- Champ B: Garment, CNC, Embroidery, Food
  INSERT INTO public.champion_reputation (user_id, category_id, reputation_points, answered_count, confirmed_count, rejected_count)
  VALUES (champ_b, cat_garment, 60, 2, 1, 0),
         (champ_b, cat_cnc, 30, 1, 0, 0),
         (champ_b, cat_embroid, 40, 1, 1, 0),
         (champ_b, cat_food_pack, 20, 1, 0, 0);

  -- Champ C: Metal, Embroidery
  INSERT INTO public.champion_reputation (user_id, category_id, reputation_points, answered_count, confirmed_count, rejected_count)
  VALUES (champ_c, cat_metal, 50, 2, 0, 0),
         (champ_c, cat_embroid, 30, 1, 0, 0);

  UPDATE public.users SET reputation_total = 140 WHERE id = champ_a AND reputation_total < 140;
  UPDATE public.users SET reputation_total = 150 WHERE id = champ_b AND reputation_total < 150;
  UPDATE public.users SET reputation_total = 80 WHERE id = champ_c AND reputation_total < 80;

  ----------------------------------------
  -- 9. CONTACT UNLOCKS (3)
  ----------------------------------------
  INSERT INTO public.contact_unlocks (id, user_id, supplier_id, unlocked_at) VALUES
    (gen_random_uuid(), requester, sup_rana, now_ts - interval '1 day'),
    (gen_random_uuid(), requester, sup_leather, now_ts - interval '12 hours'),
    (gen_random_uuid(), champ_a, sup_green, now_ts - interval '5 days');

  ----------------------------------------
  -- 10. ADMIN QUEUE (5)
  ----------------------------------------
  INSERT INTO public.admin_queue (id, item_type, item_id, status, created_at) VALUES
    (gen_random_uuid(), 'user_verify', unverified, 'pending', now_ts - interval '3 days'),
    (gen_random_uuid(), 'category_suggest', gen_random_uuid(), 'pending', now_ts - interval '2 days'),
    (gen_random_uuid(), 'category_suggest', gen_random_uuid(), 'pending', now_ts - interval '1 day'),
    (gen_random_uuid(), 'user_verify', requester, 'pending', now_ts - interval '30 days'),
    (gen_random_uuid(), 'listing_moderation', sup_riaz, 'pending', now_ts - interval '7 days');

  UPDATE public.admin_queue SET status = 'resolved', resolved_at = now_ts - interval '29 days'
  WHERE item_type = 'user_verify' AND item_id = requester;

END;
$$;
