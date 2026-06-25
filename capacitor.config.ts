import type { CapacitorConfig } from '@capacitor/cli';

// Приложение не собирает статический сайт внутри APK — оно открывает
// живой сайт Next.js (с API-роутами, middleware, SSR) в нативной обёртке.
// Поэтому webDir почти не используется, а ключевой параметр — server.url.
// Перед сборкой подставьте сюда домен задеплоенного сайта (или ngrok для теста).
const SERVER_URL = process.env.CAPACITOR_SERVER_URL || 'https://wash-go-ebon.vercel.app';

const config: CapacitorConfig = {
  appId: 'uz.washgo.app',
  appName: 'Wash Go',
  webDir: 'public',
  server: {
    url: SERVER_URL,
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    // Без этого фоновый GPS-плагин останавливается через 5 минут в фоне
    useLegacyBridge: true,
  },
};

export default config;
