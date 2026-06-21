import { createClient } from "@/lib/supabase/client";

export async function logError(message: string, stack?: string) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from("error_logs").insert({
      message: message.slice(0, 2000),
      stack: stack?.slice(0, 4000) ?? null,
      url: typeof window !== "undefined" ? window.location.href : null,
      user_id: session?.user?.id ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    // мониторинг не должен сам ронять приложение
  }
}
