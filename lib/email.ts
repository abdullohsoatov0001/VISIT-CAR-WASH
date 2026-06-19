import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Тестовый домен Resend — пока не подключён собственный домен в Resend Dashboard
const FROM = process.env.RESEND_FROM_EMAIL || "VISIT Car Wash <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY не задан — письмо не отправлено:", subject, "->", to);
    return { skipped: true };
  }
  return resend.emails.send({ from: FROM, to, subject, html });
}

export function orderConfirmationEmail(opts: {
  orderNumber: string;
  serviceType: string;
  price: number;
  locationName: string;
}) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#0EA5E9">Заказ ${opts.orderNumber} принят</h2>
      <p>Услуга: <b>${opts.serviceType}</b></p>
      <p>Адрес: ${opts.locationName || "—"}</p>
      <p>Сумма: <b>${opts.price.toLocaleString("ru-RU")} so'm</b></p>
      <p style="color:#888;font-size:13px">Мы ищем свободного мойщика. Следить за статусом можно в личном кабинете VISIT.</p>
    </div>
  `;
}

export function workerWelcomeEmail(opts: { name: string; email: string; password: string }) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#0EA5E9">Добро пожаловать в VISIT, ${opts.name}!</h2>
      <p>Для вас создан аккаунт мойщика. Данные для входа:</p>
      <p>Email: <b>${opts.email}</b><br/>Пароль: <b>${opts.password}</b></p>
      <p style="color:#888;font-size:13px">Войдите по адресу приложения и смените пароль в профиле.</p>
    </div>
  `;
}
