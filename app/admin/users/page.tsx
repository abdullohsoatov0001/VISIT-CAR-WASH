"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Bell } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/hooks/useUser";

type UserRow = {
  id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  loyalty_tier: string;
  total_washes: number;
  total_spent: number;
  created_at: string;
};

const levelColor: Record<string, string> = {
  Bronze:   "bg-orange-50 text-orange-600 border-orange-200",
  Silver:   "bg-slate-50 text-slate-600 border-slate-200",
  Gold:     "bg-yellow-50 text-yellow-600 border-yellow-200",
  Platinum: "bg-purple-50 text-purple-600 border-purple-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { month: "short", year: "numeric" });
}

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, name, phone, is_active, loyalty_tier, total_washes, total_spent, created_at")
      .eq("role", "USER")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setUsers(data ?? []); setLoading(false); });
  }, []);

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()));

  const goldPlus = users.filter(u => ["Gold", "Platinum"].includes(u.loyalty_tier)).length;
  const active   = users.filter(u => u.is_active).length;
  const newThisMonth = users.filter(u => {
    const d = new Date(u.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

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
            { label: t("admin.users"), value: String(users.length), icon: "👥" },
            { label: "Gold+", value: String(goldPlus), icon: "⭐" },
            { label: t("common.active"), value: String(active), icon: "✅" },
            { label: t("admin.newUsers"), value: String(newThisMonth), icon: "🆕" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-xl font-black text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
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
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">Загрузка…</td></tr>
                ) : filtered.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-400">{u.id.slice(0, 8)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{getInitials(u.name)}</div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                          <div className="text-xs text-slate-400">{u.phone ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-900 font-medium">{u.total_washes}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-900">{(u.total_spent / 1000).toFixed(0)}K</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${levelColor[u.loyalty_tier] ?? levelColor.Bronze}`}>{u.loyalty_tier}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${u.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                        {u.is_active ? t("common.active") : t("common.offline")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{formatDate(u.created_at)}</td>
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
