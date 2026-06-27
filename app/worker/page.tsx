"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { MapPin, Bell, Car, Navigation, Phone, Check, X, Award, Power, Clock, AlertCircle, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "@/lib/context/UserContext";
import { getInitials } from "@/lib/hooks/useUser";
import { formatEta, getClientCoords } from "@/lib/geo";
import { startWorkerLocationSharing } from "@/lib/workerLocation";
import { formatDateTime } from "@/lib/utils";
import { MANUAL_PAYMENT_METHODS } from "@/lib/payment";
import { sendPush } from "@/lib/notify";

const NavigationView = dynamic(() => import("@/components/NavigationView"), { ssr: false });
const WashPhotoModal = dynamic(() => import("@/components/WashPhotoModal"), { ssr: false });

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 12) return phone;
  return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
}

async function notifyTelegram(orderId: string, status: string, photos?: string[]) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  fetch("/api/telegram/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ orderId, status, photos }),
  }).catch(() => {});
}

type Order = {
  id: string;
  order_number: string;
  service_type: string;
  status: string;
  price: number;
  worker_earning: number | null;
  location_name: string;
  user_id: string;
  worker_id: string | null;
  worker_lat: number | null;
  worker_lng: number | null;
  worker_speed: number | null;
  worker_heading: number | null;
  client_lat: number | null;
  client_lng: number | null;
  client_phone: string | null;
  before_photos: string[] | null;
  after_photos: string[] | null;
  payment_method: string | null;
  payment_status: string;
  created_at: string;
  accepted_at: string | null;
  started_at: string | null;
};

