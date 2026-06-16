"use client";

import { motion } from "framer-motion";
import { Bell, ArrowUpRight, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const revenueData = [32, 45, 38, 62, 55, 78, 68, 82, 71, 90, 85, 94];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weeklyOrders = [124, 187, 143, 219, 198, 267, 241];
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const serviceBreakdown = [
  { name: "Premium Wash", percent: 38, color: "bg-brand-blue" },
  { name: "Express Wash", percent: 29, color: "bg-brand-purple" },
  { name: "Elite Detail", percent: 21, color: "bg-emerald-500" },
  { name: "Eco Wash", percent: 12, color: "bg-orange-400" },
];

const topZones = [
  { name: "Yunusobod", orders: 1842, revenue: "18.2M", growth: "+22%" },
  { name: "Chilonzor", orders: 1241, revenue: "12.1M", growth: "+15%" },
  { name: "Mirzo Ulugbek", orders: 987, revenue: "9.7M", growth: "+18%" },
  { name: "Uchtepa", orders: 743, revenue: "7.1M", growth: "+11%" },
  { name: "Shaykhontohur", orders: 612, revenue: "5.9M", growth: "+9%" },
];

export default function AdminAnalyticsPage() {
  const { t } = useLanguage();

  return (
    <>
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-lg font-bold text-slate-900">{t("admin.analytics")}</div>
          <div className="text-xs text-slate-400">{t("admin.realtime")}</div>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <Bell className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold">AD</div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI row */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: t("admin.totalRevenue"), value: "42.8M", sub: "so'm", change: "+18.2%" },
            { label: t("admin.totalOrders"), value: "5,424", sub: t("admin.allTime"), change: "+12%" },
            { label: t("admin.avgOrderValue"), value: "87,400", sub: "so'm", change: "+5.2%" },
            { label: t("admin.customerRetention"), value: "78%", sub: t("admin.allTime"), change: "+3.1%" },
          ].map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-2xl font-black text-slate-900 mb-0.5">{k.value} <span className="text-xs font-normal text-slate-400">{k.sub}</span></div>
              <div className="text-xs text-slate-500 mb-1">{k.label}</div>
              <div className="text-xs text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />{k.change}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="font-bold text-slate-900 text-sm">{t("admin.revenueOverview")}</div>
                <div className="text-xs text-slate-400">{t("admin.monthlyRevenueSub")}</div>
              </div>
              <TrendingUp className="w-4 h-4 text-brand-blue" />
            </div>
            <div className="flex items-end gap-2 h-36 mb-2">
              {revenueData.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(v / 94) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                    className={`w-full rounded-t-lg ${i === 11 ? "bg-brand-blue shadow-md" : "bg-slate-200"}`}
                    style={{ minHeight: 4 }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              {months.map((m) => <span key={m} className="text-[9px] text-slate-400 flex-1 text-center">{m}</span>)}
            </div>
          </div>

          {/* Weekly orders */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="font-bold text-slate-900 text-sm">{t("worker.weeklyEarnings")}</div>
                <div className="text-xs text-slate-400">{t("worker.thisWeek")}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-slate-900">1,379</div>
                <div className="text-xs text-emerald-600">+14% {t("worker.vsLastWeek")}</div>
              </div>
            </div>
            <div className="flex items-end gap-2 h-36">
              {weeklyOrders.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(v / 267) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.07, ease: [0.23, 1, 0.32, 1] }}
                    className={`w-full rounded-t-lg ${i === 5 ? "bg-brand-blue" : i === 6 ? "bg-brand-purple" : "bg-slate-200"}`}
                    style={{ minHeight: 4 }} />
                  <span className="text-[10px] text-slate-400">{weekDays[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Service breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="font-bold text-slate-900 text-sm mb-5">{t("admin.serviceCol")} Mix</div>
            <div className="space-y-4">
              {serviceBreakdown.map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-700 font-medium">{s.name}</span>
                    <span className="text-slate-900 font-bold">{s.percent}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.percent}%` }}
                      transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                      className={`h-full rounded-full ${s.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top zones */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="font-bold text-slate-900 text-sm mb-5">{t("admin.locationCol")} Performance</div>
            <div className="space-y-3">
              {topZones.map((z, i) => (
                <motion.div key={z.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs font-bold text-slate-300 w-4">{i + 1}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900">{z.name}</div>
                    <div className="text-xs text-slate-400">{z.orders} {t("admin.orders").toLowerCase()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{z.revenue}</div>
                    <div className="text-xs text-emerald-600">{z.growth}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
