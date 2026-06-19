"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, ArrowUpRight, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const palette = ["bg-brand-blue", "bg-brand-purple", "bg-emerald-500", "bg-orange-400", "bg-cyan-500", "bg-pink-400"];

type Order = { service_type: string; location_name: string; price: number; status: string; created_at: string };

export default function AdminAnalyticsPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data } = await supabase
        .from("orders")
        .select("service_type, location_name, price, status, created_at");
      setOrders(data ?? []);
      setLoading(false);
    }
    load();
    const channel = supabase.channel("admin-analytics")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const completed = orders.filter(o => o.status === "completed");
  const totalRevenue  = completed.reduce((s, o) => s + o.price, 0);
  const avgOrderValue = completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;

  const year = new Date().getFullYear();
  const revenueByMonth = Array(12).fill(0);
  completed.forEach(o => {
    const d = new Date(o.created_at);
    if (d.getFullYear() === year) revenueByMonth[d.getMonth()] += o.price;
  });
  const maxRevenue = Math.max(1, ...revenueByMonth);

  // Заказы за последние 7 дней
  const weeklyOrders = Array(7).fill(0);
  const now = new Date();
  orders.forEach(o => {
    const d = new Date(o.created_at);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays >= 0 && diffDays < 7) weeklyOrders[6 - diffDays] += 1;
  });
  const maxWeekly = Math.max(1, ...weeklyOrders);
  const weeklyTotal = weeklyOrders.reduce((s, v) => s + v, 0);

  // Разбивка по услугам
  const byService: Record<string, number> = {};
  orders.forEach(o => { byService[o.service_type] = (byService[o.service_type] ?? 0) + 1; });
  const serviceTotal = orders.length || 1;
  const serviceBreakdown = Object.entries(byService)
    .map(([name, count], i) => ({ name, percent: Math.round((count / serviceTotal) * 100), color: palette[i % palette.length] }))
    .sort((a, b) => b.percent - a.percent);

  // Топ зон
  const byZone: Record<string, { orders: number; revenue: number }> = {};
  orders.forEach(o => {
    const zone = o.location_name || "Не указано";
    byZone[zone] = byZone[zone] ?? { orders: 0, revenue: 0 };
    byZone[zone].orders += 1;
    if (o.status === "completed") byZone[zone].revenue += o.price;
  });
  const topZones = Object.entries(byZone)
    .map(([name, v]) => ({ name, orders: v.orders, revenue: v.revenue }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

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
            { label: t("admin.totalRevenue"),      value: (totalRevenue / 1_000_000).toFixed(2), sub: "M so'm" },
            { label: t("admin.totalOrders"),       value: String(orders.length),                  sub: t("admin.allTime") },
            { label: t("admin.avgOrderValue"),     value: avgOrderValue.toLocaleString(),         sub: "so'm" },
            { label: "Завершено",                  value: String(completed.length),               sub: t("admin.allTime") },
          ].map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-2xl font-black text-slate-900 mb-0.5">{loading ? "…" : k.value} <span className="text-xs font-normal text-slate-400">{k.sub}</span></div>
              <div className="text-xs text-slate-500 mb-1">{k.label}</div>
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
              {revenueByMonth.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(v / maxRevenue) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                    className={`w-full rounded-t-lg ${i === new Date().getMonth() ? "bg-brand-blue shadow-md" : "bg-slate-200"}`}
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
                <div className="font-bold text-slate-900 text-sm">Заказы за неделю</div>
                <div className="text-xs text-slate-400">Последние 7 дней</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-slate-900">{weeklyTotal}</div>
              </div>
            </div>
            <div className="flex items-end gap-2 h-36">
              {weeklyOrders.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(v / maxWeekly) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.07, ease: [0.23, 1, 0.32, 1] }}
                    className={`w-full rounded-t-lg ${i === 6 ? "bg-brand-blue" : "bg-slate-200"}`}
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
            {serviceBreakdown.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-6">Нет данных</div>
            ) : (
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
            )}
          </div>

          {/* Top zones */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="font-bold text-slate-900 text-sm mb-5">{t("admin.locationCol")} Performance</div>
            {topZones.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-6">Нет данных</div>
            ) : (
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
                      <div className="text-sm font-bold text-slate-900">{(z.revenue / 1000).toFixed(0)}K</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
