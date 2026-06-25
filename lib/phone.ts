// Узбекские номера везде в проекте хранятся как 12 цифр без "+" (998XXXXXXXXX) —
// см. normalizePhone в app/api/telegram/webhook/route.ts. Supabase Auth же
// требует E.164 с "+", поэтому для auth-вызовов используем toE164().
export function normalizePhoneDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("998")) return digits;
  if (digits.startsWith("8") && digits.length === 9) digits = digits.slice(1);
  if (digits.length === 9) return "998" + digits;
  return digits;
}

export function toE164(raw: string): string {
  return `+${normalizePhoneDigits(raw)}`;
}

export function isValidUzPhone(raw: string): boolean {
  return /^998\d{9}$/.test(normalizePhoneDigits(raw));
}

export function formatPhoneDisplay(raw: string): string {
  const digits = normalizePhoneDigits(raw);
  if (digits.length !== 12) return raw;
  return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
}
