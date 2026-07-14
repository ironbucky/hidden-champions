-- Row-Level Security on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS users_select_all_admins ON public.users;
CREATE POLICY users_select_all_admins ON public.users
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

DROP POLICY IF EXISTS users_update_admin_only ON public.users;
CREATE POLICY users_update_admin_only ON public.users
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));