export default function WorkerDashboard() {
  const { profile } = useUserContext();

  const [online, setOnline]             = useState(false);
  const [toggling, setToggling]         = useState(false);
  const [pendingOrders, setPending]     = useState<Order[]>([]);
  const [activeOrder, setActiveOrder]   = useState<Order | null>(null);
  const [acceptingId, setAcceptingId]   = useState<string | null>(null);
  const [showNav, setShowNav]           = useState(false);
  const [photoStep, setPhotoStep]       = useState<"before" | "after" | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling]     = useState(false);
  const [showCashConfirm, setShowCashConfirm] = useState(false);
  const [confirmingCash, setConfirmingCash] = useState(false);

  const firstName = profile?.name?.split(" ")[0] ?? "Мойщик";
  const initials  = profile ? getInitials(profile.name) : "…";

  // Загрузка начального состояния
  useEffect(() => {
    if (!profile) return;
    const workerId = profile.id;
    setOnline(profile.is_active === true);

    const supabase = createClient();

    async function load() {
      // Активный заказ и ожидающие заказы независимы друг от друга — грузим параллельно
      const [{ data: active }, { data: pending }] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .eq("worker_id", workerId)
          .in("status", ["accepted", "en_route", "in_progress"])
          .maybeSingle(),
        supabase
          .from("orders")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      setActiveOrder(active ?? null);
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
            // Мёрджим, а не заменяем целиком — частичный realtime-пейлоад
            // (напр. от обновления только payment_status) не должен затирать
            // worker_lat/lng и сбрасывать открытую навигацию
            setActiveOrder(prev => (prev && prev.id === updated.id ? { ...prev, ...updated } : updated));
          }
          if (["completed", "cancelled"].includes(updated.status)) {
            setActiveOrder(null);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  // Делимся живой геолокацией, пока заказ активен.
  // На native-сборке (Capacitor) работает и в фоне — см. lib/workerLocation.ts.
  useEffect(() => {
    if (!activeOrder || !["accepted", "en_route", "in_progress"].includes(activeOrder.status)) return;
    return startWorkerLocationSharing(activeOrder.id);
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
      .update({ status: "accepted", worker_id: profile.id, worker_name: profile.name, worker_phone: profile.phone ?? null, accepted_at: new Date().toISOString() })
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
    sendPush(order.user_id, "Мойщик найден!", `${profile.name} принял ваш заказ ${order.order_number} и скоро будет в пути.`);
    notifyTelegram(order.id, "accepted");
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
    sendPush(activeOrder.user_id, "Мойщик в пути!", `Мойщик едет к вам по заказу ${activeOrder.order_number}.`);
    notifyTelegram(activeOrder.id, "en_route");

    setShowNav(true);
  };

  const confirmBeforePhotos = async (urls: string[]) => {
    if (!activeOrder) return;
    const supabase = createClient();
    const startedAt = new Date().toISOString();
    await supabase
      .from("orders")
      .update({ status: "in_progress", before_photos: urls, started_at: startedAt })
      .eq("id", activeOrder.id);
    setActiveOrder(prev => prev ? { ...prev, status: "in_progress", before_photos: urls, started_at: startedAt } : prev);
    notifyTelegram(activeOrder.id, "in_progress", urls);
    setPhotoStep(null);
  };

  const confirmCashReceived = async () => {
    if (!activeOrder) return;
    setConfirmingCash(true);
    const supabase = createClient();
    await supabase.from("orders").update({ payment_status: "verified" }).eq("id", activeOrder.id);
    setActiveOrder(prev => prev ? { ...prev, payment_status: "verified" } : prev);
    setConfirmingCash(false);
    setShowCashConfirm(false);
    setPhotoStep("after");
  };

  const confirmAfterPhotos = async (urls: string[]) => {
    if (!activeOrder) return;
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ status: "completed", completed_at: new Date().toISOString(), after_photos: urls })
      .eq("id", activeOrder.id);

    await supabase.from("notifications").insert({
      user_id: activeOrder.user_id,
      type: "rating",
      order_id: activeOrder.id,
      title: "Мойка завершена ✓",
      body: `Заказ ${activeOrder.order_number} выполнен. Сравните фото до/после и оцените мойщика.`,
    });
    sendPush(activeOrder.user_id, "Мойка завершена ✓", `Заказ ${activeOrder.order_number} выполнен. Сравните фото до/после и оцените мойщика.`);
    notifyTelegram(activeOrder.id, "completed", urls);

    setPhotoStep(null);
    setActiveOrder(null);
  };

  // Мойщик не может продолжить (машина сломалась и т.п.) — возвращаем заказ
  // в поиск нового мойщика вместо полной отмены, чтобы клиент не остался без мойки
  const cancelByWorker = async () => {
    if (!activeOrder || !profile) return;
    setCancelling(true);
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ status: "pending", worker_id: null, worker_name: null, worker_phone: null })
      .eq("id", activeOrder.id);

    await supabase.from("notifications").insert({
      user_id: activeOrder.user_id,
      type: "system",
      title: "Ищем нового мойщика",
      body: `${profile.name} не может выполнить заказ ${activeOrder.order_number}. Ищем для вас другого мойщика.`,
    });
    sendPush(activeOrder.user_id, "Ищем нового мойщика", `${profile.name} не может выполнить заказ ${activeOrder.order_number}. Ищем для вас другого мойщика.`);
    notifyTelegram(activeOrder.id, "cancelled");

    setCancelling(false);
    setShowCancelConfirm(false);
    setActiveOrder(null);
  };

  const isManualPaymentOrder = !!activeOrder && MANUAL_PAYMENT_METHODS.includes(activeOrder.payment_method ?? "");
  const paymentUnverified = isManualPaymentOrder && activeOrder?.payment_status !== "verified";

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
          {activeOrder && (() => {
            const steps = [
              { key: "accepted",    label: "Принят" },
              { key: "en_route",    label: "В пути" },
              { key: "in_progress", label: "Мойка" },
            ];
            const stepIndex = steps.findIndex(s => s.key === activeOrder.status);
            return (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white border-2 border-emerald-200 rounded-3xl p-5 shadow-lg shadow-emerald-100 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500" />

              {/* Заголовок */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Активный заказ</span>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg font-bold">
                  {activeOrder.order_number}
                </span>
              </div>

              {/* Услуга + заработок */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="text-lg font-black text-slate-900 leading-tight">{activeOrder.service_type}</div>
                  <div className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
                    <span className="truncate">{activeOrder.location_name || "Адрес не указан"}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {activeOrder.worker_earning != null && activeOrder.worker_earning !== activeOrder.price ? (
                    <>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Заказ {(activeOrder.price / 1000).toFixed(0)}K so&apos;m</div>
                      <div className="text-lg font-black text-emerald-600">Вам {(activeOrder.worker_earning / 1000).toFixed(0)}K</div>
                    </>
                  ) : (
                    <>
                      <div className="text-xl font-black text-emerald-600">{(activeOrder.price / 1000).toFixed(0)}K</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">so&apos;m</div>
                    </>
                  )}
                </div>
              </div>

              {/* Прогресс по шагам — всегда видно, на каком этапе заказ */}
              <div className="flex items-center mb-4">
                {steps.map((s, i) => (
                  <div key={s.key} className="flex items-center flex-1 last:flex-initial">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        i < stepIndex ? "bg-emerald-500 border-emerald-500 text-white" :
                        i === stepIndex ? "bg-emerald-500 border-emerald-500 text-white ring-4 ring-emerald-100" :
                        "bg-white border-slate-200 text-slate-300"
                      }`}>
                        {i < stepIndex ? <Check className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      <span className={`text-[10px] font-semibold whitespace-nowrap ${i <= stepIndex ? "text-emerald-600" : "text-slate-300"}`}>{s.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 -mt-4 rounded-full ${i < stepIndex ? "bg-emerald-400" : "bg-slate-200"}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Хронология заказа */}
              <div className="flex items-center gap-3 flex-wrap mb-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Создан {formatDateTime(activeOrder.created_at)}</span>
                {activeOrder.accepted_at && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Принят {formatDateTime(activeOrder.accepted_at)}</span>}
                {activeOrder.started_at && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Начата {formatDateTime(activeOrder.started_at)}</span>}
              </div>

              {/* Статус оплаты */}
              <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl border text-xs font-semibold ${
                activeOrder.payment_method === "cash"
                  ? "bg-slate-50 border-slate-200 text-slate-500"
                  : activeOrder.payment_status === "verified"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : activeOrder.payment_status === "rejected"
                      ? "bg-red-50 border-red-200 text-red-500"
                      : "bg-amber-50 border-amber-200 text-amber-600"
              }`}>
                <Wallet className="w-3.5 h-3.5 shrink-0" />
                {activeOrder.payment_method === "cash"
                  ? "Оплата наличными при завершении"
                  : activeOrder.payment_status === "verified"
                    ? `Оплата (${activeOrder.payment_method}) подтверждена`
                    : activeOrder.payment_status === "rejected"
                      ? "Оплата отклонена администратором"
                      : `Оплата (${activeOrder.payment_method}) ожидает подтверждения`}
              </div>

              {/* Превью навигации — открывает полноэкранную карту с маршрутом */}
              {activeOrder.worker_lat && activeOrder.worker_lng && activeOrder.status !== "accepted" && (
                <button onClick={() => setShowNav(true)}
                  className="w-full mb-3 flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 hover:border-emerald-300 transition-all">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <Navigation className="w-4 h-4" />
                    {activeOrder.client_lat && activeOrder.client_lng
                      ? (() => {
                          const eta = formatEta(activeOrder.worker_lat!, activeOrder.worker_lng!, activeOrder.client_lat!, activeOrder.client_lng!);
                          return `До клиента: ${eta.km} · ~${eta.mins} мин`;
                        })()
                      : "Живая геолокация активна"}
                  </div>
                  <span className="text-xs text-brand-blue font-bold">Карта →</span>
                </button>
              )}

              {/* Действия */}
              <div className="space-y-2.5">
                {/* Принят → кнопка навигации (меняет статус на en_route) */}
                {activeOrder.status === "accepted" && (
                  <button onClick={startNavigation}
                    className="w-full h-14 rounded-2xl bg-emerald-500 text-white text-base font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-md shadow-emerald-200">
                    <Navigation className="w-5 h-5" /> Выехать
                  </button>
                )}

                {/* В пути → начать мойку (через фото "до"), заблокировано если оплата картой/Click/Payme ещё не подтверждена */}
                {activeOrder.status === "en_route" && (
                  paymentUnverified ? (
                    <div className="w-full h-14 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-700 text-sm font-bold flex items-center justify-center gap-2 text-center px-4">
                      <AlertCircle className="w-5 h-5 shrink-0" /> Оплата клиента ещё не подтверждена администратором
                    </div>
                  ) : (
                    <button onClick={() => setPhotoStep("before")}
                      className="w-full h-14 rounded-2xl bg-brand-blue text-white text-base font-bold flex items-center justify-center gap-2 hover:bg-brand-blue/90 active:scale-[0.98] transition-all shadow-md shadow-brand-blue/20">
                      <Check className="w-5 h-5" /> Начать мойку
                    </button>
                  )
                )}

                {/* Мойка идёт → завершить (через фото "после"); для наличных сперва подтверждаем получение денег */}
                {activeOrder.status === "in_progress" && (
                  <button onClick={() => {
                    if (activeOrder.payment_method === "cash" && activeOrder.payment_status !== "verified") {
                      setShowCashConfirm(true);
                    } else {
                      setPhotoStep("after");
                    }
                  }}
                    className="w-full h-14 rounded-2xl bg-brand-blue text-white text-base font-bold flex items-center justify-center gap-2 hover:bg-brand-blue/90 active:scale-[0.98] transition-all shadow-md shadow-brand-blue/20">
                    <Check className="w-5 h-5" /> Завершить мойку
                  </button>
                )}

                {activeOrder.client_phone ? (
                  <a href={`tel:${activeOrder.client_phone}`}
                    className="w-full h-12 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-600 active:scale-[0.98] flex items-center justify-center gap-2 font-bold text-sm transition-all">
                    <Phone className="w-4 h-4" /> {formatPhone(activeOrder.client_phone)}
                  </a>
                ) : (
                  <div className="w-full h-12 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-300 flex items-center justify-center gap-2 font-semibold text-sm">
                    <Phone className="w-4 h-4" /> Клиент не указал телефон
                  </div>
                )}

                {(activeOrder.status === "accepted" || activeOrder.status === "en_route") && (
                  <button onClick={() => setShowCancelConfirm(true)}
                    className="w-full text-center text-xs text-red-400 hover:text-red-500 font-semibold transition-colors pt-1">
                    Не могу выполнить заказ
                  </button>
                )}
              </div>
            </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Подтверждение отказа от заказа */}
        <AnimatePresence>
          {showCancelConfirm && activeOrder && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowCancelConfirm(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Отказаться от заказа?</h3>
                <p className="text-sm text-slate-400 mb-5">Заказ {activeOrder.order_number} вернётся в поиск — его сможет принять другой мойщик. Клиент получит уведомление.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowCancelConfirm(false)} disabled={cancelling}
                    className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-all">
                    Назад
                  </button>
                  <button onClick={cancelByWorker} disabled={cancelling}
                    className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-60">
                    {cancelling ? "…" : "Да, отказаться"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Подтверждение получения наличных перед завершением заказа */}
        <AnimatePresence>
          {showCashConfirm && activeOrder && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
              onClick={() => !confirmingCash && setShowCashConfirm(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Подтвердите получение наличных</h3>
                <p className="text-sm text-slate-400 mb-5">
                  Заказ {activeOrder.order_number} нельзя завершить без подтверждения, что клиент оплатил {(activeOrder.price).toLocaleString("ru-RU")} so&apos;m наличными.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowCashConfirm(false)} disabled={confirmingCash}
                    className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-all">
                    Назад
                  </button>
                  <button onClick={confirmCashReceived} disabled={confirmingCash}
                    className="flex-1 h-11 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all disabled:opacity-60">
                    {confirmingCash ? "…" : "Деньги получены"}
                  </button>
                </div>
              </motion.div>
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
                          {order.worker_earning != null && order.worker_earning !== order.price ? (
                            <>
                              <div className="text-xs text-slate-400">Заказ {(order.price / 1000).toFixed(0)}K so'm</div>
                              <div className="text-base font-black text-emerald-600">Вам {(order.worker_earning / 1000).toFixed(0)}K</div>
                            </>
                          ) : (
                            <>
                              <div className="text-lg font-black text-slate-900">{(order.price / 1000).toFixed(0)}K</div>
                              <div className="text-xs text-slate-400">so'm</div>
                            </>
                          )}
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
          phone={activeOrder.client_phone}
          trackSelf
          onClose={() => setShowNav(false)}
          onArrive={() => setShowNav(false)}
        />
      )}

      {photoStep && activeOrder && (
        <WashPhotoModal
          orderId={activeOrder.id}
          mode={photoStep}
          onConfirm={photoStep === "before" ? confirmBeforePhotos : confirmAfterPhotos}
          onClose={() => setPhotoStep(null)}
        />
      )}
    </>
  );
}
