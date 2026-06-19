-- ====================================================
-- VISIT Car Wash — Realtime Orders Setup
-- Run this in Supabase SQL Editor
-- ====================================================

-- 1. Add worker_id to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES auth.users(id);

-- 2. RLS: Workers can UPDATE orders (to accept them)
DROP POLICY IF EXISTS "Workers update orders" ON public.orders;
CREATE POLICY "Workers update orders"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('WORKER', 'ADMIN')
    )
  );

-- 3. Users can update their own orders (to cancel)
DROP POLICY IF EXISTS "Users update own orders" ON public.orders;
CREATE POLICY "Users update own orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Enable Realtime on orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Done!
SELECT 'Realtime setup complete' AS status;
