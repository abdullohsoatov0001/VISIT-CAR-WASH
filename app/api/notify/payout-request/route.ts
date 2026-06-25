import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, payoutRequestEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { workerName, amount } = await req.json();
  if (!workerName || !amount) {
    return NextResponse.json({ error: "workerName и amount обязательны" }, { status: 400 });
  }

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "ADMIN");

  await Promise.all(
    (admins ?? []).map(async (a) => {
      const { data } = await admin.auth.admin.getUserById(a.id);
      if (!data.user?.email) return;
      await sendEmail(
        data.user.email,
        `Запрос на вывод ${Number(amount).toLocaleString("ru-RU")} so'm — ${workerName}`,
        payoutRequestEmail({ workerName, amount: Number(amount) })
      ).catch((e) => console.error("Payout request email failed:", e));
    })
  );

  return NextResponse.json({ success: true });
}
