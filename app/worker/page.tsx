"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { MapPin, Bell, Car, Navigation, Phone, Check, X, Award, Power } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "@/lib/context/UserContext";
import { getInitials } from "@/lib/hooks/useUser";
import { formatEta, getClientCoords } from "@/lib/geo";

const NavigationView = dynamic(() => import("@/components/NavigationView"), { ssr: false });

type Order = {
  id: string;
  order_number: string;
  service_type: string;
  status: string;
  price: number;
  location_name: string;
  user_id: string;
  worker_id: string | null;
  worker_lat: number | null;
  worker_lng: number | null;
  worker_speed: number | null;
  worker_heading: number | null;
  client_lat: number | null;
  client_lng: number | null;
  created_at: string;
};

export default function WorkerDashboard() {
  const { profile } = useUserContext();

  const [online, setOnline]             = useState(false);
  const [toggling, setToggling]         = useState(false);
  const [pendingOrders, setPending]     = useState<Order[]>([]);
  const [activeOrder, setActiveOrder]   = useState<Order | null>(null);
  const [acceptingId, setAcceptingId]   = useState<string | null>(null);
  const [showNav, setShowNav]           = useState(false);

  const firstName = profile?.name?.split(" ")[0] ?? "Мойщик";
  const initials  = profile ? getInitials(profile.name) : "…";

  // Загрузка начального состояния
  useEffect(() => {
    if (!profile) return;
    const workerId = profile.id;
    setOnline(profile.is_active === true);

    const supabase = createClient();

    async function load() {
      // Активный заказ этого мойщика
      const { data: active } = await supabase
        .from("orders")
        .select("*")
        .eq("worker_id", workerId)
        .in("status", ["accepted", "en_route", "in_progress"])
        .maybeSingle();
      setActiveOrder(active ?? null);

      // Все ожидающие заказы
      const { data: pending } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      setPending(pending ?? []);
    }

    load();
  }, [profile?.id]);

  // Realtime подписка
  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`worker-${profile.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "orders",
        filter: "status=eq.pending",
      }, (payload) => {
        setPending(prev => [payload.new as Order, ...prev]);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
      }, (payload) => {
        const updated = payload.new as Order;

        // Убираем из pending если уже не ожидает
        if (updated.status !== "pending") {
          setPending(prev => prev.filter(o => o.id !== updated.id));
        }

        // Этот мойщик принял заказ
        if (updated.worker_id === profile.id) {
          if (["accepted", "en_route", "in_progress"].includes(updated.status)) {
            setActiveOrder(updated);
          }
          if (["completed", "cancelled"].includes(updated.status)) {
            setActiveOrder(null);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  // Делимся живой геолокацией, пока заказ активен
  useEffect(() => {
    if (!activeOrder || !["accepted", "en_route", "in_progress"].includes(activeOrder.status)) return;
    if (!("geolocation" in navigator)) return;

    const supabase = createClient();
    let lastSent = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSent < 1500) return; // не чаще ~раза в 1.5 секунды
        lastSent = now;

        supabase
          .from("orders")
          .update({
            worker_lat: pos.coords.latitude,
            worker_lng: pos.coords.longitude,
            worker_speed: pos.coords.speed != null ? pos.coords.speed * 3.6 : null,
            worker_heading: pos.coords.heading,
            worker_location_updated_at: new Date().toISOString(),
          })
          .eq("id", activeOrder.id)
          .then();
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeOrder?.id, activeOrder?.status]);

  const toggleOnline = async () => {
    if (!profile?.id || toggling) return;
    setToggling(true);
    const next = !online;
    setOnline(next);
    const supabase = createClient();
    await supabase.from("profiles").update({ is_active: next }).eq("id", profile.id);
    setToggling(false);
  };

  const acceptOrder = async (order: Order) => {
    if (!profile || acceptingId) return;
    setAcceptingId(order.id);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("orders")
      .update({ status: "accepted", worker_id: profile.id, worker_name: profile.name })
      .eq("id", order.id)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    setAcceptingId(null);

    if (error || !data) {
      setPending(prev => prev.filter(o => o.id !== order.id));
      return;
    }
    setActiveOrder(data as Order);
    setPending(prev => prev.filter(o => o.id !== order.id));

    await supabase.from("notifications").insert({
      user_id: order.user_id,
      type: "order",
      title: "Мойщик найден!",
      body: `${profile.name} принял ваш заказ ${order.order_number} и скоро будет в пути.`,
    });
  };

  const rejectOrder = (id: string) => setPending(prev => prev.filter(o => o.id !== id));

  const startNavigation = async () => {
    if (!activeOrder) return;
    const supabase = createClient();

    // Сразу берём GPS-фикс, чтобы карта открылась без задержки
    // (watchPosition даст следующее обновление лишь через несколько секунд)
    const coords = await getClientCoords();
    if (!coords) {
      alert("Не удалось получить геолокацию. Разрешите доступ к местоположению в браузере.");
    }

    const updates: Record<string, unknown> = { status: "en_route" };
    if (coords) {
      updates.worker_lat = coords.lat;
      updates.worker_lng = coords.lng;
      updates.worker_location_updated_at = new Date().toISOString();
    }

    // Статус → en_route (клиент видит "Мойщик в пути")
    await supabase
      .from("orders")
      .update(updates)
      .eq("id", activeOrder.id);
    setActiveOrder(prev => prev ? { ...prev, ...updates } : prev);

    await supabase.from("notifications").insert({
      user_id: activeOrder.user_id,
      type: "order",
      title: "Мойщик в пути!",
      body: `Мойщик едет к вам по заказу ${activeOrder.order_number}.`,
      urgent: true,
    });

    setShowNav(true);
  };

  const startWash = async () => {
    if (!activeOrder) return;
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ status: "in_progress" })
      .eq("id", activeOrder.id);
    setActiveOrder(prev => prev ? { ...prev, status: "in_progress" } : prev);
  };

  const completeOrder = async () => {
    if (!activeOrder) return;
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", activeOrder.id);

    await supabase.from("notifications").insert({
      user_id: activeOrder.user_id,
      type: "order",
      title: "Мойка завершена ✓",
      body: `Заказ ${activeOrder.order_number} выполнен. Оцените мойщика в истории заказов.`,
    });

    setActiveOrder(null);
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {initials}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Привет, {firstName}! 👋</div>
              <div className="text-xs text-slate-400">
                {online ? "Принимаю заказы" : "Не в сети"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
              <Bell className="w-4 h-4" />
              {pendingOrders.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-blue rounded-full" />
              )}
            </button>
            <motion.button onClick={toggleOnline} disabled={toggling}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 h-9 px-4 rounded-xl border font-semibold text-sm transition-all disabled:opacity-60 ${
                online
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "bg-slate-100 border-slate-200 text-slate-400"
              }`}>
              <motion.div
                animate={{ scale: online ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 1.5, repeat: online ? Infinity : 0 }}
                className={`w-2 h-2 rounded-full ${online ? "bg-emerald-500" : "bg-slate-400"}`}
              />
              {online ? "В сети" : "Не в сети"}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Активный заказ */}
        <AnimatePresence>
          {activeOrder && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Активный заказ</span>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg font-semibold">
                  {activeOrder.order_number}
                </span>
              </div>
              <div className="text-slate-900 font-bold mb-0.5">{activeOrder.service_type}</div>
              <div className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {activeOrder.location_name || "Адрес не указан"}
              </div>

              {/* Статус-бейдж */}
              <div className="mb-4">
                {activeOrder.status === "accepted"    && <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-lg font-semibold">Принят — выезжайте</span>}
                {activeOrder.status === "en_route"    && <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-lg font-semibold">В пути к клиенту</span>}
                {activeOrder.status === "in_progress" && <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-lg font-semibold">Мойка идёт</span>}
              </div>

              {/* Превью навигации — открывает полноэкранную карту с маршрутом */}
              {activeOrder.worker_lat && activeOrder.worker_lng && activeOrder.status !== "accepted" && (
                <button onClick={() => setShowNav(true)}
                  className="w-full mb-4 flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white border border-emerald-200 hover:border-emerald-300 transition-all">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                    <Navigation className="w-4 h-4" />
                    {activeOrder.client_lat && activeOrder.client_lng
                      ? (() => {
                          const eta = formatEta(activeOrder.worker_lat!, activeOrder.worker_lng!, activeOrder.client_lat!, activeOrder.client_lng!);
                          return `До клиента: ${eta.km} · ~${eta.mins} мин`;
                        })()
                      : "Живая геолокация активна"}
                  </div>
                  <span className="text-xs text-brand-blue font-semibold">Открыть карту →</span>
                </button>
              )}

              <div className="flex gap-2">
                {/* Принят → кнопка навигации (меняет статус на en_route) */}
                {activeOrder.status === "accepted" && (
                  <button onClick={startNavigation}
                    className="flex-1 h-10 rounded-xl bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-600 transition-all shadow-sm">
                    <Navigation className="w-4 h-4" /> Выехать (навигация)
                  </button>
                )}

                {/* В пути → начать мойку */}
                {activeOrder.status === "en_route" && (
                  <button onClick={startWash}
                    className="flex-1 h-10 rounded-xl bg-brand-blue text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-brand-blue/90 transition-all shadow-sm">
                    <Check className="w-4 h-4" /> Начать мойку
                  </button>
                )}

                {/* Мойка идёт → завершить */}
                {activeOrder.status === "in_progress" && (
                  <button onClick={completeOrder}
                    className="flex-1 h-10 rounded-xl bg-brand-blue text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-brand-blue/90 transition-all shadow-sm">
                    <Check className="w-4 h-4" /> Мойка завершена
                  </button>
                )}

                <button className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Офлайн */}
        {!online && !activeOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <Power className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-600 font-semibold mb-1">Вы не в сети</div>
            <div className="text-sm text-slate-400 mb-4">Включите режим "В сети" чтобы получать заказы</div>
            <button onClick={toggleOnline}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all shadow-sm">
              Перейти в сеть
            </button>
          </motion.div>
        )}

        {/* Входящие заказы */}
        {online && !activeOrder && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
              <h2 className="font-bold text-slate-900 text-sm">Входящие заказы</h2>
              {pendingOrders.length > 0 && (
                <span className="text-xs bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full font-semibold border border-brand-blue/20">
                  {pendingOrders.length}
                </span>
              )}
            </div>

            {pendingOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                <Car className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <div className="text-slate-600 font-semibold mb-1">Ожидаем заказы</div>
                <div className="text-sm text-slate-400">Новые заказы появятся здесь автоматически</div>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {pendingOrders.map((order) => (
                    <motion.div key={order.id}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-sm font-bold text-slate-900 mb-1">{order.service_type}</div>
                          <div className="text-xs text-slate-400">{order.order_number}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-slate-900">
                            {(order.price / 1000).toFixed(0)}K
                          </div>
                          <div className="text-xs text-slate-400">so'm</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mb-4">
                        <MapPin className="w-3 h-3" />
                        {order.location_name || "Адрес не указан"}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => rejectOrder(order.id)}
                          className="flex-1 h-10 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-red-100 transition-all">
                          <X className="w-4 h-4" /> Отклонить
                        </button>
                        <button onClick={() => acceptOrder(order)}
                          disabled={!!acceptingId}
                          className="flex-1 h-10 rounded-xl bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-600 transition-all shadow-sm disabled:opacity-60">
                          {acceptingId === order.id
                            ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Принимаем…</>
                            : <><Check className="w-4 h-4" /> Принять</>
                          }
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* Заработок недели */}
        <div className="bg-gradient-to-br from-brand-blue/8 to-brand-purple/5 border border-brand-blue/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-semibold text-brand-blue uppercase tracking-wider mb-1">Статистика</div>
              <div className="text-sm font-bold text-slate-900">Заработок и история</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-brand-blue" />
            </div>
          </div>
          <Link href="/worker/earnings">
            <button className="w-full h-9 rounded-xl bg-brand-blue text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-brand-blue/90 transition-all">
              Посмотреть →
            </button>
          </Link>
        </div>

      </div>

      {showNav && activeOrder && activeOrder.worker_lat && activeOrder.worker_lng && (
        <NavigationView
          worker={{ lat: activeOrder.worker_lat, lng: activeOrder.worker_lng }}
          destination={activeOrder.client_lat && activeOrder.client_lng ? { lat: activeOrder.client_lat, lng: activeOrder.client_lng } : undefined}
          title={`Заказ ${activeOrder.order_number}`}
          subtitle={activeOrder.location_name || "Адрес не указан"}
          trackSelf
          onClose={() => setShowNav(false)}
        />
      )}
    </>
  );
}
