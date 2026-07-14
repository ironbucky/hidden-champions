-- App users mirror auth.users and store verification/role/reputation
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE NOT NULL,
  verification_method text NOT NULL DEFAULT 'manual',
  verified_at timestamptz NULL,
  verified_by uuid NULL REFERENCES public.users(id),
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  reputation_total int NOT NULL DEFAULT 0,
  display_name text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
