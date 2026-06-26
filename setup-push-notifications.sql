-- Запустите в Supabase SQL Editor
-- Push-уведомления (Android, через Firebase Cloud Messaging) — токен устройства
-- сохраняется сюда при входе в приложение, см. components/PushInit.tsx

alter table public.profiles add column if not exists push_token text;
