-- Запустите в Supabase SQL Editor
-- Реквизиты компании (карта/Click/Payme) для ручной оплаты — редактируются в админке
-- /admin/settings, читаются клиентом на странице оформления заказа

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS payment_card_number  TEXT,
  ADD COLUMN IF NOT EXISTS payment_click_number TEXT,
  ADD COLUMN IF NOT EXISTS payment_payme_number TEXT;

-- Раньше строку app_settings мог читать только админ — но реквизиты оплаты
-- должен видеть и обычный клиент на шаге оплаты, поэтому открываем SELECT всем
DROP POLICY IF EXISTS "app_settings_select_admin" ON public.app_settings;
DROP POLICY IF EXISTS "app_settings_select_public" ON public.app_settings;
CREATE POLICY "app_settings_select_public" ON public.app_settings FOR SELECT USING (true);
