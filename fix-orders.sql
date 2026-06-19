-- ====================================================
-- VISIT Car Wash — ПОЛНЫЙ СБРОС И ПЕРЕСОЗДАНИЕ ЗАКАЗОВ
-- Запусти в Supabase SQL Editor
-- ====================================================

-- 1. Удалить старую таблицу (если есть)
DROP TABLE IF EXISTS public.orders CASCADE;

-- 2. Создать заново правильно
CREATE TABLE public.orders (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id     UUID        REFERENCES auth.users(id),
  order_number  TEXT        NOT NULL,
  service_type  TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending',
  price         BIGINT      NOT NULL DEFAULT 0,
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

-- 3. Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Клиент видит свои заказы
CREATE POLICY "client_select_own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- 5. Клиент создаёт заказ
CREATE POLICY "client_insert" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Клиент может обновить свой заказ (отмена)
CREATE POLICY "client_update_own" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Мойщик и админ видят ВСЕ заказы
CREATE POLICY "worker_select_all" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('WORKER', 'ADMIN')
    )
  );

-- 8. Мойщик принимает/завершает заказ
CREATE POLICY "worker_update" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('WORKER', 'ADMIN')
    )
  );

-- 9. Включить Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Проверка
SELECT 'orders table created successfully' AS status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;
