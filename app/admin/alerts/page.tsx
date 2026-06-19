"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertTriangle, Shield, Zap, X, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

type Order = {
  order_number: string; status: string; worker_id: string | null; worker_name: string | null;
  worker_rating: number | null; location_name: string; created_at: string;
};

type Alert = { id: string; icon: typeof AlertTriangle; msg: string; color: string; time: string };

const colorCard: Record<string, string> = {
  orange: "bg-orange-50 border-orange-200 text-orange-600",
  red:    "bg-red-50 border-red-200 text-red-600",
  blue:   "bg-brand-blue/5 border-brand-blue/20 text-brand-blue",
  green:  "bg-emerald-50 border-emerald-200 text-emerald-600",
};

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} мин назад`;
  if (mins < 1440) return `${Math.floor(mins / 60)} ч назад`;
  return `${Math.floor(mins / 1440)} дн назад`;
}

export default function AdminAlertsPage() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: orders } = await supabase
        .from("orders")
        .select("order_number, status, worker_id, worker_name, worker_rating, location_name, created_at");

      const { count: activeWorkers } = await supabase
        .from("profiles").select("id", { count: "exact", head: true }).eq("role", "WORKER").eq("is_active", true);

      const rows = (orders ?? []) as Order[];
      const result: Alert[] = [];

      const pending = rows.filter(o => o.status === "pending");
      if ((activeWorkers ?? 0) === 0 && pending.length > 0) {
        result.push({ id: "no-workers", icon: AlertTriangle, color: "orange", time: "сейчас",
          msg: `${pending.length} заказ(ов) ожидают, но ни одного мойщика онлайн` });
      }

      pending.filter(o => (Date.now() - new Date(o.created_at).getTime()) > 10 * 60000).forEach(o => {
        result.push({ id: `late-${o.order_number}`, icon: Zap, color: "blue", time: timeAgo(o.created_at),
          msg: `Заказ ${o.order_number} ожидает мойщика больше 10 минут` });
      });

      rows.filter(o => o.status === "completed" && o.worker_rating !== null && o.worker_rating <= 3).forEach(o => {
        result.push({ id: `rating-${o.order_number}`, icon: AlertTriangle, color: "orange", time: timeAgo(o.created_at),
          msg: `Мойщик ${o.worker_name ?? "—"} получил низкую оценку (${o.worker_rating}★) за заказ ${o.order_number}` });
      });

      const cancelled = rows.filter(o => o.status === "cancelled");
      if (cancelled.length > 0) {
        result.push({ id: "cancelled-total", icon: Shield, color: "red", time: "всё время",
          msg: `${cancelled.length} отменённых заказ(ов) за всё время` });
      }

      setAlerts(result);
      setLoading(false);
    }

    load();
    const channel = supabase.channel("admin-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const visible = alerts.filter(a => !dismissed.has(a.id));
  const dismiss = (id: string) => setDismissed(prev => new Set(prev).add(id));
  const markAllRead = () => setDismissed(new Set(alerts.map(a => a.id)));

  return (
    <>
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-lg font-bold text-slate-900">{t("admin.alerts")}</div>
            <div className="text-xs text-slate-400">{visible.length} {t("common.new_")}</div>
          </div>
          {visible.length > 0 && (
            <span className="text-xs bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full font-bold">{visible.length}</span>
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
            {visible.map((a) => {
              const Icon = a.icon;
              return (
                <motion.div key={a.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-start gap-3 p-4 rounded-2xl border shadow-sm ${colorCard[a.color]}`}>
                  <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-900 leading-relaxed font-medium">{a.msg}</div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-slate-400">{a.time}</span>
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

          {!loading && visible.length === 0 && (
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
