"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, ArrowUpRight, ArrowDownRight, CreditCard, TrendingUp, Check, X, Wallet } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { debounce } from "@/lib/utils";

type Tx = {
  id: string;
  order_number: string;
  user_id: string;
  price: number;
  status: string;
  created_at: string;
  client_name?: string;
};

type Payout = {
  id: string;
  worker_id: string;
  amount: number;
  status: string;
  created_at: string;
  worker_name?: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminPaymentsPage() {
  const { t } = useLanguage();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [{ data: rows }, { data: payoutRows }] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, user_id, price, status, created_at")
          .in("status", ["completed", "cancelled"])
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("payout_requests")
          .select("id, worker_id, amount, status, created_at")
          .order("created_at", { ascending: false }),
      ]);

      const orders = rows ?? [];
      const allUserIds = Array.from(new Set([...orders.map(o => o.user_id), ...(payoutRows ?? []).map(p => p.worker_id)]));
      let names: Record<string, string> = {};
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", allUserIds);
        names = Object.fromEntries((profiles ?? []).map(p => [p.id, p.name]));
      }
      setTxs(orders.map(o => ({ ...o, client_name: names[o.user_id] ?? "—" })));
      setPayouts((payoutRows ?? []).map(p => ({ ...p, worker_name: names[p.worker_id] ?? "—" })));
      setLoading(false);
    }

    load();
    const debouncedLoad = debounce(load, 1000);
    const channel = supabase.channel("admin-payments")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, debouncedLoad)
      .on("postgres_changes", { event: "*", schema: "public", table: "payout_requests" }, debouncedLoad)
      .subscribe();
    return () => {
      debouncedLoad.cancel();
      supabase.removeChannel(channel);
    };
  }, []);

  const processPayout = async (id: string, status: "paid" | "rejected") => {
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    const supabase = createClient();
    await supabase.from("payout_requests").update({ status, processed_at: new Date().toISOString() }).eq("id", id);
  };

  const completed = txs.filter(t => t.status === "completed");
  const totalRevenue  = completed.reduce((s, t) => s + t.price, 0);
  const avgOrderValue = completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;
  const failedCount   = txs.filter(t => t.status === "cancelled").length;

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
            { label: t("admin.totalRevenue"),     value: `${(totalRevenue / 1_000_000).toFixed(2)}M so'm`, icon: TrendingUp },
            { label: t("admin.avgOrderValue"),    value: `${avgOrderValue.toLocaleString()} so'm`,         icon: CreditCard },
            { label: "Отменено",                  value: String(failedCount),                              icon: ArrowDownRight },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-brand-blue" />
                </div>
                <div className="text-xl font-black text-slate-900 mb-0.5">{loading ? "…" : s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Payout requests */}
        {payouts.some(p => p.status === "pending") && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-orange-500" />
              <div className="font-bold text-slate-900 text-sm">Запросы на вывод</div>
              <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-semibold border border-orange-200">
                {payouts.filter(p => p.status === "pending").length}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {payouts.filter(p => p.status === "pending").map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">{p.worker_name}</div>
                    <div className="text-xs text-slate-400">{p.amount.toLocaleString()} so'm · {formatDate(p.created_at)}</div>
                  </div>
                  <button onClick={() => processPayout(p.id, "paid")}
                    className="flex items-center gap-1 h-8 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-semibold hover:bg-emerald-100 transition-all">
                    <Check className="w-3.5 h-3.5" /> Оплачено
                  </button>
                  <button onClick={() => processPayout(p.id, "rejected")}
                    className="flex items-center gap-1 h-8 px-3 rounded-lg bg-red-50 border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-100 transition-all">
                    <X className="w-3.5 h-3.5" /> Отклонить
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="font-bold text-slate-900 text-sm">{t("payment.transactions")}</div>
          </div>
          {txs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Транзакций пока нет</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {txs.map((tx, i) => {
                const ok = tx.status === "completed";
                return (
                  <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${ok ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                      {ok ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">{tx.client_name}</div>
                      <div className="text-xs text-slate-400">{tx.order_number} · {formatDate(tx.created_at)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${ok ? "text-emerald-600" : "text-red-500"}`}>
                        {ok ? "+" : ""}{tx.price.toLocaleString()}
                      </div>
                      <div className={`text-xs ${ok ? "text-emerald-600" : "text-red-500"}`}>{tx.status}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
