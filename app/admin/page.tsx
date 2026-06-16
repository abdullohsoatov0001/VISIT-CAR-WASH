"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Car, DollarSign, ArrowUpRight, ArrowDownRight,
  MapPin, Shield, Bell, Search, Filter, X, Eye, Zap, AlertTriangle, Star,
  ChevronRight, Activity, Database, Cpu, Globe, Droplets
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const kpis = [
  { labelKey: "admin.totalRevenue", value: "₩ 42.8M", change: "+18.2%", up: true, icon: DollarSign, color: "blue", subKey: "admin.thisMonth" },
  { labelKey: "common.active", value: "147", change: "+12", up: true, icon: Car, color: "purple", subKey: "admin.realtime" },
  { labelKey: "admin.users", value: "12,483", change: "+842", up: true, icon: Users, color: "cyan", subKey: "admin.thisMonth" },
  { labelKey: "admin.activeWorkers", value: "89", change: "-3", up: false, icon: Shield, color: "green", subKey: "common.online" },
];

const colorCard: Record<string, string> = {
  blue: "text-brand-blue bg-brand-blue/10 border-brand-blue/20",
  purple: "text-brand-purple bg-brand-purple/10 border-brand-purple/20",
  cyan: "text-cyan-600 bg-cyan-50 border-cyan-200",
  green: "text-emerald-600 bg-emerald-50 border-emerald-200",
  orange: "text-orange-600 bg-orange-50 border-orange-200",
  red: "text-red-600 bg-red-50 border-red-200",
};

const recentOrders = [
  { id: "W-1044", client: "Aziz T.", worker: "Nodir T.", service: "Premium", location: "Yunusobod", amount: 99000, status: "active", time: "10 min" },
  { id: "W-1043", client: "Dilnoza Y.", worker: "Sardor K.", service: "Express", location: "Chilonzor", amount: 49000, status: "completed", time: "32 min" },
  { id: "W-1042", client: "Rustam K.", worker: "Bobur M.", service: "Elite", location: "Mirzo Ulugbek", amount: 199000, status: "completed", time: "1 hr" },
  { id: "W-1041", client: "Lobar S.", worker: "—", service: "Express", location: "Shaykhontohur", amount: 49000, status: "pending", time: "2 min" },
  { id: "W-1040", client: "Jamshid A.", worker: "Ulugbek N.", service: "Eco", location: "Uchtepa", amount: 59000, status: "in-progress", time: "25 min" },
];

const topWorkers = [
  { name: "Nodir Toshev", jobs: 1204, rating: 4.9, earnings: "8.2M", avatar: "NT", badge: "⭐" },
  { name: "Sardor Karimov", jobs: 987, rating: 4.8, earnings: "6.9M", avatar: "SK", badge: "🏅" },
  { name: "Bobur Mirzayev", jobs: 743, rating: 4.9, earnings: "5.1M", avatar: "BM", badge: "🥉" },
];

const alerts = [
  { icon: AlertTriangle, msg: "Worker Ulugbek N. has been offline for 2 hours during peak time", time: "10 min ago", color: "orange" },
  { icon: Shield, msg: "Suspicious payment pattern detected — User #4829, 3 failed attempts", time: "25 min ago", color: "red" },
  { icon: Zap, msg: "Peak demand alert: Yunusobod area has 18 pending orders, only 3 workers", time: "1 hr ago", color: "blue" },
];

const revenueData = [32, 45, 38, 62, 55, 78, 68, 82, 71, 90, 85, 94];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const statusBadge: Record<string, string> = {
  active: "bg-brand-blue/10 text-brand-blue border-brand-blue/20",
  completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
  pending: "bg-orange-50 text-orange-600 border-orange-200",
  "in-progress": "bg-brand-purple/10 text-brand-purple border-brand-purple/20",
};

