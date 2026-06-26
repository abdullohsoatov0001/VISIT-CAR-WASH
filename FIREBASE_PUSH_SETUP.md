# Push-уведомления (Android) — настройка Firebase

Android-приложение Wash Go уже подготовлено к push (разрешения, Gradle-плагин
подключаются автоматически при наличии `google-services.json`). Осталось
завести Firebase-проект и подключить его — это разовая ручная настройка,
дальше всё работает само.

## 1. Создать проект в Firebase

1. Откройте https://console.firebase.google.com → **Add project**.
2. Назовите как угодно (например "Wash Go"), Google Analytics не обязателен.

## 2. Добавить Android-приложение в проект

1. В настройках проекта → **Add app** → Android.
2. **Package name**: `uz.washgo.app` (важно — должен совпадать точно).
3. Скачайте **`google-services.json`**.
4. Положите этот файл в `android/app/google-services.json` (рядом с
   `build.gradle` в папке app — он уже настроен подхватывать этот файл
   автоматически, см. `android/app/build.gradle`).

## 3. Получить ключ для отправки уведомлений с сервера

1. **Project settings → Service accounts → Generate new private key**.
2. Скачается JSON-файл — это секрет, не публикуйте его и не коммитьте в git.
3. Откройте файл, скопируйте содержимое целиком (это и есть значение для
   `FIREBASE_SERVICE_ACCOUNT_JSON`).

## 4. Задать переменную окружения в Vercel

```bash
vercel env add FIREBASE_SERVICE_ACCOUNT_JSON production
```
Вставьте содержимое скачанного JSON-файла одной строкой, когда попросит
(CLI спросит значение — можно вставить весь JSON целиком, он валиден как
одна строка). Без этой переменной отправка push молча пропускается
(остальной функционал работает как обычно, просто без push).

## 5. Пересобрать Android-приложение

После того как `google-services.json` лежит в `android/app/`:
```bash
npx cap sync android
cd android && ./gradlew assembleRelease   # или открыть в Android Studio и собрать там
```

## 6. Проверка

Установите приложение на телефон, войдите в аккаунт — токен устройства
сохранится в `profiles.push_token` (см. `components/PushInit.tsx`). Дальше
любое событие (заказ принят, мойщик в пути, оплата подтверждена, выплата
обработана и т.д.) присылает push, даже если приложение свёрнуто.
