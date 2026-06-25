import { Capacitor, CapacitorHttp, registerPlugin } from "@capacitor/core";
import type { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { createClient } from "@/lib/supabase/client";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

type LocationUpdate = {
  lat: number;
  lng: number;
  speedKmh: number | null;
  heading: number | null;
};

// На native-сборке после ~5 мин в фоне Android душит обычные fetch/XHR из WebView,
// поэтому шлём апдейт через нативный HTTP-мост (CapacitorHttp), а не через supabase-js.
async function sendViaNativeHttp(orderId: string, loc: LocationUpdate) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  await CapacitorHttp.patch({
    url: `${url}/rest/v1/orders`,
    params: { id: `eq.${orderId}` },
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    data: {
      worker_lat: loc.lat,
      worker_lng: loc.lng,
      worker_speed: loc.speedKmh,
      worker_heading: loc.heading,
      worker_location_updated_at: new Date().toISOString(),
    },
  });
}

async function sendViaSupabaseJs(orderId: string, loc: LocationUpdate) {
  const supabase = createClient();
  await supabase
    .from("orders")
    .update({
      worker_lat: loc.lat,
      worker_lng: loc.lng,
      worker_speed: loc.speedKmh,
      worker_heading: loc.heading,
      worker_location_updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
}

/**
 * Делится живой геопозицией мойщика, пока активен переданный orderId.
 * На native (Capacitor) использует фоновый GPS-плагин + нативный HTTP —
 * работает, даже если приложение свёрнуто или экран заблокирован.
 * В обычном браузере — обычный navigator.geolocation.watchPosition.
 */
export function startWorkerLocationSharing(orderId: string): () => void {
  let lastSent = 0;
  const THROTTLE_MS = 1500;

  const send = (loc: LocationUpdate) => {
    const now = Date.now();
    if (now - lastSent < THROTTLE_MS) return;
    lastSent = now;
    const task = Capacitor.isNativePlatform() ? sendViaNativeHttp(orderId, loc) : sendViaSupabaseJs(orderId, loc);
    task.catch((err) => console.error("Не удалось отправить геопозицию мойщика:", err));
  };

  if (Capacitor.isNativePlatform()) {
    let watcherId: string | null = null;
    let stopped = false;

    BackgroundGeolocation.addWatcher(
      {
        backgroundTitle: "Wash Go — заказ активен",
        backgroundMessage: "Делимся вашей геопозицией с клиентом, пока вы в пути",
        requestPermissions: true,
        stale: false,
        distanceFilter: 15,
      },
      (location, error) => {
        if (error || !location || stopped) return;
        send({
          lat: location.latitude,
          lng: location.longitude,
          speedKmh: location.speed != null ? location.speed * 3.6 : null,
          heading: location.bearing,
        });
      }
    ).then((id) => {
      if (stopped) {
        BackgroundGeolocation.removeWatcher({ id });
      } else {
        watcherId = id;
      }
    });

    return () => {
      stopped = true;
      if (watcherId) BackgroundGeolocation.removeWatcher({ id: watcherId });
    };
  }

  if (!("geolocation" in navigator)) return () => {};

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      send({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        speedKmh: pos.coords.speed != null ? pos.coords.speed * 3.6 : null,
        heading: pos.coords.heading,
      });
    },
    () => {},
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}
