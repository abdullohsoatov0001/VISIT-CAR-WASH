"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Car, TrendingUp, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  service_type: string;
  user_rating: number | null;
  price: number;
  completed_at: string | null;
  created_at: string;
};

export default function WorkerStatsPage() {
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
        .select("id, service_type, user_rating, price, completed_at, created_at")
        .eq("worker_id", user.id)
        .eq("status", "completed");

      setOrders(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const total      = orders.length;
  const rated      = orders.filter(o => o.user_rating != null);
  const avgRating  = rated.length > 0
    ? (rated.reduce((s, o) => s + (o.user_rating ?? 0), 0) / rated.length).toFixed(1)
    : "—";

  // Service breakdown
  const byService = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.service_type] = (acc[o.service_type] ?? 0) + 1;
    return acc;
  }, {});
  const serviceRows = Object.entries(byService)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }));

  // Rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map(star => {
    const count = rated.filter(o => o.user_rating === star).length;
    return { star, count, pct: rated.length > 0 ? Math.round((count / rated.length) * 100) : 0 };
  });

  const serviceColors = [
    "from-brand-blue to-brand-blue/60",
    "from-brand-purple to-brand-purple/60",
    "from-cyan-500 to-cyan-500/60",
    "from-emerald-500 to-emerald-500/60",
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Всего заказов", value: total,      icon: Car,      color: "text-brand-blue",   bg: "bg-brand-blue/10 border-brand-blue/20" },
          { label: "Средний рейтинг", value: avgRating,  icon: Star,     color: "text-yellow-500",   bg: "bg-yellow-50 border-yellow-200" },
          { label: "С оценкой",     value: rated.length, icon: Award,    color: "text-brand-purple", bg: "bg-brand-purple/10 border-brand-purple/20" },
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

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 h-40 animate-pulse" />)}
        </div>
      ) : total === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <div className="font-semibold text-slate-600 mb-1">Статистики нет</div>
          <div className="text-sm text-slate-400">После первых заказов здесь появится аналитика</div>
        </div>
      ) : (
        <>
          {/* Service breakdown */}
          {serviceRows.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-sm font-bold text-slate-900 mb-4">По типу услуги</div>
              <div className="space-y-3">
                {serviceRows.map((s, i) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{s.name}</span>
                      <span className="font-semibold">{s.count} · {s.pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                        className={`h-full bg-gradient-to-r rounded-full ${serviceColors[i % serviceColors.length]}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rating distribution */}
          {rated.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold text-slate-900">Оценки клиентов</div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-lg font-black text-slate-900">{avgRating}</span>
                  <span className="text-xs text-slate-400">/ 5</span>
                </div>
              </div>
              <div className="space-y-2">
                {ratingDist.map(r => (
                  <div key={r.star} className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5 w-16">
                      {Array.from({ length: r.star }).map((_, j) => (
                        <Star key={j} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${r.pct}%` }}
                        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                        className="h-full bg-yellow-400 rounded-full" />
                    </div>
                    <span className="text-xs text-slate-400 w-6 text-right">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
