-- Запустите в Supabase SQL Editor
-- Выбор способа оплаты (карта/Click/Payme/наличные) и загрузка чека прямо в Telegram-боте

ALTER TABLE public.telegram_pending_orders
  ADD COLUMN IF NOT EXISTS lat            DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng            DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_name  TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS step           TEXT NOT NULL DEFAULT 'service';
