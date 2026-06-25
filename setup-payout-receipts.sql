-- Запустите в Supabase SQL Editor
-- Карта мойщика для ручных выплат + чек оплаты от администратора

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS card_number TEXT;

ALTER TABLE public.payout_requests
  ADD COLUMN IF NOT EXISTS card_number TEXT,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Бакет для чеков (скриншот/фото перевода) — публичный для чтения по ссылке,
-- загружать может только администратор
INSERT INTO storage.buckets (id, name, public)
VALUES ('payout-receipts', 'payout-receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "payout_receipts_public_read" ON storage.objects;
CREATE POLICY "payout_receipts_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'payout-receipts');

DROP POLICY IF EXISTS "payout_receipts_admin_write" ON storage.objects;
CREATE POLICY "payout_receipts_admin_write" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payout-receipts'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );
