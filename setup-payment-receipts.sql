-- Запустите в Supabase SQL Editor
-- Ручное подтверждение оплаты клиента: клиент переводит деньги на карту/Click/Payme
-- компании сам и прикладывает скрин чека, админ проверяет и подтверждает

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- payment_status: unpaid | awaiting_verification | verified | rejected

-- Бакет для чеков клиента (скрин/фото перевода) — публичный для чтения по ссылке,
-- загружать может только сам авторизованный пользователь
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "payment_receipts_public_read" ON storage.objects;
CREATE POLICY "payment_receipts_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "payment_receipts_user_write" ON storage.objects;
CREATE POLICY "payment_receipts_user_write" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-receipts'
    AND auth.uid() IS NOT NULL
  );
