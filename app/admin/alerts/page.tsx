"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertTriangle, Shield, Zap, X, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const allAlerts = [
  { id: 1, type: "warning", icon: AlertTriangle, msg: "Worker Ulugbek N. has been offline for 2 hours during peak time", time: "10 min ago", color: "orange", read: false },
  { id: 2, type: "fraud", icon: Shield, msg: "Suspicious payment pattern detected — User #4829, 3 failed attempts", time: "25 min ago", color: "red", read: false },
  { id: 3, type: "demand", icon: Zap, msg: "Peak demand: Yunusobod has 18 pending orders, only 3 workers online", time: "1 hr ago", color: "blue", read: false },
  { id: 4, type: "info", icon: Bell, msg: "System backup completed successfully. 99.98% uptime maintained.", time: "2 hr ago", color: "green", read: true },
  { id: 5, type: "warning", icon: AlertTriangle, msg: "Worker Sardor K. received 2 consecutive low ratings (3★)", time: "3 hr ago", color: "orange", read: true },
  { id: 6, type: "fraud", icon: Shield, msg: "Multiple accounts from same device detected — IP 185.x.x.x", time: "5 hr ago", color: "red", read: true },
];

const colorCard: Record<string, string> = {
  orange: "bg-orange-50 border-orange-200 text-orange-600",
  red: "bg-red-50 border-red-200 text-red-600",
  blue: "bg-brand-blue/5 border-brand-blue/20 text-brand-blue",
  green: "bg-emerald-50 border-emerald-200 text-emerald-600",
};

export default function AdminAlertsPage() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState(allAlerts);

  const dismiss = (id: number) => setAlerts(a => a.filter(x => x.id !== id));
  const markAllRead = () => setAlerts(a => a.map(x => ({ ...x, read: true })));
  const unread = alerts.filter(a => !a.read).length;

  return (
    <>
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-lg font-bold text-slate-900">{t("admin.alerts")}</div>
            <div className="text-xs text-slate-400">{unread} {t("common.new_")}</div>
          </div>
          {unread > 0 && (
            <span className="text-xs bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full font-bold">{unread}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={markAllRead}
            className="text-xs text-brand-blue hover:text-brand-blue/80 transition-colors font-medium flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> {t("admin.markAllRead")}
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold">AD</div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3 max-w-2xl">
          <AnimatePresence>
            {alerts.map((a) => {
              const Icon = a.icon;
              return (
                <motion.div key={a.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-start gap-3 p-4 rounded-2xl border shadow-sm ${colorCard[a.color]} ${a.read ? "opacity-60" : ""}`}>
                  <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-900 leading-relaxed font-medium">{a.msg}</div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-slate-400">{a.time}</span>
                      {!a.read && <span className="text-[10px] bg-brand-blue/10 text-brand-blue px-1.5 py-0.5 rounded font-semibold">{t("common.new_")}</span>}
                    </div>
                  </div>
                  <button onClick={() => dismiss(a.id)}
                    className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors ml-2">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {alerts.length === 0 && (
            <div className="text-center py-16">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <div className="text-slate-600 font-semibold">{t("common.done")}</div>
              <div className="text-sm text-slate-400 mt-1">No alerts to show</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
