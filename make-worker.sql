-- Замени 'worker@test.com' на нужный email
-- Сначала зарегистрируй пользователя через /register, потом запусти это

UPDATE public.profiles
SET role = 'WORKER'
WHERE id = (SELECT id FROM auth.users WHERE email = 'worker@test.com');

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "WORKER"}'::jsonb
WHERE email = 'worker@test.com';

-- Проверить результат:
SELECT au.email, p.name, p.role
FROM auth.users au
JOIN public.profiles p ON p.id = au.id;
