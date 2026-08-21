-- ====================================================
-- Запустите в Supabase SQL Editor
-- Уведомление админам в Telegram о КАЖДОМ новом заказе
-- (сайт / бот / Mini App — не важно откуда).
-- Требует расширение pg_net (обычно уже включено на Supabase).
-- ====================================================

create extension if not exists pg_net;

create or replace function public.notify_new_order_telegram()
returns trigger
language plpgsql
security definer
as $$
begin
  perform net.http_post(
    url := 'https://wash-go-ebon.vercel.app/api/telegram/new-order',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('orderId', new.id)
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_new_order_telegram on public.orders;
create trigger trg_notify_new_order_telegram
  after insert on public.orders
  for each row execute procedure public.notify_new_order_telegram();
