-- ====================================================
-- Запустите в Supabase SQL Editor
-- 1) Отклонённые заказы пропадают только у того мойщика, который отклонил
-- 2) Метка адреса (Дом/Работа/...) — чтобы мойщик видел тип адреса
-- 3) Автоотмена заказа, если за N минут не нашёлся мойщик + уведомление клиенту
-- ====================================================

-- 1. Кто отклонил заказ (массив id мойщиков)
alter table public.orders add column if not exists rejected_by uuid[] not null default '{}';

-- 2. Тип адреса (берётся из сохранённого адреса клиента, если был выбран)
alter table public.orders add column if not exists address_label text;

-- 3. Причина отмены (для истории/админки)
alter table public.orders add column if not exists cancel_reason text;

-- 4. Атомарная функция отклонения — без неё параллельные отклонения от
--    разных мойщиков могли бы затирать друг друга при обычном update
create or replace function public.reject_order(p_order_id uuid, p_worker_id uuid)
returns void
language sql
security definer
as $$
  update public.orders
  set rejected_by = array_append(rejected_by, p_worker_id)
  where id = p_order_id
    and not (p_worker_id = any(rejected_by));
$$;

grant execute on function public.reject_order(uuid, uuid) to authenticated;

-- 5. Автоотмена заказов, которые слишком долго висят в "pending"
--    (мойщик не нашёлся за PENDING_TIMEOUT) + уведомление клиенту
create or replace function public.expire_stale_orders()
returns void
language plpgsql
security definer
as $$
declare
  v_timeout interval := interval '5 hours';
  v_order record;
begin
  for v_order in
    select id, user_id, order_number
    from public.orders
    where status = 'pending'
      and worker_id is null
      and created_at < now() - v_timeout
  loop
    update public.orders
    set status = 'cancelled', cancel_reason = 'no_worker_timeout'
    where id = v_order.id;

    insert into public.notifications (user_id, type, title, body)
    values (
      v_order.user_id,
      'order',
      'Заказ отменён',
      format('Не нашлось свободного мойщика для заказа %s в течение 5 часов. Попробуйте создать заказ ещё раз.', v_order.order_number)
    );

    -- Push-уведомление через наш API (если у клиента есть push_token — иначе тихо пропустится)
    perform net.http_post(
      url := 'https://www.washgo.online/api/notify/push',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'userId', v_order.user_id,
        'title', 'Заказ отменён',
        'body', format('Не нашлось свободного мойщика для заказа %s. Попробуйте снова.', v_order.order_number)
      )
    );
  end loop;
end;
$$;

-- 6. Включаем расширения для фоновой задачи (на Supabase обычно уже доступны)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 7. Планируем запуск раз в 30 минут (таймаут — 5 часов, чаще проверять не нужно)
select cron.unschedule('expire-stale-orders') where exists (
  select 1 from cron.job where jobname = 'expire-stale-orders'
);
select cron.schedule('expire-stale-orders', '*/30 * * * *', 'select public.expire_stale_orders()');
