-- Запустите в Supabase SQL Editor
-- Назначает роль ADMIN пользователю по email

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'ADMIN')
WHERE email = 'tursunovsanjar10@gmail.com';

UPDATE public.profiles
SET role = 'ADMIN'
WHERE id = (SELECT id FROM auth.users WHERE email = 'tursunovsanjar10@gmail.com');
