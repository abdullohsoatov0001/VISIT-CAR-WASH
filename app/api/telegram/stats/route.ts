import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Дашборд-статистика для Telegram Mini App. Определяет пользователя по
// подписанному initData от Telegram и отдаёт статистику под его роль.

function verifyInitData(initData: string, botToken: string): { id: number } | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;
    params.delete("hash");
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const computed = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
    if (computed !== hash) return null;
    const user = JSON.parse(params.get("user") ?? "{}");
    return typeof user.id === "number" ? { id: user.id } : null;
  } catch {
    return null;
  }
}

const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");

export async function POST(req: NextRequest) {
  const { initData } = await req.json().catch(() => ({ initData: "" }));
  const tgUser = verifyInitData(initData ?? "", process.env.TELEGRAM_BOT_TOKEN!);
  if (!tgUser) return NextResponse.json({ ok: false, error: "invalid" }, { status: 401 });

  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: profile } = await db.from("profiles").select("id, name, role").eq("telegram_chat_id", tgUser.id).maybeSingle();
  if (!profile) return NextResponse.json({ ok: true, connected: false });

  const roleLabel: Record<string, string> = { USER: "Клиент", WORKER: "Мойщик", ADMIN: "Администратор" };
  let tiles: { label: string; value: string; accent?: boolean }[] = [];

  if (profile.role === "WORKER") {
    const { data: done } = await db.from("orders").select("price, worker_earning, user_rating").eq("worker_id", profile.id).eq("status", "completed");
    const rows = done ?? [];
    const earnings = rows.reduce((s, o) => s + (o.worker_earning ?? o.price ?? 0), 0);
    const rated = rows.filter((o) => o.user_rating != null);
    const avg = rated.length ? rated.reduce((s, o) => s + (o.user_rating as number), 0) / rated.length : 0;
    const { count: active } = await db.from("orders").select("*", { count: "exact", head: true }).eq("worker_id", profile.id).in("status", ["accepted", "en_route", "in_progress"]);
    tiles = [
      { label: "Выполнено моек", value: fmt(rows.length) },
      { label: "Заработано, so'm", value: fmt(earnings), accent: true },
      { label: "Рейтинг", value: avg ? `${avg.toFixed(1)} ⭐` : "—" },
      { label: "Активных заказов", value: fmt(active ?? 0) },
    ];
  } else if (profile.role === "ADMIN") {
    const { count: total } = await db.from("orders").select("*", { count: "exact", head: true });
    const { count: pending } = await db.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending");
    const { data: completed } = await db.from("orders").select("price").eq("status", "completed");
    const revenue = (completed ?? []).reduce((s, o) => s + (o.price ?? 0), 0);
    const { count: workers } = await db.from("profiles").select("*", { count: "exact", head: true }).eq("role", "WORKER");
    const { count: clients } = await db.from("profiles").select("*", { count: "exact", head: true }).eq("role", "USER");
    tiles = [
      { label: "Заказов всего", value: fmt(total ?? 0) },
      { label: "В ожидании", value: fmt(pending ?? 0) },
      { label: "Выполнено", value: fmt((completed ?? []).length) },
      { label: "Выручка, so'm", value: fmt(revenue), accent: true },
      { label: "Мойщиков", value: fmt(workers ?? 0) },
      { label: "Клиентов", value: fmt(clients ?? 0) },
    ];
  } else {
    // Клиент
    const { data: mine } = await db.from("orders").select("price, status").eq("user_id", profile.id);
    const rows = mine ?? [];
    const completed = rows.filter((o) => o.status === "completed");
    const spent = completed.reduce((s, o) => s + (o.price ?? 0), 0);
    const active = rows.filter((o) => !["completed", "cancelled"].includes(o.status)).length;
    tiles = [
      { label: "Всего заказов", value: fmt(rows.length) },
      { label: "Выполнено", value: fmt(completed.length) },
      { label: "Потрачено, so'm", value: fmt(spent), accent: true },
      { label: "Активных", value: fmt(active) },
    ];
  }

  return NextResponse.json({ ok: true, connected: true, name: profile.name, role: profile.role, roleLabel: roleLabel[profile.role] ?? profile.role, tiles });
}
