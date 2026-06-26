"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Plus, ArrowUpRight, ArrowDownRight, Shield, X, Zap, Star, Award, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "@/lib/context/UserContext";

type Card = {
  id: string;
  card_type: string;
  last4: string;
  expires: string | null;
  is_default: boolean;
};

type Transaction = {
  id: string;
  order_number: string;
  service_type: string;
  price: number;
  status: string;
  created_at: string;
};

type Subscription = {
  id: string;
  plan: string;
  status: string;
  washes_left: number;
  washes_total: number;
  current_period_end: string;
};

const SUBSCRIPTION_PLANS = [
  { id: "starter", name: "Starter", icon: Zap,  price: 730000, washes: 4,  color: "text-brand-blue border-brand-blue/30 bg-brand-blue/5" },
  { id: "pro",     name: "Pro",     icon: Star, price: 1680000, washes: 6,  color: "text-brand-purple border-brand-purple/30 bg-brand-purple/5" },
  { id: "black",   name: "Black",   icon: Award, price: 2510000, washes: 10, color: "text-slate-900 border-slate-300 bg-slate-50" },
];

const cardGradient = (type: string) =>
  type.toLowerCase() === "humo" ? "from-slate-700 to-slate-900" : "from-brand-blue to-brand-purple";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPaymentPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPaymentInner />
    </Suspense>
  );
}

