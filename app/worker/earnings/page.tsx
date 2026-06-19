"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, TrendingUp, Car, Clock, X, Check, ArrowDownToLine } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  order_number: string;
  service_type: string;
  price: number;
  completed_at: string | null;
  created_at: string;
};

type Payout = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
};

function formatPrice(n: number) {
  return n.toLocaleString("ru-RU");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function WorkerEarningsPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [workerId, setWorkerId] = useState<string | null>(null);

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setLoading(false); return; }
      setWorkerId(user.id);

      const [{ data: orderRows }, { data: payoutRows }] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, service_type, price, completed_at, created_at")
          .eq("worker_id", user.id)
          .eq("status", "completed")
          .order("completed_at", { ascending: false }),
        supabase
          .from("payout_requests")
          .select("id, amount, status, created_at")
          .eq("worker_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      setOrders(orderRows ?? []);
      setPayouts(payoutRows ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const totalEarnings = orders.reduce((s, o) => s + o.price, 0);
  const totalOrders   = orders.length;
  const avgPerOrder   = totalOrders > 0 ? Math.round(totalEarnings / totalOrders) : 0;
  const requestedTotal = payouts.filter(p => p.status !== "rejected").reduce((s, p) => s + p.amount, 0);
  const availableBalance = Math.max(0, totalEarnings - requestedTotal);

  const handleWithdraw = async () => {
    setWithdrawError("");
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) { setWithdrawError("Введите сумму"); return; }
    if (amount > availableBalance) { setWithdrawError("Сумма больше доступного баланса"); return; }
    if (!workerId) return;

    setSubmitting(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("payout_requests")
      .insert({ worker_id: workerId, amount })
      .select("id, amount, status, created_at")
      .single();
    setSubmitting(false);

    if (data) setPayouts(prev => [data, ...prev]);
    setWithdrawn(true);
    setWithdrawAmount("");
    setTimeout(() => { setWithdrawn(false); setShowWithdraw(false); }, 1500);
  };

  // Group by day for chart
  const byDay = orders.reduce<Record<string, number>>((acc, o) => {
    const day = formatDate(o.completed_at ?? o.created_at);
    acc[day] = (acc[day] ?? 0) + o.price;
    return acc;
  }, {});
  const chartData = Object.entries(byDay).slice(0, 7).reverse();
  const maxVal    = Math.max(...chartData.map(([, v]) => v), 1);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Balance + withdraw */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-brand-blue to-brand-purple rounded-2xl p-5 text-white shadow-lg flex items-center justify-between">
        <div>
          <div className="text-xs opacity-80 mb-1">Доступно к выводу</div>
          <div className="text-2xl font-black">{formatPrice(availableBalance)} so'm</div>
        </div>
        <button onClick={() => setShowWithdraw(true)} disabled={availableBalance <= 0}
          className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-white text-brand-blue text-sm font-bold shadow-md disabled:opacity-50 transition-all">
          <ArrowDownToLine className="w-4 h-4" /> Вывести
        </button>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Заработано",    value: `${formatPrice(Math.round(totalEarnings / 1000))}K`, icon: Wallet,     color: "text-brand-blue",   bg: "bg-brand-blue/10 border-brand-blue/20" },
          { label: "Заказов",       value: totalOrders,                                          icon: Car,        color: "text-brand-purple", bg: "bg-brand-purple/10 border-brand-purple/20" },
          { label: "Средний чек",   value: `${formatPrice(Math.round(avgPerOrder / 1000))}K`,   icon: TrendingUp, color: "text-emerald-600",  bg: "bg-emerald-50 border-emerald-200" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mb-2 ${s.bg} ${s.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-900 mb-4">По дням (последние 7)</div>
          <div className="flex items-end gap-2 h-24">
            {chartData.map(([day, val]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }} animate={{ height: `${(val / maxVal) * 80}px` }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full bg-gradient-to-t from-brand-blue to-brand-blue/60 rounded-t-lg min-h-[4px]"
                />
                <div className="text-[10px] text-slate-400 truncate w-full text-center">{day}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="text-sm font-bold text-slate-900">История заказов</div>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <div className="text-sm text-slate-400">Выполненных заказов нет</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((o, i) => (
              <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{o.service_type}</div>
                  <div className="text-xs text-slate-400">{o.order_number} · {formatDate(o.completed_at ?? o.created_at)}</div>
                </div>
                <div className="text-sm font-bold text-emerald-600">+{formatPrice(o.price)} so'm</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Payout requests */}
      {payouts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="text-sm font-bold text-slate-900">Запросы на вывод</div>
          </div>
          <div className="divide-y divide-slate-100">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{formatPrice(p.amount)} so'm</div>
                  <div className="text-xs text-slate-400">{formatDate(p.created_at)}</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${
                  p.status === "paid" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                  p.status === "rejected" ? "bg-red-50 text-red-500 border-red-200" :
                  "bg-orange-50 text-orange-600 border-orange-200"}`}>
                  {p.status === "paid" ? "Выплачено" : p.status === "rejected" ? "Отклонён" : "В обработке"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdraw modal */}
      <AnimatePresence>
        {showWithdraw && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowWithdraw(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900">Вывести деньги</h3>
                <button onClick={() => setShowWithdraw(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>

              {withdrawn ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold py-4 justify-center">
                  <Check className="w-4 h-4" /> Запрос отправлен
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400 mb-3">Доступно: {formatPrice(availableBalance)} so'm</p>
                  {withdrawError && (
                    <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{withdrawError}</div>
                  )}
                  <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Сумма, so'm"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-blue/50" />
                  <button onClick={handleWithdraw} disabled={submitting}
                    className="w-full h-12 mt-4 rounded-xl bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue/90 transition-all shadow-md disabled:opacity-60">
                    {submitting ? "Отправляем…" : "Отправить запрос"}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
