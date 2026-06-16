"use client";

import { motion } from "framer-motion";
import { Star, Car, Clock, TrendingUp, Award, Droplets } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const serviceBreakdown = [
  { name: "Premium Wash", count: 48, pct: 45, color: "from-brand-blue to-brand-blue/60" },
  { name: "Express Wash", count: 31, pct: 29, color: "from-brand-purple to-brand-purple/60" },
  { name: "Elite Detail", count: 18, pct: 17, color: "from-cyan-500 to-cyan-500/60" },
  { name: "Eco Wash", count: 10, pct: 9, color: "from-emerald-500 to-emerald-500/60" },
];

const ratingDist = [5, 4, 3, 2, 1].map((star, i) => ({
  star,
  count: [62, 18, 5, 2, 1][i],
  pct: [71, 21, 6, 2, 0][i],
}));

const monthlyOrders = [
  { month: "Jan", count: 58 },
  { month: "Feb", count: 72 },
  { month: "Mar", count: 65 },
  { month: "Apr", count: 91 },
  { month: "May", count: 103 },
  { month: "Jun", count: 107 },
];

export default function WorkerStatsPage() {
  const { t } = useLanguage();
  const maxOrders = Math.max(...monthlyOrders.map(m => m.count));

  return (
    <>
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-black text-slate-900">{t("worker.navStats")}</h1>
          <p className="text-xs text-slate-400">{t("admin.allTime")}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: t("worker.completedOrders"), value: "107", icon: Car, color: "text-brand-blue", bg: "bg-brand-blue/10 border-brand-blue/20" },
            { label: t("worker.rating"), value: "4.9", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200" },
            { label: t("worker.dayStreak"), value: "12", icon: Award, color: "text-brand-purple", bg: "bg-brand-purple/10 border-brand-purple/20" },
            { label: t("history.savedHours"), value: "168h", icon: Clock, color: "text-cyan-600", bg: "bg-cyan-50 border-cyan-200" },
            { label: t("worker.todayEarnings"), value: "2.86M", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
            { label: "Wash Types", value: "4", icon: Droplets, color: "text-orange-500", bg: "bg-orange-50 border-orange-200" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mb-2 ${s.bg} ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xl font-black text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Monthly orders chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Monthly Orders</h2>
          <div className="flex items-end justify-between gap-2 h-28">
            {monthlyOrders.map((m, i) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500 font-semibold">{m.count}</span>
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${(m.count / maxOrders) * 80}%` }}
                  transition={{ delay: i * 0.07, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className={`w-full rounded-t-lg min-h-[4px] ${i === monthlyOrders.length - 1 ? "bg-gradient-to-t from-brand-blue to-brand-blue/60" : "bg-slate-200"}`} />
                <span className="text-[10px] text-slate-400">{m.month}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Service breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Service Mix</h2>
          <div className="space-y-3">
            {serviceBreakdown.map((s, i) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{s.name}</span>
                  <span className="text-slate-400">{s.count} orders · {s.pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                    transition={{ delay: i * 0.1 + 0.3, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                    className={`h-full rounded-full bg-gradient-to-r ${s.color}`} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Rating distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">{t("worker.rating")} Distribution</h2>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-black text-slate-900 text-lg">4.9</span>
              <span className="text-xs text-slate-400 ml-0.5">(88)</span>
            </div>
          </div>
          <div className="space-y-2">
            {ratingDist.map((r) => (
              <div key={r.star} className="flex items-center gap-3">
                <div className="flex items-center gap-0.5 w-16">
                  {Array.from({ length: r.star }).map((_, j) => (
                    <Star key={j} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${r.pct}%` }}
                    transition={{ delay: 0.4, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                    className="h-full rounded-full bg-yellow-400" />
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}
