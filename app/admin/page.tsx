"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Car, DollarSign, ArrowUpRight, ArrowDownRight,
  MapPin, Shield, Bell, Search, Filter, Eye, Zap, AlertTriangle, Star,
  ChevronRight, CheckCircle
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { debounce } from "@/lib/utils";

type Order = {
  id: string;
  order_number: string;
  user_id: string;
  worker_id: string | null;
  worker_name: string | null;
  service_type: string;
  location_name: string;
  price: number;
  status: string;
  created_at: string;
  client_name?: string;
};

type Worker = { id: string; name: string; total_washes: number; earnings: number; rating: number };

type Alert = { icon: typeof AlertTriangle; msg: string; color: string };

const colorCard: Record<string, string> = {
  blue: "text-brand-blue bg-brand-blue/10 border-brand-blue/20",
  purple: "text-brand-purple bg-brand-purple/10 border-brand-purple/20",
  cyan: "text-cyan-600 bg-cyan-50 border-cyan-200",
  green: "text-emerald-600 bg-emerald-50 border-emerald-200",
  orange: "text-orange-600 bg-orange-50 border-orange-200",
  red: "text-red-600 bg-red-50 border-red-200",
};

const statusBadge: Record<string, string> = {
  pending: "bg-orange-50 text-orange-600 border-orange-200",
  accepted: "bg-brand-blue/10 text-brand-blue border-brand-blue/20",
  en_route: "bg-brand-purple/10 text-brand-purple border-brand-purple/20",
  in_progress: "bg-brand-purple/10 text-brand-purple border-brand-purple/20",
  completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
  cancelled: "bg-red-50 text-red-500 border-red-200",
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} мин`;
  if (mins < 1440) return `${Math.floor(mins / 60)} ч`;
  return `${Math.floor(mins / 1440)} дн`;
}

export default function AdminOverview() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [activeWorkerCount, setActiveWorkerCount] = useState(0);
  const [topWorkers, setTopWorkers] = useState<Worker[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<number[]>(Array(12).fill(0));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [{ data: orderRows }, { count: uCount }, { count: wCount }] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, user_id, worker_id, worker_name, service_type, location_name, price, status, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "USER"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "WORKER").eq("is_active", true),
      ]);
      setUserCount(uCount ?? 0);
      setActiveWorkerCount(wCount ?? 0);

      const rows = orderRows ?? [];

      // Top workers — агрегируем завершённые заказы по worker_id
      const completed = rows.filter((o) => o.status === "completed" && o.worker_id);
      const byWorker: Record<string, { jobs: number; earnings: number }> = {};
      completed.forEach((o) => {
        if (!o.worker_id) return;
        byWorker[o.worker_id] = byWorker[o.worker_id] ?? { jobs: 0, earnings: 0 };
        byWorker[o.worker_id].jobs += 1;
        byWorker[o.worker_id].earnings += o.price;
      });
      const workerIds = Object.keys(byWorker);
      const userIds = Array.from(new Set(rows.map((o) => o.user_id)));

      const [profilesRes, wProfilesRes] = await Promise.all([
        userIds.length > 0 ? supabase.from("profiles").select("id, name").in("id", userIds) : Promise.resolve({ data: [] }),
        workerIds.length > 0 ? supabase.from("profiles").select("id, name").in("id", workerIds) : Promise.resolve({ data: [] }),
      ]);
      const names = Object.fromEntries((profilesRes.data ?? []).map((p) => [p.id, p.name]));
      setOrders(rows.map((o) => ({ ...o, client_name: names[o.user_id] ?? "—" })));

      const workerNames: Record<string, { name: string }> = Object.fromEntries((wProfilesRes.data ?? []).map((p) => [p.id, { name: p.name }]));
      const top = workerIds
        .map((id) => ({ id, name: workerNames[id]?.name ?? "—", total_washes: byWorker[id].jobs, earnings: byWorker[id].earnings, rating: 5 }))
        .sort((a, b) => b.total_washes - a.total_washes)
        .slice(0, 3);
      setTopWorkers(top.map(w => ({ ...w, rating: w.rating })));

      // Revenue по месяцам (текущий год)
      const year = new Date().getFullYear();
      const revenue = Array(12).fill(0);
      rows.filter((o) => o.status === "completed").forEach((o) => {
        const d = new Date(o.created_at);
        if (d.getFullYear() === year) revenue[d.getMonth()] += o.price;
      });
      setRevenueByMonth(revenue);

      setLoading(false);
    }

    load();

    // GPS мойщика пишется в orders раз в ~1.5 сек во время поездки — без
    // дебаунса каждое такое обновление гоняло бы все 5 запросов выше заново
    const debouncedLoad = debounce(load, 1000);
    const channel = supabase
      .channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, debouncedLoad)
      .subscribe();

    return () => {
      debouncedLoad.cancel();
      supabase.removeChannel(channel);
    };
  }, []);

  const totalRevenue   = orders.filter(o => o.status === "completed").reduce((s, o) => s + o.price, 0);
  const activeOrders   = orders.filter(o => !["completed", "cancelled"].includes(o.status));
  const pendingUnassigned = orders.filter(o => o.status === "pending");
  const recentOrders   = orders.slice(0, 5);
  const maxRevenue     = Math.max(1, ...revenueByMonth);
  const avgOrderValue  = orders.filter(o => o.status === "completed").length > 0
    ? Math.round(totalRevenue / orders.filter(o => o.status === "completed").length)
    : 0;

  const kpis = [
    { labelKey: "admin.totalRevenue",  value: `${(totalRevenue / 1_000_000).toFixed(1)}M`, icon: DollarSign, color: "blue",   subKey: "admin.thisMonth" },
    { labelKey: "common.active",       value: String(activeOrders.length),                icon: Car,        color: "purple", subKey: "admin.realtime" },
    { labelKey: "admin.users",         value: String(userCount),                           icon: Users,      color: "cyan",   subKey: "admin.thisMonth" },
    { labelKey: "admin.activeWorkers", value: String(activeWorkerCount),                    icon: Shield,     color: "green",  subKey: "common.online" },
  ];

  // Алерты на основе реальных сигналов
  const alerts: Alert[] = [];
  if (activeWorkerCount === 0 && pendingUnassigned.length > 0) {
    alerts.push({ icon: AlertTriangle, msg: `${pendingUnassigned.length} заказ(ов) ожидают, но нет мойщиков онлайн`, color: "orange" });
  }
  pendingUnassigned.filter(o => (Date.now() - new Date(o.created_at).getTime()) > 10 * 60000).forEach(o => {
    alerts.push({ icon: Zap, msg: `Заказ ${o.order_number} ожидает мойщика больше 10 минут`, color: "blue" });
  });
  if (orders.some(o => o.status === "cancelled")) {
    const n = orders.filter(o => o.status === "cancelled").length;
    alerts.push({ icon: Shield, msg: `${n} отменённых заказ(ов) за всё время`, color: "red" });
  }

  const filteredOrders = recentOrders.filter(o => !searchQuery || o.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) || o.order_number.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-lg font-bold text-slate-900">{t("admin.dashboard")}</div>
          <div className="text-xs text-slate-400">{t("admin.realtime")}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={t("admin.searchOrders")}
              className="w-52 h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all" />
          </div>
          <button className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <Bell className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold">AD</div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <motion.div key={k.labelKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-blue/20 hover:shadow-md transition-all group shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colorCard[k.color]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 mb-0.5">{loading ? "…" : k.value}</div>
                <div className="text-xs text-slate-500">{t(k.labelKey)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{t(k.subKey)}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="font-bold text-slate-900">{t("admin.revenueOverview")}</div>
                <div className="text-xs text-slate-400">{t("admin.monthlyRevenueSub")}</div>
              </div>
            </div>
            <div className="flex items-end gap-2 h-32 mb-2">
              {revenueByMonth.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(v / maxRevenue) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                    className={`w-full rounded-t-lg ${i === new Date().getMonth() ? "bg-brand-blue shadow-md" : "bg-slate-200 hover:bg-slate-300 transition-colors"}`}
                    style={{ minHeight: 4 }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              {months.map((m) => <span key={m} className="text-[9px] text-slate-400 flex-1 text-center">{m}</span>)}
            </div>
          </div>

          {/* Top Workers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="font-bold text-slate-900 text-sm">{t("admin.topWorkers")}</div>
            </div>
            {topWorkers.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-6">Пока нет завершённых заказов</div>
            ) : (
              <div className="space-y-4">
                {topWorkers.map((w, i) => (
                  <div key={w.id} className="flex items-center gap-3">
                    <div className="text-xs font-bold text-slate-300 w-4">{i + 1}</div>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {w.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{w.name}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{w.total_washes} {t("admin.jobs")}</span>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-slate-900">{(w.earnings / 1000).toFixed(0)}K</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <div className="font-bold text-slate-900 text-sm">{t("admin.systemAlerts")}</div>
              {alerts.length > 0 && (
                <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-semibold border border-orange-200">{alerts.length}</span>
              )}
            </div>
          </div>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 py-2">
              <CheckCircle className="w-4 h-4" /> Критичных событий нет
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((a, i) => {
                const Icon = a.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border ${colorCard[a.color]}`}>
                    <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-900 leading-relaxed">{a.msg}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="font-bold text-slate-900 text-sm">{t("admin.recentOrders")}</div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 hover:text-slate-900 transition-all">
                <Filter className="w-3 h-3" /> {t("common.filter")}
              </button>
              <a href="/admin/orders" className="text-xs text-brand-blue flex items-center gap-1">{t("admin.viewAll")} <ChevronRight className="w-3 h-3" /></a>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[t("admin.orderId"), t("admin.clientCol"), t("admin.workerCol"), t("admin.serviceCol"), t("admin.locationCol"), t("admin.amountCol"), t("admin.statusCol"), t("admin.timeCol"), ""].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order, i) => (
                  <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                    className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5 text-sm font-mono text-brand-blue">{order.order_number}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-900 font-medium">{order.client_name}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{order.worker_name ?? "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{order.service_type}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" />{order.location_name || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-900">{order.price.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${statusBadge[order.status] ?? statusBadge.pending}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{timeAgo(order.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <a href="/admin/orders" className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700">
                        <Eye className="w-4 h-4" />
                      </a>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {!loading && filteredOrders.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">{t("history.noOrders")}</div>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: t("admin.avgOrderValue"),      value: `${avgOrderValue.toLocaleString()} so'm`, icon: "📊" },
            { label: t("admin.customerRetention"),  value: `${userCount > 0 ? Math.round((orders.length / userCount) * 100) / 100 : 0} зак./клиент`, icon: "♻️" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{s.icon}</span>
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
              <div className="text-xl font-black text-slate-900 mb-1">{s.value}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
