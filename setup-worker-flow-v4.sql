-- ====================================================
-- Запустите в Supabase SQL Editor (после v2 и v3)
-- ИСПРАВЛЕНИЯ БЕЗОПАСНОСТИ И ЛОГИКИ:
-- 1) reject_order больше НЕ доверяет p_worker_id от клиента — берёт auth.uid().
--    (Иначе любой авторизованный юзер мог подделать отклонения за других
--     мойщиков и принудительно отменить любой заказ через "все отклонили".)
-- 2) Таймер авто-отмены теперь считается от pending_since, а не created_at,
--    чтобы восстановленный админом заказ не отменялся cron'ом сразу снова
--    (и чтобы не портить реальное время создания заказа).
-- ====================================================

-- 0. Метка "когда заказ попал/вернулся в ожидание". Для существующих строк
--    выставится время миграции — таймер для них стартует заново один раз.
alter table public.orders add column if not exists pending_since timestamptz not null default now();

-- 1. Безопасная версия reject_order.
--    p_worker_id оставлен в сигнатуре только для обратной совместимости
--    вызова с клиента, но НЕ используется — реальный мойщик = auth.uid().
create or replace function public.reject_order(p_order_id uuid, p_worker_id uuid default null)
returns void
language plpgsql
security definer
as $$
declare
  v_worker_id uuid := auth.uid();
  v_order record;
  v_online_workers uuid[];
begin
  -- Отклонять может только сам авторизованный мойщик, за себя
  if v_worker_id is null then
    raise exception 'Not authenticated';
  end if;
  if not exists (select 1 from public.profiles where id = v_worker_id and role = 'WORKER') then
    raise exception 'Only workers can reject orders';
  end if;

  update public.orders
  set rejected_by = array_append(rejected_by, v_worker_id)
  where id = p_order_id
    and status = 'pending'
    and not (v_worker_id = any(rejected_by))
  returning id, user_id, order_number, status, rejected_by into v_order;

  if v_order.id is null then
    return;
  end if;

  -- Отменяем сразу, только если ВСЕ онлайн-мойщики уже отклонили
  select array_agg(id) into v_online_workers
  from public.profiles
  where role = 'WORKER' and is_active = true;

  if v_online_workers is not null
     and array_length(v_online_workers, 1) > 0
     and v_order.rejected_by @> v_online_workers then

    update public.orders
    set status = 'cancelled', cancel_reason = 'all_rejected'
    where id = v_order.id;

    insert into public.notifications (user_id, type, title, body)
    values (
      v_order.user_id,
      'order',
      'Заказ отменён',
      format('Все доступные мойщики сейчас заняты и не смогли взять заказ %s. Попробуйте создать заказ ещё раз.', v_order.order_number)
    );

    perform net.http_post(
      url := 'https://www.washgo.online/api/notify/push',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'userId', v_order.user_id,
        'title', 'Заказ отменён',
        'body', format('Все доступные мойщики заняты. Попробуйте снова заказ %s.', v_order.order_number)
      )
    );
  end if;
end;
$$;

grant execute on function public.reject_order(uuid, uuid) to authenticated;

-- 2. Авто-отмена: считаем от pending_since (а не created_at)
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
      and coalesce(pending_since, created_at) < now() - v_timeout
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

-- 3. Восстановление заказа админом — сбрасываем таймер через pending_since,
--    НЕ трогая реальное created_at.
create or replace function public.restore_order(p_order_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN') then
    raise exception 'Forbidden';
  end if;

  update public.orders
  set status = 'pending',
      rejected_by = '{}',
      cancel_reason = null,
      pending_since = now()
  where id = p_order_id;
end;
$$;

grant execute on function public.restore_order(uuid) to authenticated;
