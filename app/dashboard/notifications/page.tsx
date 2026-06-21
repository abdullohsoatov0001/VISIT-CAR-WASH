"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Droplets, CreditCard, Star, Gift, AlertCircle,
  CheckCheck, Trash2, Zap
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "@/lib/context/UserContext";
import { useRouter } from "next/navigation";

type NotifType = "order" | "payment" | "promo" | "system" | "rating";

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
  urgent: boolean;
  order_id: string | null;
}

const typeConfig: Record<NotifType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  order:   { icon: Droplets,   color: "text-brand-blue",   bg: "bg-brand-blue/10",   border: "border-brand-blue/20" },
  payment: { icon: CreditCard, color: "text-emerald-600",  bg: "bg-emerald-50",      border: "border-emerald-200" },
  promo:   { icon: Gift,       color: "text-brand-purple", bg: "bg-brand-purple/10", border: "border-brand-purple/20" },
  system:  { icon: Zap,        color: "text-slate-500",    bg: "bg-slate-100",       border: "border-slate-200" },
  rating:  { icon: Star,       color: "text-yellow-500",   bg: "bg-yellow-50",       border: "border-yellow-200" },
};

const filterTabs = ["All", "Orders", "Promotions", "Payments"] as const;
type Filter = typeof filterTabs[number];

const filterMap: Record<Filter, NotifType[] | null> = {
  All: null,
  Orders: ["order", "rating"],
  Promotions: ["promo"],
  Payments: ["payment"],
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function DashboardNotificationsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { profile } = useUserContext();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [filter, setFilter] = useState<Filter>("All");

  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();

    supabase
      .from("notifications")
      .select("id, type, title, body, created_at, read, urgent, order_id")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setNotifs(data ?? []));

    const channel = supabase
      .channel(`notifications-${profile.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}`,
      }, (payload) => {
        const row = (payload.new ?? payload.old) as Notif;
        setNotifs((prev) => {
          if (payload.eventType === "INSERT") return [row, ...prev];
          if (payload.eventType === "UPDATE") return prev.map((n) => n.id === row.id ? { ...n, ...row } : n);
          if (payload.eventType === "DELETE") return prev.filter((n) => n.id !== row.id);
          return prev;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!profile) return;
    const supabase = createClient();
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", profile.id).eq("read", false);
  };

  const markRead = async (id: string) => {
    const supabase = createClient();
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const openNotif = (n: Notif) => {
    markRead(n.id);
    if (n.type === "rating" && n.order_id) {
      router.push(`/dashboard/rate/${n.order_id}`);
    }
  };

  const remove = async (id: string) => {
    const supabase = createClient();
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  const filtered = notifs.filter((n) => {
    const types = filterMap[filter];
    return types ? types.includes(n.type) : true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            {t("common.notifications")}
            {unreadCount > 0 && (
              <span className="text-xs bg-brand-blue text-white px-2 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{t("notifications.subtitle")}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-brand-blue font-semibold hover:text-brand-blue/80 transition-colors">
            <CheckCheck className="w-3.5 h-3.5" />
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => {
          const types = filterMap[tab];
          const count = types
            ? notifs.filter((n) => !n.read && types.includes(n.type)).length
            : unreadCount;
          return (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${filter === tab ? "bg-brand-blue text-white border-brand-blue shadow-sm" : "bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200"}`}>
              {tab}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filter === tab ? "bg-white/25 text-white" : "bg-slate-300 text-slate-600"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-sm font-semibold text-slate-600">{t("notifications.empty")}</div>
              <div className="text-xs text-slate-400 mt-1">{t("notifications.emptySub")}</div>
            </motion.div>
          ) : (
            filtered.map((n, i) => {
              const cfg = typeConfig[n.type];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => openNotif(n)}
                  className={`relative flex gap-3 p-4 rounded-2xl border cursor-pointer transition-all group
                    ${n.read ? "bg-white border-slate-200 hover:border-slate-300" : "bg-brand-blue/[0.03] border-brand-blue/20 hover:border-brand-blue/40"}`}>
                  {!n.read && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-blue flex-shrink-0" />
                  )}
                  {n.urgent && (
                    <span className="absolute top-3 right-8 text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" /> URGENT
                    </span>
                  )}

                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.border}`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className={`text-sm font-bold leading-tight mb-0.5 ${n.read ? "text-slate-700" : "text-slate-900"}`}>
                      {n.title}
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed">{n.body}</div>
                    <div className="text-[10px] text-slate-400 mt-1.5 font-medium">{formatTime(n.created_at)}</div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                    className="absolute top-3.5 right-3.5 w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
