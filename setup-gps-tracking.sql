-- Запустите в Supabase SQL Editor
-- Добавляет координаты живой геолокации мойщика и точку клиента к заказу

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS worker_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS worker_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS worker_location_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS client_lng DOUBLE PRECISION;
