-- Запустите в Supabase SQL Editor
-- Полная хронология заказа: когда принят мойщиком, когда начата мойка
-- (created_at и completed_at уже существуют в orders)

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at  TIMESTAMPTZ;
