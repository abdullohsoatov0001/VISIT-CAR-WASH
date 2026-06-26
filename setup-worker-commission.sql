-- Запустите в Supabase SQL Editor
-- Комиссия платформы: мойщик получает 50% от Standard-заказов и 45% от
-- Premium/VIP. Доля фиксируется на заказе в момент создания (а не считается
-- задним числом из price/service_type), чтобы будущие изменения цен или
-- процентов не задевали уже оформленные заказы.

alter table public.orders add column if not exists worker_earning numeric;
