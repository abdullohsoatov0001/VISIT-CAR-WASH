-- Запустите в Supabase SQL Editor
-- Переход регистрации/входа с email на номер телефона.
-- handle_new_user() раньше брал имя из email (split_part(email, '@', 1)) —
-- при регистрации по телефону email отсутствует, нужен фоллбэк на телефон.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- profiles.phone хранится как цифры без "+" (как везде в проекте),
  -- а new.phone приходит от Supabase Auth в формате E.164 ("+998...")
  insert into public.profiles (id, name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.phone, 'User'),
    regexp_replace(coalesce(new.phone, ''), '\D', '', 'g'),
    coalesce(new.raw_user_meta_data->>'role', 'USER')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Триггер уже создан в supabase-schema.sql — пересоздавать не нужно,
-- create or replace function выше достаточно.
