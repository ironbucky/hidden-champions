-- Runtime-tunable config values
CREATE TABLE IF NOT EXISTS public.config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid NULL REFERENCES public.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed defaults matching /config/index.ts (grouped objects for related thresholds)
INSERT INTO public.config (key, value) VALUES
  ('request_expiry_days', '7'),
  ('stale_bounty_day', '4'),
  ('stale_bounty_multiplier', '3'),
  ('contact_unlock_daily_quota', '10'),
  ('reputation_weights', '{"answered": 10, "confirmed": 20, "rejected": -10, "flagApproved": 5}'),
  ('leaderboard_sizes', '{"category": 5, "global": 10}'),
  ('ocr_phone_regex', '(?:\\+?92|0)?3\\d{2}[-\\s]?\\d{7}')
ON CONFLICT (key) DO NOTHING;
