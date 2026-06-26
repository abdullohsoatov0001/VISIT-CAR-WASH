import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendPush } from "@/lib/push";

export async function POST(req: NextRequest) {
  const { userId, title, body, data } = await req.json();
  if (!userId || !title || !body) {
    return NextResponse.json({ error: "userId, title и body обязательны" }, { status: 400 });
  }

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: profile } = await admin.from("profiles").select("push_token").eq("id", userId).maybeSingle();

  if (!profile?.push_token) {
    return NextResponse.json({ skipped: true });
  }

  try {
    await sendPush(profile.push_token, title, body, data);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Push send failed:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
