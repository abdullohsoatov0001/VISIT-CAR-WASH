// Fire-and-forget push-уведомление поверх уже создаваемой записи в
// notifications (та видна внутри открытого приложения через realtime;
// push доходит и когда приложение свёрнуто/закрыто — см. lib/push.ts).
export function sendPush(userId: string, title: string, body: string) {
  fetch("/api/notify/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, title, body }),
  }).catch(() => {});
}
