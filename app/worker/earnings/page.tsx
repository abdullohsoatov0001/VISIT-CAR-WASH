"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const weeklyData = [
  { day: "Mon", amount: 87000 },
  { day: "Tue", amount: 123000 },
  { day: "Wed", amount: 56000 },
  { day: "Thu", amount: 145000 },
  { day: "Fri", amount: 198000 },
  { day: "Sat", amount: 210000 },
  { day: "Sun", amount: 99000 },
];

const monthlyData = [
  { week: "W1", amount: 620000 },
  { week: "W2", amount: 780000 },
  { week: "W3", amount: 540000 },
  { week: "W4", amount: 918000 },
];

const transactions = [
  { date: "Jun 12", desc: "Premium Wash × 3", amount: 297000 },
  { date: "Jun 11", desc: "Express Wash × 5", amount: 245000 },
  { date: "Jun 10", desc: "Elite Detail × 1 + Premium × 2", amount: 397000 },
  { date: "Jun 9", desc: "Eco Wash × 4", amount: 236000 },
  { date: "Jun 8", desc: "Express Wash × 3", amount: 147000 },
];

export default function WorkerEarningsPage() {
  const { t } = useLanguage();
  const weeklyTotal = weeklyData.reduce((s, d) => s + d.amount, 0);
  const maxWeek = Math.max(...weeklyData.map(d => d.amount));
  const maxMonth = Math.max(...monthlyData.map(d => d.amount));

  return (
    <>
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-black text-slate-900">{t("worker.navEarnings")}</h1>
          <p className="text-xs text-slate-400">{t("worker.thisWeek")}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: t("worker.weeklyEarnings"), value: `${(weeklyTotal / 1000).toFixed(0)}K`, sub: "so'm", icon: Wallet, color: "text-brand-blue", bg: "bg-brand-blue/10 border-brand-blue/20" },
            { label: t("worker.vsLastWeek"), value: "+12%", sub: "", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mb-2 ${s.bg} ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-slate-900">{s.value} <span className="text-xs font-normal text-slate-400">{s.sub}</span></div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Weekly bar chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">{t("worker.thisWeek")}</h2>
            <span className="text-xs text-brand-blue font-semibold">{(weeklyTotal / 1000).toFixed(0)}K so'm</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {weeklyData.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${(d.amount / maxWeek) * 100}%` }}
                  transition={{ delay: i * 0.06, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-brand-blue to-brand-blue/60 min-h-[4px]" />
                <span className="text-[10px] text-slate-400">{d.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Monthly breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">June 2026</h2>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <ArrowUpRight className="w-3 h-3" /> 2.86M so'm
            </div>
          </div>
          <div className="space-y-3">
            {monthlyData.map((w, i) => (
              <div key={w.week} className="flex items-center gap-3">
                <div className="w-6 text-xs text-slate-400 text-right">{w.week}</div>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(w.amount / maxMonth) * 100}%` }}
                    transition={{ delay: i * 0.1 + 0.2, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-purple" />
                </div>
                <div className="w-16 text-xs font-semibold text-slate-900 text-right">{(w.amount / 1000).toFixed(0)}K</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Daily breakdown */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3">{t("worker.todayJobs")}</h2>
          <div className="space-y-2">
            {transactions.map((tx, i) => (
              <motion.div key={tx.date} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-500">{tx.date}</div>
                  <div className="text-sm font-medium text-slate-700 truncate">{tx.desc}</div>
                </div>
                <div className="text-sm font-bold text-emerald-600">+{(tx.amount / 1000).toFixed(0)}K</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
