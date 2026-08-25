import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { tgSendMessage } from "@/lib/telegram";

// Вызывается триггером БД при создании любого заказа (сайт / бот / Mini App).
// Шлёт уведомление о новом заказе всем админам, подключившим Telegram.

const PAYMENT_LABELS: Record<string, string> = {
  card: "💳 Карта", click: "🟢 Click", payme: "🔵 Payme", cash: "💵 Наличные", subscription: "🎫 Абонемент",
};

export async function POST(req: NextRequest) {
  const { orderId } = await req.json().catch(() => ({ orderId: null }));
  if (!orderId) return NextResponse.json({ ok: false }, { status: 400 });

  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: order } = await db
    .from("orders")
    .select("order_number, service_type, price, location_name, client_phone, payment_method, user_id, created_at")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ ok: true });

  // Защита от повторного вызова со старым id — реагируем только на свежие заказы
  if (order.created_at && Date.now() - new Date(order.created_at).getTime() > 5 * 60 * 1000) {
    return NextResponse.json({ ok: true, skipped: "stale" });
  }

  const { data: admins } = await db
    .from("profiles")
    .select("telegram_chat_id")
    .eq("role", "ADMIN")
    .not("telegram_chat_id", "is", null);
  if (!admins || admins.length === 0) return NextResponse.json({ ok: true, skipped: "no admins" });

  const { data: client } = await db.from("profiles").select("name").eq("id", order.user_id).maybeSingle();

  const pay = PAYMENT_LABELS[order.payment_method ?? ""] ?? order.payment_method ?? "—";
  const text =
    `🔔 <b>Новый заказ ${order.order_number}</b>\n\n` +
    `${order.service_type} — <b>${Number(order.price).toLocaleString("ru-RU")} so'm</b>\n` +
    `📍 ${order.location_name || "адрес не указан"}\n` +
    `👤 ${client?.name ?? "клиент"}${order.client_phone ? " · " + order.client_phone : ""}\n` +
    `${pay}`;

  // Кнопки: назначить заказ конкретному мойщику прямо из Telegram.
  // callback_data = "asg:<orderId>:<первые 8 символов id мойщика>" (укладываемся в лимит 64 байт)
  const { data: allWorkers } = await db.from("profiles").select("id, name").eq("role", "WORKER").order("name");
  const buttons = (allWorkers ?? []).map((w) => [{ text: `👤 Назначить: ${w.name}`, callback_data: `asg:${orderId}:${(w.id as string).slice(0, 8)}` }]);
  const markup = buttons.length > 0 ? { inline_keyboard: buttons } : undefined;

  await Promise.all(admins.map((a) => tgSendMessage(a.telegram_chat_id as number, text, markup)));

  return NextResponse.json({ ok: true, sent: admins.length });
}
