"use client";

import { motion } from "framer-motion";
import { Bell, ArrowUpRight, ArrowDownRight, CreditCard, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const transactions = [
  { id: "TXN-5021", user: "Aziz T.", amount: 99000, type: "income", method: "Click", date: "Jun 11, 10:30", status: "completed" },
  { id: "TXN-5020", user: "Dilnoza Y.", amount: 49000, type: "income", method: "Payme", date: "Jun 11, 09:15", status: "completed" },
  { id: "TXN-5019", user: "Rustam K.", amount: 199000, type: "income", method: "Humo", date: "Jun 10, 16:45", status: "completed" },
  { id: "TXN-5018", user: "Lobar S.", amount: 49000, type: "income", method: "UzCard", date: "Jun 10, 14:20", status: "failed" },
  { id: "TXN-5017", user: "Jamshid A.", amount: 59000, type: "income", method: "Click", date: "Jun 10, 11:00", status: "completed" },
  { id: "TXN-5016", user: "Nodir T.", amount: 423000, type: "payout", method: "Bank", date: "Jun 10, 10:00", status: "completed" },
];

const methods = [
  { name: "Click", percent: 42, color: "bg-brand-blue" },
  { name: "Payme", percent: 31, color: "bg-emerald-500" },
  { name: "Humo / UzCard", percent: 19, color: "bg-brand-purple" },
  { name: "Other", percent: 8, color: "bg-slate-300" },
];

export default function AdminPaymentsPage() {
  const { t } = useLanguage();

  return (
    <>
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-lg font-bold text-slate-900">{t("admin.payments")}</div>
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
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: t("admin.totalRevenue"), value: "42.8M so'm", change: "+18.2%", up: true, icon: TrendingUp },
            { label: t("admin.subscriptionRevenue"), value: "18.2M so'm", change: "+24%", up: true, icon: CreditCard },
            { label: t("admin.avgOrderValue"), value: "87,400 so'm", change: "+5.2%", up: true, icon: ArrowUpRight },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-brand-blue" />
                </div>
                <div className="text-xl font-black text-slate-900 mb-0.5">{s.value}</div>
                <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                <div className="text-xs text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />{s.change} {t("admin.thisMonth")}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Methods breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="font-bold text-slate-900 text-sm mb-5">{t("payment.title")} Methods</div>
            <div className="space-y-4">
              {methods.map((m) => (
                <div key={m.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-700 font-medium">{m.name}</span>
                    <span className="text-slate-900 font-bold">{m.percent}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${m.percent}%` }}
                      transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                      className={`h-full rounded-full ${m.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="font-bold text-slate-900 text-sm">{t("payment.transactions")}</div>
            </div>
            <div className="divide-y divide-slate-100">
              {transactions.map((tx, i) => (
                <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === "income" ? "bg-emerald-50 border border-emerald-200" : "bg-orange-50 border border-orange-200"}`}>
                    {tx.type === "income" ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDownRight className="w-3.5 h-3.5 text-orange-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">{tx.user}</div>
                    <div className="text-xs text-slate-400">{tx.id} · {tx.method} · {tx.date}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${tx.type === "income" ? "text-emerald-600" : "text-orange-500"}`}>
                      {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString()}
                    </div>
                    <div className={`text-xs ${tx.status === "completed" ? "text-emerald-600" : "text-red-500"}`}>{tx.status}</div>
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
