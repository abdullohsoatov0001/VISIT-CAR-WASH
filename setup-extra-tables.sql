-- Запустите этот файл в Supabase SQL Editor
-- Добавляет таблицы для машин, уведомлений, карт и настроек админки

-- ====================== VEHICLES ======================
DROP TABLE IF EXISTS public.vehicles CASCADE;
CREATE TABLE public.vehicles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make        TEXT NOT NULL,
  model       TEXT NOT NULL,
  year        INT,
  plate       TEXT,
  color       TEXT,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicles_select_own" ON public.vehicles;
CREATE POLICY "vehicles_select_own" ON public.vehicles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "vehicles_insert_own" ON public.vehicles;
CREATE POLICY "vehicles_insert_own" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "vehicles_update_own" ON public.vehicles;
CREATE POLICY "vehicles_update_own" ON public.vehicles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "vehicles_delete_own" ON public.vehicles;
CREATE POLICY "vehicles_delete_own" ON public.vehicles FOR DELETE USING (auth.uid() = user_id);


-- ====================== NOTIFICATIONS ======================
DROP TABLE IF EXISTS public.notifications CASCADE;
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL DEFAULT 'system', -- order | payment | promo | system | rating
  title       TEXT NOT NULL,
  body        TEXT NOT NULL DEFAULT '',
  read        BOOLEAN NOT NULL DEFAULT false,
  urgent      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('WORKER', 'ADMIN'))
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ====================== PAYMENT METHODS (saved cards, без реальной обработки) ======================
DROP TABLE IF EXISTS public.payment_methods CASCADE;
CREATE TABLE public.payment_methods (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_type   TEXT NOT NULL DEFAULT 'Card', -- Visa / Humo / UzCard ...
  last4       TEXT NOT NULL,
  expires     TEXT,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_methods_select_own" ON public.payment_methods;
CREATE POLICY "payment_methods_select_own" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_insert_own" ON public.payment_methods;
CREATE POLICY "payment_methods_insert_own" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_update_own" ON public.payment_methods;
CREATE POLICY "payment_methods_update_own" ON public.payment_methods FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payment_methods_delete_own" ON public.payment_methods;
CREATE POLICY "payment_methods_delete_own" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);


-- ====================== PROFILES: админ видит всех ======================
-- SECURITY DEFINER функция — обходит RLS внутри себя, иначе политика на profiles
-- ссылающаяся на profiles вызывает "infinite recursion detected in policy" (ошибка 500).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN');
$$;

DROP POLICY IF EXISTS "admin_select_all_profiles" ON public.profiles;
CREATE POLICY "admin_select_all_profiles" ON public.profiles FOR SELECT USING (public.is_admin());


-- ====================== APP SETTINGS (один ряд, только для админки) ======================
DROP TABLE IF EXISTS public.app_settings CASCADE;
CREATE TABLE public.app_settings (
  id                  INT PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- единственная строка
  new_order_alerts    BOOLEAN NOT NULL DEFAULT true,
  fraud_alerts        BOOLEAN NOT NULL DEFAULT true,
  auto_assign_workers BOOLEAN NOT NULL DEFAULT true,
  maintenance_mode    BOOLEAN NOT NULL DEFAULT false,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_select_admin" ON public.app_settings;
CREATE POLICY "app_settings_select_admin" ON public.app_settings FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "app_settings_update_admin" ON public.app_settings;
CREATE POLICY "app_settings_update_admin" ON public.app_settings FOR UPDATE USING (public.is_admin());


-- ====================== STORAGE: аватарки ======================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_upload_own" ON storage.objects;
CREATE POLICY "avatars_upload_own" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ====================== PAYOUT REQUESTS (вывод заработка мойщиками) ======================
DROP TABLE IF EXISTS public.payout_requests CASCADE;
CREATE TABLE public.payout_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount      BIGINT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending', -- pending | paid | rejected
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payout_select_own_or_admin" ON public.payout_requests;
CREATE POLICY "payout_select_own_or_admin" ON public.payout_requests FOR SELECT USING (
  auth.uid() = worker_id OR public.is_admin()
);

DROP POLICY IF EXISTS "payout_insert_own" ON public.payout_requests;
CREATE POLICY "payout_insert_own" ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = worker_id);

DROP POLICY IF EXISTS "payout_update_admin" ON public.payout_requests;
CREATE POLICY "payout_update_admin" ON public.payout_requests FOR UPDATE USING (public.is_admin());
