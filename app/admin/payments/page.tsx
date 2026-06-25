"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ArrowUpRight, ArrowDownRight, CreditCard, TrendingUp, Check, X, Wallet, Paperclip, AlertCircle, User } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { debounce } from "@/lib/utils";
import { compressImage } from "@/lib/image";

type Tx = {
  id: string;
  order_number: string;
  user_id: string;
  price: number;
  status: string;
  created_at: string;
  client_name?: string;
};

type PendingPayment = {
  id: string;
  order_number: string;
  user_id: string;
  price: number;
  payment_method: string;
  receipt_url: string | null;
  created_at: string;
  client_name?: string;
};

type Payout = {
  id: string;
  worker_id: string;
  amount: number;
  status: string;
  created_at: string;
  card_number: string | null;
  receipt_url?: string | null;
  worker_name?: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminPaymentsPage() {
  const { t } = useLanguage();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingPayout, setPayingPayout] = useState<Payout | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [{ data: rows }, { data: payoutRows }, { data: pendingRows }] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, user_id, price, status, created_at")
          .in("status", ["completed", "cancelled"])
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("payout_requests")
          .select("id, worker_id, amount, status, created_at, card_number, receipt_url")
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id, order_number, user_id, price, payment_method, receipt_url, created_at")
          .eq("payment_status", "awaiting_verification")
          .order("created_at", { ascending: false }),
      ]);

      const orders = rows ?? [];
      const allUserIds = Array.from(new Set([...orders.map(o => o.user_id), ...(payoutRows ?? []).map(p => p.worker_id), ...(pendingRows ?? []).map(p => p.user_id)]));
      let names: Record<string, string> = {};
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", allUserIds);
        names = Object.fromEntries((profiles ?? []).map(p => [p.id, p.name]));
      }
      setTxs(orders.map(o => ({ ...o, client_name: names[o.user_id] ?? "—" })));
      setPayouts((payoutRows ?? []).map(p => ({ ...p, worker_name: names[p.worker_id] ?? "—" })));
      setPendingPayments((pendingRows ?? []).map(p => ({ ...p, client_name: names[p.user_id] ?? "—" })));
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

  const processPayout = async (id: string, status: "paid" | "rejected", receiptUrl?: string) => {
    const payout = payouts.find(p => p.id === id);
    setPayouts(prev => prev.map(p => p.id === id ? { ...p, status, receipt_url: receiptUrl ?? p.receipt_url } : p));
    const supabase = createClient();
    await supabase.from("payout_requests").update({
      status,
      processed_at: new Date().toISOString(),
      ...(receiptUrl ? { receipt_url: receiptUrl } : {}),
    }).eq("id", id);

    if (payout) {
      await supabase.from("notifications").insert({
        user_id: payout.worker_id,
        type: "system",
        title: status === "paid" ? "Деньги отправлены" : "Запрос на вывод отклонён",
        body: status === "paid"
          ? `Вам отправлено ${payout.amount.toLocaleString("ru-RU")} so'm.${receiptUrl ? " Чек приложен." : ""}`
          : `Запрос на вывод ${payout.amount.toLocaleString("ru-RU")} so'm отклонён. Свяжитесь с администратором.`,
      });
    }
  };

  const verifyPayment = async (id: string, decision: "verified" | "rejected") => {
    const payment = pendingPayments.find(p => p.id === id);
    setPendingPayments(prev => prev.filter(p => p.id !== id));
    const supabase = createClient();
    await supabase.from("orders").update({ payment_status: decision }).eq("id", id);

    if (payment) {
      await supabase.from("notifications").insert({
        user_id: payment.user_id,
        type: "system",
        title: decision === "verified" ? "Оплата подтверждена" : "Оплата отклонена",
        body: decision === "verified"
          ? `Ваш платёж по заказу ${payment.order_number} подтверждён.`
          : `Платёж по заказу ${payment.order_number} отклонён — проверьте чек и свяжитесь с поддержкой.`,
      });
    }
  };

  const confirmPaid = async () => {
    if (!payingPayout) return;
    if (!receiptFile) { setReceiptError("Прикрепите фото или скрин чека — без него заявку нельзя закрыть"); return; }

    setReceiptError("");
    setUploading(true);
    const supabase = createClient();

    const blob = await compressImage(receiptFile).catch(() => null);
    const path = `${payingPayout.id}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("payout-receipts").upload(path, blob ?? receiptFile, { contentType: "image/jpeg" });

    if (error) {
      setUploading(false);
      setReceiptError("Не удалось загрузить чек, попробуйте ещё раз");
      return;
    }

    const receiptUrl = supabase.storage.from("payout-receipts").getPublicUrl(path).data.publicUrl;
    await processPayout(payingPayout.id, "paid", receiptUrl);
    setUploading(false);
    setPayingPayout(null);
    setReceiptFile(null);
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

        {/* Pending customer payment verifications */}
        {pendingPayments.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-blue" />
              <div className="font-bold text-slate-900 text-sm">Ожидают подтверждения оплаты</div>
              <span className="text-xs bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full font-semibold border border-brand-blue/20">
                {pendingPayments.length}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingPayments.map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                  {p.receipt_url && (
                    <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <img src={p.receipt_url} alt="Чек" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                    </a>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">{p.client_name}</div>
                    <div className="text-xs text-slate-400">{p.order_number} · {p.price.toLocaleString()} so'm · {p.payment_method} · {formatDate(p.created_at)}</div>
                  </div>
                  <button onClick={() => verifyPayment(p.id, "verified")}
                    className="flex items-center gap-1 h-8 px-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-semibold hover:bg-emerald-100 transition-all">
                    <Check className="w-3.5 h-3.5" /> Подтвердить
                  </button>
                  <button onClick={() => verifyPayment(p.id, "rejected")}
                    className="flex items-center gap-1 h-8 px-3 rounded-lg bg-red-50 border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-100 transition-all">
                    <X className="w-3.5 h-3.5" /> Отклонить
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    {p.card_number && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                        <CreditCard className="w-3 h-3" /> {p.card_number}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setPayingPayout(p); setReceiptFile(null); setReceiptError(""); }}
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

      {/* Confirm payout modal */}
      <AnimatePresence>
        {payingPayout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => { if (!uploading) setPayingPayout(null); }}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900">Подтвердить выплату</h3>
                <button onClick={() => !uploading && setPayingPayout(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-700 font-medium">{payingPayout.worker_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-900 font-bold">{payingPayout.amount.toLocaleString("ru-RU")} so'm</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                  {payingPayout.card_number
                    ? <span className="text-slate-700 font-mono">{payingPayout.card_number}</span>
                    : <span className="text-red-500">Карта не указана — уточните у мойщика</span>}
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-2">
                Переведите деньги на карту выше, затем приложите фото или скрин чека — без него заявку нельзя закрыть.
              </p>

              {receiptError && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />{receiptError}
                </div>
              )}

              <label className="flex items-center gap-2 h-11 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-slate-600 text-sm font-medium cursor-pointer hover:bg-slate-100 transition-all">
                <Paperclip className="w-4 h-4 shrink-0" />
                <span className="truncate">{receiptFile ? receiptFile.name : "Прикрепить чек (фото/скрин)"}</span>
                <input type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={(e) => { setReceiptFile(e.target.files?.[0] ?? null); setReceiptError(""); }} />
              </label>

              <button onClick={confirmPaid} disabled={uploading}
                className="w-full h-12 mt-4 rounded-xl bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue/90 transition-all shadow-md disabled:opacity-60">
                {uploading ? "Сохраняем…" : "Подтвердить оплату"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
