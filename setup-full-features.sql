-- Запустите в Supabase SQL Editor
-- Большая миграция: сохранённые адреса, подписки, лояльность (авто-начисление),
-- авто-отмена зависших заказов, журнал ошибок для админки.

-- ====================== ADDRESSES (сохранённые адреса клиента) ======================
DROP TABLE IF EXISTS public.addresses CASCADE;
CREATE TABLE public.addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  address     TEXT NOT NULL,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addresses_select_own" ON public.addresses;
CREATE POLICY "addresses_select_own" ON public.addresses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_insert_own" ON public.addresses;
CREATE POLICY "addresses_insert_own" ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_update_own" ON public.addresses;
CREATE POLICY "addresses_update_own" ON public.addresses FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addresses_delete_own" ON public.addresses;
CREATE POLICY "addresses_delete_own" ON public.addresses FOR DELETE USING (auth.uid() = user_id);


-- ====================== SUBSCRIPTIONS (без реального биллинга — активация вручную) ======================
DROP TABLE IF EXISTS public.subscriptions CASCADE;
CREATE TABLE public.subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                TEXT NOT NULL, -- starter | pro | black
  status              TEXT NOT NULL DEFAULT 'active', -- active | cancelled | expired
  washes_left         INT NOT NULL DEFAULT 0, -- -1 = безлимит (Black)
  washes_total        INT NOT NULL DEFAULT 0,
  price               BIGINT NOT NULL DEFAULT 0,
  current_period_end  TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_insert_own" ON public.subscriptions;
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "subscriptions_update_own" ON public.subscriptions;
CREATE POLICY "subscriptions_update_own" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);


-- ====================== ERROR LOGS (лёгкий мониторинг ошибок без сторонних сервисов) ======================
DROP TABLE IF EXISTS public.error_logs CASCADE;
CREATE TABLE public.error_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message     TEXT NOT NULL,
  stack       TEXT,
  url         TEXT,
  user_id     UUID,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Писать может кто угодно (даже анонимный посетитель — у него тоже могут быть ошибки),
-- читать — только админ
DROP POLICY IF EXISTS "error_logs_insert_any" ON public.error_logs;
CREATE POLICY "error_logs_insert_any" ON public.error_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "error_logs_select_admin" ON public.error_logs;
CREATE POLICY "error_logs_select_admin" ON public.error_logs FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "error_logs_delete_admin" ON public.error_logs;
CREATE POLICY "error_logs_delete_admin" ON public.error_logs FOR DELETE USING (public.is_admin());


-- ====================== ЛОЯЛЬНОСТЬ: авто-начисление при завершении заказа ======================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS review_text TEXT; -- на случай если setup-wash-photos.sql ещё не запускали

CREATE OR REPLACE FUNCTION public.award_loyalty_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  new_points INT;
  new_tier TEXT;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE public.profiles
    SET
      total_washes  = COALESCE(total_washes, 0) + 1,
      total_spent   = COALESCE(total_spent, 0) + NEW.price,
      loyalty_points = COALESCE(loyalty_points, 0) + GREATEST(1, ROUND(NEW.price / 1000.0))
    WHERE id = NEW.user_id
    RETURNING loyalty_points INTO new_points;

    new_tier := CASE
      WHEN new_points >= 8000 THEN 'Platinum'
      WHEN new_points >= 3000 THEN 'Gold'
      WHEN new_points >= 1000 THEN 'Silver'
      ELSE 'Bronze'
    END;

    UPDATE public.profiles SET loyalty_tier = new_tier WHERE id = NEW.user_id AND loyalty_tier IS DISTINCT FROM new_tier;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_order_completed_award_loyalty ON public.orders;
CREATE TRIGGER on_order_completed_award_loyalty
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.award_loyalty_on_completion();


-- ====================== АВТО-ОТМЕНА зависших pending-заказов (>20 мин без мойщика) ======================
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.cancel_stale_pending_orders()
RETURNS void AS $$
DECLARE
  stale RECORD;
BEGIN
  FOR stale IN
    SELECT id, user_id, order_number FROM public.orders
    WHERE status = 'pending' AND created_at < NOW() - INTERVAL '20 minutes'
  LOOP
    UPDATE public.orders SET status = 'cancelled' WHERE id = stale.id;
    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (stale.user_id, 'system', 'Заказ отменён',
      'Заказ ' || stale.order_number || ' автоматически отменён — не нашлось свободного мойщика в течение 20 минут.');
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cancel-stale-orders';
SELECT cron.schedule('cancel-stale-orders', '*/5 * * * *', 'SELECT public.cancel_stale_pending_orders();');
