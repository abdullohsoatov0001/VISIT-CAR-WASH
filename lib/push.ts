import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Настройка — см. FIREBASE_PUSH_SETUP.md.
// Без FIREBASE_SERVICE_ACCOUNT_JSON отправка молча пропускается (не ошибка),
// чтобы остальной флоу (создание заказа, выплаты и т.д.) не падал из-за этого.
function messaging() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return null;

  if (!getApps().length) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
    });
  }
  return getMessaging();
}

export async function sendPush(token: string, title: string, body: string, data?: Record<string, string>) {
  const m = messaging();
  if (!m) {
    console.warn("FIREBASE_SERVICE_ACCOUNT_JSON не задан — push не отправлен:", title);
    return;
  }
  await m.send({ token, notification: { title, body }, data });
}
