"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Plus, ArrowUpRight, ArrowDownRight, Shield, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const savedCards = [
  { id: 1, last4: "4521", type: "Visa", expires: "09/27", default: true, color: "from-brand-blue to-brand-purple" },
  { id: 2, last4: "8834", type: "Humo", expires: "03/26", default: false, color: "from-slate-700 to-slate-900" },
];

const transactions = [
  { id: "TXN-5021", desc: "Premium Wash", amount: -99000, type: "expense", date: "Jun 11, 10:30", card: "···4521" },
  { id: "TXN-5020", desc: "Wallet top-up", amount: +200000, type: "income", date: "Jun 10, 09:00", card: "···4521" },
  { id: "TXN-5019", desc: "Elite Detail", amount: -199000, type: "expense", date: "Jun 8, 09:15", card: "···8834" },
  { id: "TXN-5018", desc: "Express Wash", amount: -49000, type: "expense", date: "Jun 5, 11:00", card: "···4521" },
  { id: "TXN-5017", desc: "Loyalty cashback", amount: +15000, type: "income", date: "Jun 5, 11:05", card: "" },
];

export default function DashboardPaymentPage() {
  const { t } = useLanguage();
  const [showAddCard, setShowAddCard] = useState(false);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-black text-slate-900">{t("payment.title")}</h1>
        <p className="text-sm text-slate-400">{t("payment.subtitle")}</p>
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
        <div className="space-y-3">
          {savedCards.map((card, i) => (
            <motion.div key={card.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="relative">
              <div className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 text-white shadow-lg`}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="text-xs opacity-70 mb-0.5">{card.type}</div>
                    {card.default && (
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">{t("payment.default_")}</span>
                    )}
                  </div>
                  <CreditCard className="w-6 h-6 opacity-70" />
                </div>
                <div className="text-xl font-mono font-bold tracking-widest mb-3">···· ···· ···· {card.last4}</div>
                <div className="flex justify-between text-xs opacity-70">
                  <span>{t("payment.expiryDate")}: {card.expires}</span>
                  <button className="hover:opacity-100 opacity-60 transition-opacity">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add card modal */}
      <AnimatePresence>
        {showAddCard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowAddCard(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900">{t("payment.addCard")}</h3>
                <button onClick={() => setShowAddCard(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                {[
                  { label: t("payment.cardNumber"), placeholder: "0000 0000 0000 0000", type: "text" },
                  { label: t("payment.cardholderName"), placeholder: "Aziz Toshmatov", type: "text" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder}
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t("payment.expiryDate")}</label>
                    <input placeholder="MM/YY" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t("payment.cvv")}</label>
                    <input placeholder="···" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all" />
                  </div>
                </div>
              </div>
              <button onClick={() => setShowAddCard(false)}
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
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {transactions.map((tx, i) => (
            <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === "income" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                {tx.type === "income" ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900">{tx.desc}</div>
                <div className="text-xs text-slate-400">{tx.date}{tx.card ? ` · ${tx.card}` : ""}</div>
              </div>
              <div className={`text-sm font-bold ${tx.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                {tx.type === "income" ? "+" : ""}{tx.amount.toLocaleString()} so'm
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
