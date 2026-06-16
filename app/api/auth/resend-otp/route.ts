import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Rate limiting — simple in-memory map (production: use Redis)
const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || record.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (record.count >= 3) return false;
  record.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    const { contact, method } = await req.json();

    if (!contact || !method) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
    }

    // Rate limit: max 3 OTP per minute per contact
    if (!checkRateLimit(contact)) {
      return NextResponse.json(
        { error: "Слишком много попыток. Подождите минуту." },
        { status: 429 }
      );
    }

    const supabase = createClient();

    const { error } =
      method === "email"
        ? await supabase.auth.signInWithOtp({ email: contact })
        : await supabase.auth.signInWithOtp({ phone: contact });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
