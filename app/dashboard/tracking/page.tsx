"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Check, Package, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type ActiveOrder = {
  id: string;
  order_number: string;
  service_type: string;
  status: string;
  price: number;
  location_name: string;
  worker_name: string | null;
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

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("orders")
        .select("id, order_number, service_type, status, price, location_name, worker_name, created_at")
        .eq("user_id", user.id)
        .not("status", "in", '("completed","cancelled")')
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

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

    </div>
  );
}
