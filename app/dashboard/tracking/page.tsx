"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MessageSquare, Shield, Star, Navigation, AlertCircle, X, Send } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const steps = [
  { key: "step1", done: true },
  { key: "step2", done: true },
  { key: "step3", done: false },
  { key: "step4", done: false },
];

export default function DashboardTrackingPage() {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { from: "worker", text: "On my way! ETA 8 minutes.", time: "10:32" },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(m => [...m, { from: "user", text: message, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setMessage("");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900">{t("tracking.title")}</h1>
        <p className="text-sm text-slate-400">{t("tracking.subtitle")}</p>
      </div>

      {/* ETA card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-brand-blue text-white rounded-2xl p-5 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue to-brand-purple opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">{t("tracking.eta")}</div>
            <div className="text-5xl font-black">8 <span className="text-2xl">{t("common.min")}</span></div>
            <div className="text-sm opacity-80 mt-1">{t("tracking.workerOnWay")}</div>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-2 ml-auto">
              <Navigation className="w-8 h-8 text-white" />
            </div>
            <div className="text-xs opacity-70">Nodir T.</div>
          </div>
        </div>
        <motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden">
          <motion.div className="h-full bg-white/60" initial={{ width: "100%" }} animate={{ width: "35%" }} transition={{ duration: 8, ease: "linear" }} />
        </motion.div>
      </motion.div>

      {/* Map placeholder */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative">
          <div className="text-center">
            <Navigation className="w-8 h-8 text-brand-blue mx-auto mb-2" />
            <div className="text-sm text-slate-500 font-medium">Live Map</div>
            <div className="text-xs text-slate-400">Yunusobod district</div>
          </div>
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-brand-blue rounded-full shadow-lg" />
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="text-sm font-bold text-slate-900 mb-4">{t("tracking.progressTitle")}</div>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${step.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>
                {step.done ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${step.done ? "text-slate-900 font-medium" : "text-slate-400"}`}>{t(`tracking.${step.key}`)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Worker info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="text-sm font-bold text-slate-900 mb-4">{t("tracking.workerInfo")}</div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white font-bold">NT</div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900">Nodir Toshev</div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-500 font-semibold">4.9</span>
              <span>· 1,204 {t("tracking.totalWashes")}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all">
              <Phone className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue hover:bg-brand-blue/20 transition-all">
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
            <Shield className="w-3 h-3" /> {t("tracking.verified")}
          </div>
          <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg bg-brand-blue/5 border border-brand-blue/20 text-brand-blue">
            <Shield className="w-3 h-3" /> {t("tracking.insured")}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="text-sm font-bold text-slate-900 mb-4">{t("tracking.chatTitle")}</div>
        <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${msg.from === "user" ? "bg-brand-blue text-white" : "bg-slate-100 text-slate-900"}`}>
                {msg.text}
                <div className="text-[10px] opacity-60 mt-0.5 text-right">{msg.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={message} onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder={t("tracking.messagePlaceholder")}
            className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:border-brand-blue/50 transition-all" />
          <button onClick={sendMessage}
            className="w-9 h-9 rounded-xl bg-brand-blue flex items-center justify-center text-white hover:bg-brand-blue/90 transition-all">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cancel */}
      <button className="w-full h-11 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2">
        <AlertCircle className="w-4 h-4" /> {t("tracking.cancelBooking")}
      </button>
    </div>
  );
}
