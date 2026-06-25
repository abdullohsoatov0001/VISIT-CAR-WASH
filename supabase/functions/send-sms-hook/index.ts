// Supabase Auth "Send SMS hook" — вызывается Supabase вместо встроенного
// SMS-провайдера (Twilio и т.п. не поддерживают узбекские номера нативно).
// Отправляет код через Eskiz.uz. Настройка — см. README.md в этой папке.

const ESKIZ_EMAIL    = Deno.env.get("ESKIZ_EMAIL")!;
const ESKIZ_PASSWORD = Deno.env.get("ESKIZ_PASSWORD")!;
const HOOK_SECRET     = Deno.env.get("SEND_SMS_HOOK_SECRET")!; // формат: v1,whsec_xxxxx

type HookPayload = {
  user: { id: string; phone?: string };
  sms: { otp: string };
};

async function verifySignature(req: Request, body: string): Promise<boolean> {
  const id        = req.headers.get("webhook-id");
  const timestamp = req.headers.get("webhook-timestamp");
  const signature = req.headers.get("webhook-signature");
  if (!id || !timestamp || !signature) return false;

  const secretB64 = HOOK_SECRET.split("_")[1] ?? HOOK_SECRET;
  const secretBytes = Uint8Array.from(atob(secretB64), (c) => c.charCodeAt(0));

  const signedContent = `${id}.${timestamp}.${body}`;
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));

  return signature.split(" ").some((part) => part.split(",")[1] === expected);
}

async function eskizLogin(): Promise<string> {
  const res = await fetch("https://notify.eskiz.uz/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ESKIZ_EMAIL, password: ESKIZ_PASSWORD }),
  });
  if (!res.ok) throw new Error("Eskiz login failed: " + (await res.text()));
  const data = await res.json();
  return data.data.token as string;
}

async function eskizSendSms(token: string, phone: string, message: string) {
  const res = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ mobile_phone: phone.replace(/\D/g, ""), message, from: "4546" }),
  });
  if (!res.ok) throw new Error("Eskiz send failed: " + (await res.text()));
}

Deno.serve(async (req: Request) => {
  const body = await req.text();

  if (!(await verifySignature(req, body))) {
    return new Response(JSON.stringify({ error: { http_code: 401, message: "Invalid signature" } }), { status: 401 });
  }

  const payload = JSON.parse(body) as HookPayload;
  const phone = payload.user.phone;
  const otp = payload.sms.otp;

  if (!phone) {
    return new Response(JSON.stringify({ error: { http_code: 400, message: "No phone number" } }), { status: 400 });
  }

  try {
    const token = await eskizLogin();
    await eskizSendSms(token, phone, `Wash Go: ваш код подтверждения — ${otp}`);
    return new Response(JSON.stringify({}), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: { http_code: 500, message: String(e) } }), { status: 500 });
  }
});
