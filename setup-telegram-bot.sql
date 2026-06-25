-- Запустите в Supabase SQL Editor
-- Чат-бот заказа мойки в Telegram (без мини-аппа): привязка аккаунта сайта + заказ + геолокация

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT UNIQUE;

-- Старая таблица привязки через сайт больше не используется
-- (регистрация теперь полностью в боте) — можно удалить.
DROP TABLE IF EXISTS public.telegram_link_codes;

-- Черновик заказа между выбором услуги и получением геолокации в чате.
-- Только сервер (service role) читает и пишет — RLS включён, политик нет.
CREATE TABLE IF NOT EXISTS public.telegram_pending_orders (
  chat_id    BIGINT PRIMARY KEY,
  service_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.telegram_pending_orders ENABLE ROW LEVEL SECURITY;

-- Регистрация прямо в боте: телефон уже получен и подтверждён Telegram,
-- дальше пошагово собираем имя и email, чтобы создать полноценный аккаунт
-- (с которым можно зайти и на сайт).
-- Только сервер (service role) читает и пишет — RLS включён, политик нет.
CREATE TABLE IF NOT EXISTS public.telegram_registrations (
  chat_id    BIGINT PRIMARY KEY,
  phone      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.telegram_registrations
  ADD COLUMN IF NOT EXISTS step TEXT NOT NULL DEFAULT 'name',
  ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.telegram_registrations ENABLE ROW LEVEL SECURITY;

-- Защита от повторной обработки одного и того же обновления Telegram
-- (Telegram иногда повторяет доставку при сетевых сбоях — без этого
-- повторное сообщение с геолокацией создало бы второй заказ).
-- Только сервер (service role) читает и пишет — RLS включён, политик нет.
CREATE TABLE IF NOT EXISTS public.telegram_processed_updates (
  update_id  BIGINT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.telegram_processed_updates ENABLE ROW LEVEL SECURITY;
