"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Bell, Star, ArrowUpRight, Users } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const users = [
  { id: "U-1001", name: "Aziz Toshmatov", phone: "+998 90 123 45 67", email: "aziz@mail.com", level: "Gold", orders: 24, spent: 1840000, joined: "Jan 2024", status: "active", avatar: "AT" },
  { id: "U-1002", name: "Dilnoza Yusupova", phone: "+998 91 234 56 78", email: "dilnoza@mail.com", level: "Silver", orders: 12, spent: 720000, joined: "Mar 2024", status: "active", avatar: "DY" },
  { id: "U-1003", name: "Rustam Karimov", phone: "+998 93 345 67 89", email: "rustam@mail.com", level: "Platinum", orders: 48, spent: 4200000, joined: "Oct 2023", status: "active", avatar: "RK" },
  { id: "U-1004", name: "Lobar Saidova", phone: "+998 94 456 78 90", email: "lobar@mail.com", level: "Bronze", orders: 5, spent: 295000, joined: "Jun 2024", status: "active", avatar: "LS" },
  { id: "U-1005", name: "Jamshid Alimov", phone: "+998 95 567 89 01", email: "jamshid@mail.com", level: "Silver", orders: 18, spent: 1260000, joined: "Feb 2024", status: "inactive", avatar: "JA" },
];

const levelColor: Record<string, string> = {
  Bronze: "bg-orange-50 text-orange-600 border-orange-200",
  Silver: "bg-slate-50 text-slate-600 border-slate-200",
  Gold: "bg-yellow-50 text-yellow-600 border-yellow-200",
  Platinum: "bg-purple-50 text-purple-600 border-purple-200",
};

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-lg font-bold text-slate-900">{t("admin.users")}</div>
          <div className="text-xs text-slate-400">{users.length} {t("admin.users").toLowerCase()}</div>
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
            { label: t("admin.users"), value: "12,483", change: "+842", icon: "👥" },
            { label: "Gold+", value: "3,241", change: "+12%", icon: "⭐" },
            { label: t("common.active"), value: "8,901", change: "+5.2%", icon: "✅" },
            { label: t("admin.newUsers"), value: "842", change: "+18%", icon: "🆕" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-xl font-black text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
              <div className="text-xs text-emerald-600 flex items-center gap-0.5 mt-1">
                <ArrowUpRight className="w-3 h-3" />{s.change}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["ID", t("common.profile"), t("admin.orders"), t("admin.amountCol"), "Level", t("admin.statusCol"), ""].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-400">{u.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.avatar}</div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                          <div className="text-xs text-slate-400">{u.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-900 font-medium">{u.orders}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-900">{(u.spent / 1000).toFixed(0)}K</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${levelColor[u.level]}`}>{u.level}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${u.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                        {u.status === "active" ? t("common.active") : t("common.offline")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{u.joined}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
