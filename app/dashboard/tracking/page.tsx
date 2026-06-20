"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Check, Package, RefreshCw, X, AlertTriangle, Navigation } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatEta } from "@/lib/geo";
import Link from "next/link";

const NavigationView = dynamic(() => import("@/components/NavigationView"), { ssr: false });

const CANCELLABLE_STATUSES = ["pending", "accepted", "en_route"];
const LIVE_MAP_STATUSES = ["accepted", "en_route", "in_progress"];

type ActiveOrder = {
  id: string;
  order_number: string;
  service_type: string;
  status: string;
  price: number;
  location_name: string;
  worker_name: string | null;
  worker_lat: number | null;
  worker_lng: number | null;
  worker_speed: number | null;
  worker_heading: number | null;
  client_lat: number | null;
  client_lng: number | null;
  created_at: string;
};

const statusSteps = [
  { key: "pending",     label: "Заказ создан",     desc: "Ищем мойщика рядом с вами",   icon: "🔍" },
  { key: "accepted",    label: "Мойщик назначен",   desc: "Мойщик едет к вам",           icon: "🚗" },
  { key: "en_route",    label: "Мойщик в пути",     desc: "Скоро будет на месте",         icon: "📍" },
  { key: "in_progress", label: "Мойка идёт",        desc: "Ваш автомобиль моется",        icon: "✨" },
  { key: "completed",   label: "Готово!",            desc: "Мойка завершена успешно",     icon: "🎉" },
];

function formatPrice(n: number) { return n.toLocaleString("ru-RU"); }

export default function DashboardTrackingPage() {
  const [order, setOrder]     = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || cancelled) { setLoading(false); return; }

      const { data } = await supabase
        .from("orders")
        .select("id, order_number, service_type, status, price, location_name, worker_name, worker_lat, worker_lng, worker_speed, worker_heading, client_lat, client_lng, created_at")
        .eq("user_id", user.id)
        .not("status", "in", '("completed","cancelled")')
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      setOrder(data ?? null);
      setLoading(false);

      if (!data) return;

      channel = supabase
        .channel(`tracking-${data.id}`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${data.id}`,
        }, (payload) => {
          const updated = payload.new as ActiveOrder;
          if (["completed", "cancelled"].includes(updated.status)) {
            setOrder(null);
          } else {
            setOrder(updated);
          }
        })
        .subscribe();
    }

    load();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="bg-white border border-slate-200 rounded-2xl h-64 animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <div className="font-bold text-slate-900 text-lg mb-2">Активных заказов нет</div>
          <div className="text-sm text-slate-400 mb-6">Закажите мойку — здесь появится отслеживание</div>
          <Link href="/booking">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="px-6 py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-sm shadow-md">
              Заказать мойку
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = statusSteps.findIndex(s => s.key === order.status);
  const canCancel = CANCELLABLE_STATUSES.includes(order.status);

  const handleCancel = async () => {
    setCancelling(true);
    const supabase = createClient();
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    setCancelling(false);
    setShowCancel(false);
    setOrder(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl space-y-4">

      {/* Order card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-xs font-semibold text-brand-blue uppercase tracking-wider mb-1">
              Заказ {order.order_number}
            </div>
            <div className="font-bold text-slate-900 text-lg">{order.service_type}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-slate-900">{formatPrice(order.price)}</div>
            <div className="text-xs text-slate-400">so'm</div>
          </div>
        </div>
        {order.location_name && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="w-4 h-4 text-brand-blue flex-shrink-0" />
            {order.location_name}
          </div>
        )}
      </motion.div>

      {/* Worker */}
      {order.worker_name ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white font-bold text-sm">
              {order.worker_name[0]}
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">{order.worker_name}</div>
              <div className="text-xs text-emerald-500 font-medium">Ваш мойщик</div>
            </div>
          </div>
          <button className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-blue transition-all">
            <Phone className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
            <RefreshCw className="w-5 h-5 text-amber-500" />
          </motion.div>
          <div>
            <div className="text-sm font-semibold text-amber-700">Ищем мойщика…</div>
            <div className="text-xs text-amber-500">Обычно занимает 1–3 минуты</div>
          </div>
        </motion.div>
      )}

      {/* Live GPS — открывает полноэкранную навигацию */}
      {LIVE_MAP_STATUSES.includes(order.status) && order.worker_lat && order.worker_lng && (
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          onClick={() => setShowNav(true)}
          className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between hover:border-brand-blue/30 transition-all">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Navigation className="w-4 h-4 text-brand-blue" />
            {order.client_lat && order.client_lng
              ? (() => {
                  const eta = formatEta(order.worker_lat!, order.worker_lng!, order.client_lat!, order.client_lng!);
                  return `${eta.km} · ~${eta.mins} мин до вас`;
                })()
              : "Живая GPS-локация мойщика"}
          </div>
          <span className="text-xs text-brand-blue font-semibold">Открыть карту →</span>
        </motion.button>
      )}

      {/* Status steps */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="text-sm font-bold text-slate-900 mb-5">Статус заказа</div>
        <div className="space-y-0">
          {statusSteps.map((step, i) => {
            const done   = i < currentStep;
            const active = i === currentStep;
            const future = i > currentStep;
            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border-2 transition-all ${
                    done   ? "bg-emerald-500 border-emerald-500 text-white" :
                    active ? "bg-brand-blue border-brand-blue text-white" :
                             "bg-white border-slate-200 text-slate-300"
                  }`}>
                    {done
                      ? <Check className="w-4 h-4" />
                      : active
                        ? <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                            {step.icon}
                          </motion.span>
                        : <span className="text-xs">{step.icon}</span>
                    }
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`w-0.5 h-7 ${done ? "bg-emerald-300" : "bg-slate-100"}`} />
                  )}
                </div>
                <div className="pt-1 pb-6">
                  <div className={`text-sm font-semibold leading-tight ${
                    active ? "text-brand-blue" : done ? "text-slate-900" : "text-slate-300"
                  }`}>
                    {step.label}
                  </div>
                  {active && (
                    <div className="text-xs text-slate-400 mt-0.5">{step.desc}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Cancel order */}
      {canCancel && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <button onClick={() => setShowCancel(true)}
            className="w-full h-11 rounded-xl border border-red-100 bg-red-50 text-red-500 text-sm font-semibold hover:bg-red-100 transition-all">
            Отменить заказ
          </button>
        </motion.div>
      )}

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {showCancel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowCancel(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Отменить заказ?</h3>
              <p className="text-sm text-slate-400 mb-5">Заказ {order.order_number} будет отменён. Это действие нельзя отменить.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancel(false)} disabled={cancelling}
                  className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-all">
                  Назад
                </button>
                <button onClick={handleCancel} disabled={cancelling}
                  className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {cancelling ? <X className="w-4 h-4 animate-spin" /> : "Да, отменить"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showNav && order.worker_lat && order.worker_lng && (
        <NavigationView
          worker={{ lat: order.worker_lat, lng: order.worker_lng }}
          destination={order.client_lat && order.client_lng ? { lat: order.client_lat, lng: order.client_lng } : undefined}
          title={order.worker_name ? `${order.worker_name} едет к вам` : "Ваш мойщик"}
          subtitle={`Заказ ${order.order_number}`}
          speed={order.worker_speed}
          heading={order.worker_heading}
          onClose={() => setShowNav(false)}
        />
      )}

    </div>
  );
}
