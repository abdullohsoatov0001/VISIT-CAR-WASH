-- Запустите в Supabase SQL Editor
-- Фотофиксация "до/после" мойки + текстовый отзыв клиента + диплинк уведомления на форму оценки

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS before_photos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS after_photos  TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS review_text   TEXT;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;

-- ====================== STORAGE: фото до/после мойки ======================
INSERT INTO storage.buckets (id, name, public)
VALUES ('wash-photos', 'wash-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "wash_photos_public_read" ON storage.objects;
CREATE POLICY "wash_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'wash-photos');

-- Загружать фото может только мойщик/админ (путь: {order_id}/before|after/...)
DROP POLICY IF EXISTS "wash_photos_upload_worker" ON storage.objects;
CREATE POLICY "wash_photos_upload_worker" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'wash-photos'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('WORKER', 'ADMIN'))
);

DROP POLICY IF EXISTS "wash_photos_delete_worker" ON storage.objects;
CREATE POLICY "wash_photos_delete_worker" ON storage.objects FOR DELETE USING (
  bucket_id = 'wash-photos'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('WORKER', 'ADMIN'))
);