export default function AdminOverview() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      {/* Top bar */}
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
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${k.up ? "text-emerald-600" : "text-red-500"}`}>
                    {k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {k.change}
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 mb-0.5">{k.value}</div>
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
              <div className="flex gap-2">
                {["1M", "3M", "6M", "1Y"].map((p) => (
                  <button key={p} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${p === "1Y" ? "bg-brand-blue/10 text-brand-blue border border-brand-blue/20" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}>{p}</button>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-2 h-32 mb-2">
              {revenueData.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(v / 94) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                    className={`w-full rounded-t-lg ${i === 11 ? "bg-brand-blue shadow-md" : "bg-slate-200 hover:bg-slate-300 transition-colors"}`}
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
              <button className="text-xs text-brand-blue flex items-center gap-1">{t("admin.viewAll")} <ChevronRight className="w-3 h-3" /></button>
            </div>
            <div className="space-y-4">
              {topWorkers.map((w, i) => (
                <div key={w.name} className="flex items-center gap-3">
                  <div className="text-xs font-bold text-slate-300 w-4">{i + 1}</div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {w.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{w.name} {w.badge}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{w.jobs} {t("admin.jobs")}</span>
                      <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                      <span>{w.rating}</span>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{w.earnings}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-400 mb-3">{t("admin.orderDensityMap")}</div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => {
                  const intensity = (Math.sin(i * 1.3) + 1) / 2;
                  return (
                    <div key={i} className="h-4 rounded-sm"
                      style={{ background: intensity > 0.7 ? `rgba(14,165,233,${intensity * 0.7})` : intensity > 0.4 ? `rgba(139,92,246,${intensity * 0.4})` : "rgba(0,0,0,0.05)" }} />
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                <span>{t("admin.lowDensity")}</span><span>{t("admin.highDensity")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <div className="font-bold text-slate-900 text-sm">{t("admin.systemAlerts")}</div>
              <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-semibold border border-orange-200">{alerts.length}</span>
            </div>
            <button className="text-xs text-slate-400 hover:text-slate-700 transition-colors">{t("admin.markAllRead")}</button>
          </div>
          <div className="space-y-3">
            {alerts.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border ${colorCard[a.color]}`}>
                  <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-900 leading-relaxed">{a.msg}</div>
                    <div className="text-xs text-slate-400 mt-1">{a.time}</div>
                  </div>
                  <button className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors"><X className="w-4 h-4" /></button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Orders table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="font-bold text-slate-900 text-sm">{t("admin.recentOrders")}</div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 hover:text-slate-900 transition-all">
                <Filter className="w-3 h-3" /> {t("common.filter")}
              </button>
              <button className="text-xs text-brand-blue flex items-center gap-1">{t("admin.viewAll")} <ChevronRight className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[t("admin.orderId"), t("admin.clientCol"), t("admin.workerCol"), t("admin.serviceCol"), t("admin.locationCol"), t("admin.amountCol"), t("admin.statusCol"), t("admin.timeCol"), ""].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders
                  .filter(o => !searchQuery || o.client.toLowerCase().includes(searchQuery.toLowerCase()) || o.id.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((order, i) => (
                    <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                      className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3.5 text-sm font-mono text-brand-blue">{order.id}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-900 font-medium">{order.client}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{order.worker}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{order.service}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" />{order.location}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold text-slate-900">{order.amount.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${statusBadge[order.status]}`}>
                          {t(`common.${order.status === "in-progress" ? "active" : order.status}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{order.time}</td>
                      <td className="px-5 py-3.5">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { labelKey: "admin.subscriptionRevenue", value: "18.2M so'm", change: "+24%", color: "blue", icon: "💳" },
            { labelKey: "admin.avgOrderValue", value: "87,400 so'm", change: "+5.2%", color: "purple", icon: "📊" },
            { labelKey: "admin.customerRetention", value: "78%", change: "+3.1%", color: "green", icon: "♻️" },
          ].map((s, i) => (
            <motion.div key={s.labelKey} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{s.icon}</span>
                <span className="text-xs text-slate-400">{t(s.labelKey)}</span>
              </div>
              <div className="text-xl font-black text-slate-900 mb-1">{s.value}</div>
              <div className="text-xs text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />{s.change} {t("admin.thisMonth")}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
