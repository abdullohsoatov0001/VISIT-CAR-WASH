-- Запустите в Supabase SQL Editor
-- Телефоны клиента и мойщика на заказе — чтобы кнопка "Позвонить" работала
-- в обе стороны без отдельного запроса к profiles на каждый рендер

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS worker_phone TEXT;
