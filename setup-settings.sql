-- Запустите в Supabase SQL Editor
-- Настройки уведомлений пользователя (страница /dashboard/settings)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN NOT NULL DEFAULT true;
