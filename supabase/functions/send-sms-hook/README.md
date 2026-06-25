# Send SMS Hook — Eskiz.uz

Заменяет встроенный SMS-провайдер Supabase (не поддерживает узбекские номера)
на Eskiz.uz. Supabase вызывает эту функцию вместо отправки SMS сама.

## 1. Завести аккаунт Eskiz.uz

1. Зарегистрируйтесь на https://eskiz.uz (есть тестовый режим — SMS уходят
   только на ваш собственный номер, пока шаблон сообщения не одобрят).
2. В личном кабинете возьмите email и пароль для API (это и есть
   `ESKIZ_EMAIL` / `ESKIZ_PASSWORD` ниже — не путать с паролем от сайта,
   если Eskiz выдаёт отдельные API-данные).
3. Чтобы отправлять `Wash Go: ваш код подтверждения — 123456` не только на
   свой номер, отправьте этот текст шаблоном на одобрение в кабинете Eskiz
   (раздел "Шаблоны"/"Templates"). До одобрения SMS будут уходить только
   на номер, привязанный к аккаунту Eskiz — этого достаточно для тестов.

## 2. Установить Supabase CLI и привязать проект (если ещё не сделано)

```bash
npm i -g supabase
supabase login
supabase link --project-ref <ваш-project-ref>   # ref виден в Supabase Dashboard → Settings → General
```

## 3. Задать секреты функции

```bash
supabase secrets set ESKIZ_EMAIL=ваш_email ESKIZ_PASSWORD=ваш_пароль
```

`SEND_SMS_HOOK_SECRET` зададите на шаге 5 — Supabase сгенерирует его сам.

## 4. Задеплоить функцию

```bash
supabase functions deploy send-sms-hook --no-verify-jwt
```

`--no-verify-jwt` обязателен: Supabase вызывает хук без JWT, подлинность
проверяется подписью (`webhook-signature`), которую функция сама проверяет.

## 5. Подключить хук в Supabase Dashboard

1. **Authentication → Hooks** → найдите **Send SMS hook** → Enable.
2. Type: **HTTPS**, URL — адрес задеплоенной функции (Supabase покажет его
   после `functions deploy`, обычно
   `https://<project-ref>.supabase.co/functions/v1/send-sms-hook`).
3. Supabase покажет **Secret** в формате `v1,whsec_...` — скопируйте и
   задайте его функции:
   ```bash
   supabase secrets set SEND_SMS_HOOK_SECRET="v1,whsec_..."
   ```
   и передеплойте: `supabase functions deploy send-sms-hook --no-verify-jwt`.

## 6. Включить вход по телефону

**Authentication → Providers → Phone** → Enable. SMS provider можно оставить
любым (хук подменяет фактическую отправку), главное чтобы Phone-провайдер
был включён.

## 7. Проверка

Зарегистрируйтесь на сайте по номеру — должно прийти SMS с кодом. Если не
пришло, смотрите логи: `supabase functions logs send-sms-hook`.
