"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Star, Car, MapPin, Clock, TrendingUp, Calendar, Download } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const orders = [
  { id: "W-1042", service: "Premium Wash", date: "June 11, 2025", time: "10:30", location: "Yunusobod", worker: "Jamshid U.", price: 99000, rating: 5, status: "completed", photos: true },
  { id: "W-1039", service: "Express Wash", date: "June 10, 2025", time: "14:00", location: "Chilonzor", worker: "Sardor K.", price: 49000, rating: 4, status: "completed", photos: true },
  { id: "W-1031", service: "Elite Detail", date: "June 8, 2025", time: "09:15", location: "Mirzo Ulugbek", worker: "Bobur M.", price: 199000, rating: 5, status: "completed", photos: true },
  { id: "W-1025", service: "Eco Wash", date: "June 5, 2025", time: "11:00", location: "Uchtepa", worker: "Nodir T.", price: 59000, rating: 5, status: "completed", photos: false },
  { id: "W-1018", service: "Premium Wash", date: "June 2, 2025", time: "16:30", location: "Yunusobod", worker: "Jamshid U.", price: 99000, rating: 4, status: "completed", photos: true },
  { id: "W-1010", service: "Express Wash", date: "May 29, 2025", time: "08:00", location: "Amir Temur", worker: "Ulugbek N.", price: 49000, rating: 5, status: "completed", photos: false },
];

const monthlyStats = [
  { month: "March", orders: 4, spent: 246000 },
  { month: "April", orders: 6, spent: 389000 },
  { month: "May", orders: 8, spent: 512000 },
  { month: "June", orders: 6, spent: 454000 },
];

export default function DashboardHistoryPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");

  const filtered = orders.filter(o =>
    o.service.toLowerCase().includes(search.toLowerCase()) ||
    o.location.toLowerCase().includes(search.toLowerCase()) ||
    o.worker.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = orders.reduce((s, o) => s + o.price, 0);
  const avgRating = (orders.reduce((s, o) => s + o.rating, 0) / orders.length).toFixed(1);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">{t("history.title")}</h1>
          <p className="text-sm text-slate-400">{t("history.subtitle")}</p>
        </div>
        <button className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all">
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { labelKey: "history.totalWashes", value: orders.length, icon: Car, color: "text-brand-blue", bg: "bg-brand-blue/10 border-brand-blue/20" },
          { labelKey: "history.totalSpent", value: `${(totalSpent / 1000000).toFixed(2)}M`, sub: "so'm", icon: TrendingUp, color: "text-brand-purple", bg: "bg-brand-purple/10 border-brand-purple/20" },
          { labelKey: "history.avgRating", value: avgRating, icon: Star, color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.labelKey} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mb-2 ${s.bg} ${s.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-slate-900">{s.value}<span className="text-xs font-normal text-slate-400"> {(s as { sub?: string }).sub}</span></div>
              <div className="text-xs text-slate-400 mt-0.5">{t(s.labelKey)}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Monthly spending */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-blue" /> {t("dashboard.monthlySpending")}
        </div>
        <div className="space-y-3">
          {monthlyStats.map((m, i) => (
            <div key={m.month} className="flex items-center gap-3">
              <div className="text-xs text-slate-400 w-14">{m.month}</div>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(m.spent / 512000) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                  className="h-full bg-brand-blue rounded-full" />
              </div>
              <div className="text-xs font-bold text-slate-900 w-16 text-right">{(m.spent / 1000).toFixed(0)}K</div>
              <div className="text-xs text-slate-400 w-12">{m.orders} {t("history.washes")}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t("history.searchPlaceholder")}
          className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all shadow-sm" />
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.map((order, i) => (
          <motion.div key={order.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-brand-blue/20 transition-all cursor-pointer shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <Car className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{order.service}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <MapPin className="w-3 h-3" />{order.location}
                    <span>·</span>
                    <Clock className="w-3 h-3" />{order.date}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 text-sm">{order.price.toLocaleString()} so'm</div>
                <div className="flex items-center gap-0.5 justify-end mt-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`w-2.5 h-2.5 ${j < order.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <div className="w-5 h-5 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-[9px] font-bold text-brand-blue">
                {order.worker[0]}
              </div>
              <span className="text-xs text-slate-400 flex-1">{order.worker}</span>
              {order.photos && (
                <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-50 text-slate-500 border border-slate-200">📷 {t("history.beforeAfter")}</span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">{t("common.completed")}</span>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">{t("history.noOrders")}</div>
        )}
      </div>
    </div>
  );
}
