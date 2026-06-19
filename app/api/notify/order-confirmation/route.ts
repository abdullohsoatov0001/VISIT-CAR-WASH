import { NextRequest, NextResponse } from "next/server";
import { sendEmail, orderConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email, orderNumber, serviceType, price, locationName } = await req.json();

  if (!email || !orderNumber || !serviceType) {
    return NextResponse.json({ error: "email, orderNumber и serviceType обязательны" }, { status: 400 });
  }

  await sendEmail(
    email,
    `Заказ ${orderNumber} принят — VISIT`,
    orderConfirmationEmail({ orderNumber, serviceType, price: price ?? 0, locationName: locationName ?? "" })
  ).catch((e) => console.error("Order confirmation email failed:", e));

  return NextResponse.json({ success: true });
}
