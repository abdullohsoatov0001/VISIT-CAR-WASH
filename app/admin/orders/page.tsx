"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Eye, Bell, MapPin, ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const allOrders = [
  { id: "W-1044", client: "Aziz T.", worker: "Nodir T.", service: "Premium", location: "Yunusobod", amount: 99000, status: "active", time: "10 min", date: "Jun 11" },
  { id: "W-1043", client: "Dilnoza Y.", worker: "Sardor K.", service: "Express", location: "Chilonzor", amount: 49000, status: "completed", time: "32 min", date: "Jun 11" },
  { id: "W-1042", client: "Rustam K.", worker: "Bobur M.", service: "Elite", location: "Mirzo Ulugbek", amount: 199000, status: "completed", time: "1 hr", date: "Jun 11" },
  { id: "W-1041", client: "Lobar S.", worker: "—", service: "Express", location: "Shaykhontohur", amount: 49000, status: "pending", time: "2 min", date: "Jun 11" },
  { id: "W-1040", client: "Jamshid A.", worker: "Ulugbek N.", service: "Eco", location: "Uchtepa", amount: 59000, status: "in-progress", time: "25 min", date: "Jun 10" },
  { id: "W-1039", client: "Nodira R.", worker: "Nodir T.", service: "Premium", location: "Yunusobod", amount: 99000, status: "completed", time: "2 hr", date: "Jun 10" },
  { id: "W-1038", client: "Bobur M.", worker: "Sardor K.", service: "Express", location: "Chilonzor", amount: 49000, status: "cancelled", time: "3 hr", date: "Jun 10" },
  { id: "W-1037", client: "Sarvar T.", worker: "Bobur M.", service: "Elite", location: "Mirzo Ulugbek", amount: 199000, status: "completed", time: "5 hr", date: "Jun 9" },
];

const statusBadge: Record<string, string> = {
  active: "bg-brand-blue/10 text-brand-blue border-brand-blue/20",
  completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
  pending: "bg-orange-50 text-orange-600 border-orange-200",
  "in-progress": "bg-brand-purple/10 text-brand-purple border-brand-purple/20",
  cancelled: "bg-red-50 text-red-500 border-red-200",
};

export default function AdminOrdersPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = allOrders.filter(o => {
    const matchSearch = !search || o.client.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-lg font-bold text-slate-900">{t("admin.orders")}</div>
          <div className="text-xs text-slate-400">{filtered.length} {t("admin.orders").toLowerCase()}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("admin.searchOrders")}
              className="w-52 h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all" />
          </div>
          <button className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <Bell className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold">AD</div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {["all", "active", "in-progress", "pending", "completed", "cancelled"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${statusFilter === s ? "bg-brand-blue text-white border-brand-blue" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
              {s === "all" ? t("common.all") : t(`common.${s === "in-progress" ? "active" : s}`)}
            </button>
          ))}
          <button className="ml-auto flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 hover:text-slate-900 transition-all">
            <Filter className="w-3 h-3" /> {t("common.filter")} <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
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
                {filtered.map((order, i) => (
                  <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
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
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${statusBadge[order.status]}`}>{order.status}</span>
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
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">{t("history.noOrders")}</div>
          )}
        </div>
      </div>
    </>
  );
}
