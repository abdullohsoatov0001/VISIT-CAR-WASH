import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, workerWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  );

  const { name, email, password, phone } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email и password обязательны" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Пароль минимум 6 символов" }, { status: 400 });
  }

  // Create auth user (bypasses email confirmation)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { name: name.trim(), role: "WORKER" },
  });

  if (authError) {
    const msg = authError.message.includes("already registered") || authError.message.includes("already been registered")
      ? "Этот email уже зарегистрирован"
      : authError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Create profile with WORKER role
  const { error: profileError } = await supabase.from("profiles").upsert({
    id:    authData.user.id,
    name:  name.trim(),
    role:  "WORKER",
    phone: phone?.trim() || null,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  sendEmail(
    email.trim().toLowerCase(),
    "Доступ к личному кабинету Wash Go",
    workerWelcomeEmail({ name: name.trim(), email: email.trim().toLowerCase(), password })
  ).catch((e) => console.error("Welcome email failed:", e));

  return NextResponse.json({ success: true, id: authData.user.id });
}
