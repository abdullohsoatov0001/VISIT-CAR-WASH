"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Car, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  order_number: string;
  service_type: string;
  price: number;
  completed_at: string | null;
  created_at: string;
};

function formatPrice(n: number) {
  return n.toLocaleString("ru-RU");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function WorkerEarningsPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("orders")
        .select("id, order_number, service_type, price, completed_at, created_at")
        .eq("worker_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      setOrders(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const totalEarnings = orders.reduce((s, o) => s + o.price, 0);
  const totalOrders   = orders.length;
  const avgPerOrder   = totalOrders > 0 ? Math.round(totalEarnings / totalOrders) : 0;

  // Group by day for chart
  const byDay = orders.reduce<Record<string, number>>((acc, o) => {
    const day = formatDate(o.completed_at ?? o.created_at);
    acc[day] = (acc[day] ?? 0) + o.price;
    return acc;
  }, {});
  const chartData = Object.entries(byDay).slice(0, 7).reverse();
  const maxVal    = Math.max(...chartData.map(([, v]) => v), 1);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Заработано",    value: `${formatPrice(Math.round(totalEarnings / 1000))}K`, icon: Wallet,     color: "text-brand-blue",   bg: "bg-brand-blue/10 border-brand-blue/20" },
          { label: "Заказов",       value: totalOrders,                                          icon: Car,        color: "text-brand-purple", bg: "bg-brand-purple/10 border-brand-purple/20" },
          { label: "Средний чек",   value: `${formatPrice(Math.round(avgPerOrder / 1000))}K`,   icon: TrendingUp, color: "text-emerald-600",  bg: "bg-emerald-50 border-emerald-200" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mb-2 ${s.bg} ${s.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-900 mb-4">По дням (последние 7)</div>
          <div className="flex items-end gap-2 h-24">
            {chartData.map(([day, val]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${(val / maxVal) * 80}px` }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full bg-gradient-to-t from-brand-blue to-brand-blue/60 rounded-t-lg min-h-[4px]"
                />
                <div className="text-[10px] text-slate-400 truncate w-full text-center">{day}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="text-sm font-bold text-slate-900">История заказов</div>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <div className="text-sm text-slate-400">Выполненных заказов нет</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((o, i) => (
              <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{o.service_type}</div>
                  <div className="text-xs text-slate-400">{o.order_number} · {formatDate(o.completed_at ?? o.created_at)}</div>
                </div>
                <div className="text-sm font-bold text-emerald-600">+{formatPrice(o.price)} so'm</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
