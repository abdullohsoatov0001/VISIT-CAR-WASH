-- ====================================================
-- VISIT Car Wash — User Data Setup
-- Run this in Supabase SQL Editor (once)
-- ====================================================

-- 1. Add loyalty & stats columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS loyalty_points  INT     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_tier    TEXT    DEFAULT 'Bronze',
  ADD COLUMN IF NOT EXISTS total_washes    INT     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_spent     BIGINT  DEFAULT 0;

-- 2. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number  TEXT        UNIQUE DEFAULT 'W-' || floor(random() * 9000 + 1000)::text,
  service_type  TEXT        NOT NULL,
  status        TEXT        DEFAULT 'pending',
  price         BIGINT      DEFAULT 0,
  location_name TEXT        DEFAULT '',
  worker_name   TEXT,
  worker_rating FLOAT,
  user_rating   INT,
  notes         TEXT,
  scheduled_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies — users only see/edit their own orders
DROP POLICY IF EXISTS "Users see own orders"   ON public.orders;
DROP POLICY IF EXISTS "Users insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users update own orders" ON public.orders;

CREATE POLICY "Users see own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Workers & admins can see all orders
DROP POLICY IF EXISTS "Workers see all orders" ON public.orders;
CREATE POLICY "Workers see all orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('WORKER', 'ADMIN')
    )
  );

-- Done! Check result:
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;
