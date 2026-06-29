-- ====================================================
-- Запустите в Supabase SQL Editor (после setup-worker-flow-v2.sql)
-- 1) Если ВСЕ онлайн-мойщики отклонили заказ — отменяем сразу, не ждём 5 часов
-- 2) Админ может восстановить такой заказ обратно в ожидающие
-- ====================================================

-- 1. reject_order теперь дополнительно проверяет: отклонили ли уже все,
--    кто сейчас онлайн — и если да, сразу отменяет заказ с уведомлением клиенту
create or replace function public.reject_order(p_order_id uuid, p_worker_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_order record;
  v_online_workers uuid[];
begin
  update public.orders
  set rejected_by = array_append(rejected_by, p_worker_id)
  where id = p_order_id
    and not (p_worker_id = any(rejected_by))
  returning id, user_id, order_number, status, rejected_by into v_order;

  if v_order.id is null or v_order.status <> 'pending' then
    return;
  end if;

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

-- 2. Восстановление отменённого заказа админом — возвращает в "pending",
--    сбрасывает список отклонивших (даёт им второй шанс взять заказ)
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
  set status = 'pending', rejected_by = '{}', cancel_reason = null
  where id = p_order_id;
end;
$$;

grant execute on function public.restore_order(uuid) to authenticated;
