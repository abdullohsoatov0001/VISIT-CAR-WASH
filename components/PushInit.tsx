"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { createClient } from "@/lib/supabase/client";

// Регистрирует устройство на push (Android, через FCM) и сохраняет токен
// в profiles.push_token, чтобы сервер мог слать уведомления, когда приложение
// свёрнуто/закрыто. На вебе (washgo.online в браузере) ничего не делает —
// там уведомления видны только через realtime внутри открытой страницы.
export default function PushInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let registrationListener: { remove: () => void } | undefined;
    let errorListener: { remove: () => void } | undefined;
    let authSub: { unsubscribe: () => void } | undefined;

    (async () => {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const supabase = createClient();

      const perm = await PushNotifications.checkPermissions();
      if (perm.receive !== "granted") {
        const req = await PushNotifications.requestPermissions();
        if (req.receive !== "granted") return;
      }

      registrationListener = await PushNotifications.addListener("registration", async (token) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.from("profiles").update({ push_token: token.value }).eq("id", session.user.id);
        }
      });

      errorListener = await PushNotifications.addListener("registrationError", (err) => {
        console.error("Push registration error:", err);
      });

      await PushNotifications.register();

      // На общем устройстве после смены аккаунта (выход/вход) переотправляем
      // тот же токен — re-register() недорог и идёт через уже выданное OS разрешение,
      // а событие "registration" выше перезапишет push_token на нового пользователя
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN") PushNotifications.register();
      });
      authSub = data.subscription;
    })();

    return () => {
      registrationListener?.remove();
      errorListener?.remove();
      authSub?.unsubscribe();
    };
  }, []);

  return null;
}
