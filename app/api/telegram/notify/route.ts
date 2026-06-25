import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { tgSendMessage, tgSendPhotos } from "@/lib/telegram";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

type Status = "accepted" | "en_route" | "in_progress" | "completed" | "cancelled";

function buildMessage(status: Status, orderNumber: string, workerName: string | null) {
  switch (status) {
    case "accepted":
      return `👷 ${workerName ?? "Мойщик"} принял ваш заказ <b>${orderNumber}</b> и скоро будет в пути.`;
    case "en_route":
      return `🚗 ${workerName ?? "Мойщик"} едет к вам по заказу <b>${orderNumber}</b>.\nСледить на карте: ${APP_URL}/dashboard/tracking`;
    case "in_progress":
      return `✨ Мойка по заказу <b>${orderNumber}</b> началась.`;
    case "completed":
      return `✅ Заказ <b>${orderNumber}</b> завершён! Сравните фото до/после и оцените мойщика: ${APP_URL}/dashboard/tracking`;
    case "cancelled":
      return `⚠️ Ищем нового мойщика для заказа <b>${orderNumber}</b> — текущий не смог выполнить заказ.`;
  }
}

const ratingKeyboard = (orderId: string) => ({
  inline_keyboard: [
    [1, 2, 3, 4, 5].map((n) => ({ text: "⭐".repeat(n), callback_data: `rate:${orderId}:${n}` })),
    [{ text: "🔄 Новый заказ", callback_data: "menu" }],
  ],
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { orderId, status, photos } = await req.json() as { orderId: string; status: Status; photos?: string[] };
  if (!orderId || !status) return NextResponse.json({ ok: false }, { status: 400 });

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { data: caller } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (caller?.role !== "WORKER" && caller?.role !== "ADMIN") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  const { data: order } = await admin
    .from("orders")
    .select("order_number, worker_name, user_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return NextResponse.json({ ok: true });

  const { data: profile } = await admin
    .from("profiles")
    .select("telegram_chat_id")
    .eq("id", order.user_id)
    .maybeSingle();
  if (!profile?.telegram_chat_id) return NextResponse.json({ ok: true });

  const chatId = profile.telegram_chat_id;
  await tgSendMessage(chatId, buildMessage(status, order.order_number, order.worker_name));

  if (photos && photos.length > 0) {
    const caption = status === "in_progress" ? "📸 Фото до мойки" : "✨ Фото после мойки";
    await tgSendPhotos(chatId, photos, caption);
  }

  if (status === "completed") {
    await tgSendMessage(chatId, "Оцените мойщика:", ratingKeyboard(orderId));
  }

  return NextResponse.json({ ok: true });
}