function DashboardPaymentInner() {
  const { t } = useLanguage();
  const { profile } = useUserContext();
  const searchParams = useSearchParams();

  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({ number: "", type: "Visa", expires: "" });

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [activatingPlan, setActivatingPlan] = useState<string | null>(null);

  const loadSubscription = async (userId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("subscriptions")
      .select("id, plan, status, washes_left, washes_total, current_period_end")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription(data ?? null);
  };

  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();

    supabase
      .from("payment_methods")
      .select("id, card_type, last4, expires, is_default")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setCards(data ?? []));

    supabase
      .from("orders")
      .select("id, order_number, service_type, price, status, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setTransactions(data ?? []));

    loadSubscription(profile.id);
  }, [profile?.id]);

  const activatePlan = async (planId: string) => {
    if (!profile || activatingPlan) return;
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) return;

    setActivatingPlan(planId);
    const supabase = createClient();

    // Активация без реального платёжного процессора (Click/Payme вне скоупа) —
    // подписка включается сразу, как и фейковые карты на этой же странице
    if (subscription) {
      await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", subscription.id);
    }

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabase.from("subscriptions").insert({
      user_id: profile.id,
      plan: plan.id,
      status: "active",
      washes_left: plan.washes,
      washes_total: plan.washes,
      price: plan.price,
      current_period_end: periodEnd.toISOString(),
    });

    await loadSubscription(profile.id);
    setActivatingPlan(null);
  };

  const cancelSubscription = async () => {
    if (!subscription) return;
    const supabase = createClient();
    await supabase.from("subscriptions").update({ status: "cancelled" }).eq("id", subscription.id);
    setSubscription(null);
  };

  const suggestedPlan = searchParams.get("plan");

  const handleAddCard = async () => {
    if (!profile || newCard.number.replace(/\D/g, "").length < 4) return;
    const supabase = createClient();
    const last4 = newCard.number.replace(/\D/g, "").slice(-4);
    const { data } = await supabase
      .from("payment_methods")
      .insert({
        user_id: profile.id,
        card_type: newCard.type,
        last4,
        expires: newCard.expires || null,
        is_default: cards.length === 0,
      })
      .select("id, card_type, last4, expires, is_default")
      .single();

    if (data) setCards((prev) => [...prev, data]);
    setNewCard({ number: "", type: "Visa", expires: "" });
    setShowAddCard(false);
  };

  const removeCard = async (id: string) => {
    const supabase = createClient();
    setCards((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("payment_methods").delete().eq("id", id);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900">{t("payment.title")}</h1>
        <p className="text-sm text-slate-400">{t("payment.subtitle")}</p>
      </div>

      {/* Subscription */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-slate-900">Подписка</span>
          {subscription && (
            <button onClick={cancelSubscription} className="text-xs text-red-400 font-semibold hover:text-red-500 transition-colors">
              Отменить подписку
            </button>
          )}
        </div>

        {subscription ? (
          <div className="bg-gradient-to-br from-brand-blue to-brand-purple rounded-2xl p-5 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs opacity-70 mb-0.5 uppercase tracking-wide">Активный план</div>
                <div className="text-xl font-black capitalize">{subscription.plan}</div>
              </div>
              <Check className="w-6 h-6 opacity-80" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-80">
                {subscription.washes_left < 0 ? "Безлимит моек" : `Осталось моек: ${subscription.washes_left} / ${subscription.washes_total}`}
              </span>
              <span className="opacity-70 text-xs">до {formatDate(subscription.current_period_end)}</span>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <div key={plan.id}
                  className={`relative border rounded-2xl p-4 ${plan.color} ${suggestedPlan === plan.id ? "ring-2 ring-brand-blue/40" : ""}`}>
                  {suggestedPlan === plan.id && (
                    <span className="absolute -top-2.5 left-4 text-[10px] bg-brand-blue text-white px-2 py-0.5 rounded-full font-semibold">Выбрано</span>
                  )}
                  <Icon className="w-5 h-5 mb-2" />
                  <div className="font-bold text-sm mb-0.5">{plan.name}</div>
                  <div className="text-xs opacity-70 mb-3">{plan.washes < 0 ? "Безлимит" : `${plan.washes} моек/мес`}</div>
                  <div className="font-black text-base mb-3">{(plan.price / 1000).toFixed(0)}K <span className="text-xs font-normal opacity-60">so'm/мес</span></div>
                  <button onClick={() => activatePlan(plan.id)} disabled={activatingPlan !== null}
                    className="w-full h-9 rounded-xl bg-white/80 text-slate-900 text-xs font-bold hover:bg-white transition-all disabled:opacity-60">
                    {activatingPlan === plan.id ? "Подключаем…" : "Подключить"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-slate-900">{t("payment.savedCards")}</span>
          <button onClick={() => setShowAddCard(true)}
            className="flex items-center gap-1.5 text-xs text-brand-blue font-semibold hover:text-brand-blue/80 transition-colors">
            <Plus className="w-3.5 h-3.5" /> {t("payment.addCard")}
          </button>
        </div>
        {cards.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">
            Карты пока не добавлены
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card, i) => (
              <motion.div key={card.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="relative">
                <div className={`bg-gradient-to-br ${cardGradient(card.card_type)} rounded-2xl p-5 text-white shadow-lg`}>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="text-xs opacity-70 mb-0.5">{card.card_type}</div>
                      {card.is_default && (
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">{t("payment.default_")}</span>
                      )}
                    </div>
                    <CreditCard className="w-6 h-6 opacity-70" />
                  </div>
                  <div className="text-xl font-mono font-bold tracking-widest mb-3">···· ···· ···· {card.last4}</div>
                  <div className="flex justify-between text-xs opacity-70">
                    <span>{t("payment.expiryDate")}: {card.expires ?? "—"}</span>
                    <button onClick={() => removeCard(card.id)} className="hover:opacity-100 opacity-60 transition-opacity">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add card modal */}
      <AnimatePresence>
        {showAddCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowAddCard(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900">{t("payment.addCard")}</h3>
                <button onClick={() => setShowAddCard(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t("payment.cardNumber")}</label>
                  <input value={newCard.number} onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
                    placeholder="0000 0000 0000 0000"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Тип</label>
                    <select value={newCard.type} onChange={(e) => setNewCard({ ...newCard, type: e.target.value })}
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-brand-blue/50 transition-all">
                      <option>Visa</option><option>Humo</option><option>UzCard</option><option>Mastercard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t("payment.expiryDate")}</label>
                    <input value={newCard.expires} onChange={(e) => setNewCard({ ...newCard, expires: e.target.value })}
                      placeholder="MM/YY" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all" />
                  </div>
                </div>
              </div>
              <button onClick={handleAddCard}
                className="w-full h-12 mt-5 rounded-xl bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue/90 transition-all shadow-md">
                {t("payment.saveCard")}
              </button>
              <div className="flex items-center gap-2 justify-center mt-3 text-xs text-slate-400">
                <Shield className="w-3.5 h-3.5" /> {t("payment.securityNote")}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3">{t("payment.transactions")}</h2>
        {transactions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">
            Транзакций пока нет
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
            {transactions.map((tx, i) => {
              const isRefundLike = tx.status === "cancelled";
              return (
                <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isRefundLike ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                    {isRefundLike ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">{tx.service_type}</div>
                    <div className="text-xs text-slate-400">{tx.order_number} · {formatDate(tx.created_at)}</div>
                  </div>
                  <div className={`text-sm font-bold ${isRefundLike ? "text-emerald-600" : "text-red-500"}`}>
                    {isRefundLike ? "+" : "-"}{tx.price.toLocaleString()} so'm
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
