"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Bell, Star, MapPin, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const workers = [
  { id: "NT-01", name: "Nodir Toshev", phone: "+998 90 111 22 33", zone: "Yunusobod", jobs: 1204, rating: 4.9, earnings: 8200000, status: "online", avatar: "NT", badge: "⭐" },
  { id: "SK-02", name: "Sardor Karimov", phone: "+998 91 222 33 44", zone: "Chilonzor", jobs: 987, rating: 4.8, earnings: 6900000, status: "online", avatar: "SK", badge: "🏅" },
  { id: "BM-03", name: "Bobur Mirzayev", phone: "+998 93 333 44 55", zone: "Mirzo Ulugbek", jobs: 743, rating: 4.9, earnings: 5100000, status: "busy", avatar: "BM", badge: "🥉" },
  { id: "UN-04", name: "Ulugbek Nazarov", phone: "+998 94 444 55 66", zone: "Uchtepa", jobs: 621, rating: 4.7, earnings: 4400000, status: "online", avatar: "UN", badge: "" },
  { id: "JU-05", name: "Jamshid Umarov", phone: "+998 95 555 66 77", zone: "Yunusobod", jobs: 412, rating: 4.8, earnings: 2900000, status: "offline", avatar: "JU", badge: "" },
];

const statusColor: Record<string, string> = {
  online: "bg-emerald-50 text-emerald-600 border-emerald-200",
  busy: "bg-orange-50 text-orange-600 border-orange-200",
  offline: "bg-slate-50 text-slate-400 border-slate-200",
};

export default function AdminWorkersPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");

  const filtered = workers.filter(w =>
    !search || w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-lg font-bold text-slate-900">{t("admin.workers")}</div>
          <div className="text-xs text-slate-400">{workers.filter(w => w.status === "online").length} {t("common.online").toLowerCase()} · {workers.length} {t("admin.workers").toLowerCase()}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`${t("common.search")}...`}
              className="w-52 h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all" />
          </div>
          <button className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <Bell className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold">AD</div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: t("common.online"), value: workers.filter(w => w.status === "online").length, icon: "🟢" },
            { label: t("worker.activeOrder"), value: workers.filter(w => w.status === "busy").length, icon: "⚡" },
            { label: t("common.offline"), value: workers.filter(w => w.status === "offline").length, icon: "🔴" },
            { label: t("admin.avgOrderValue"), value: "4.85 ★", icon: "⭐" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-black text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-blue/20 hover:shadow-md transition-all shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-sm font-bold">
                    {w.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{w.name} {w.badge}</div>
                    <div className="text-xs text-slate-400">{w.phone}</div>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${statusColor[w.status]}`}>
                  {t(`common.${w.status}`)}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                <MapPin className="w-3 h-3" />{w.zone}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-base font-black text-slate-900">{w.jobs}</div>
                  <div className="text-[10px] text-slate-400">{t("admin.jobs")}</div>
                </div>
                <div>
                  <div className="text-base font-black text-slate-900 flex items-center justify-center gap-0.5">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{w.rating}
                  </div>
                  <div className="text-[10px] text-slate-400">{t("worker.rating")}</div>
                </div>
                <div>
                  <div className="text-base font-black text-slate-900">{(w.earnings / 1000000).toFixed(1)}M</div>
                  <div className="text-[10px] text-slate-400">{t("admin.amountCol")}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
