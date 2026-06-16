"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Droplets, CreditCard, Star, Gift, AlertCircle,
  Check, CheckCheck, Trash2, Navigation, Zap
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

type NotifType = "order" | "payment" | "promo" | "system" | "rating";

interface Notif {
  id: number;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  urgent?: boolean;
}

const initialNotifs: Notif[] = [
  { id: 1, type: "order", title: "Washer is 5 minutes away!", body: "Nodir T. is approaching your location — Premium Wash #W-1043.", time: "Just now", read: false, urgent: true },
  { id: 2, type: "order", title: "Wash completed ✓", body: "Your Premium Wash has been completed. Before/after photos are ready.", time: "2h ago", read: false },
  { id: 3, type: "rating", title: "Rate your experience", body: "How was your Express Wash on June 10 with Sardor K.?", time: "Yesterday", read: false },
  { id: 4, type: "promo", title: "15% off — rain tomorrow 🌧️", body: "Book today before the rain hits. Discount applied automatically.", time: "Yesterday", read: true },
  { id: 5, type: "payment", title: "Payment confirmed", body: "99 000 so'm charged to ···4521 for Premium Wash #W-1042.", time: "June 11", read: true },
  { id: 6, type: "promo", title: "You've earned 200 points! 🎉", body: "Your Gold status is secure. 660 points until Platinum.", time: "June 11", read: true },
  { id: 7, type: "system", title: "New feature: Car Health Score", body: "Track your car's condition over time in the History tab.", time: "June 10", read: true },
  { id: 8, type: "order", title: "Washer assigned", body: "Jamshid U. (⭐ 4.9) has been assigned to your Elite Detail.", time: "June 8", read: true },
  { id: 9, type: "payment", title: "Wallet top-up confirmed", body: "+200 000 so'm added to your VISIT wallet.", time: "June 10", read: true },
  { id: 10, type: "promo", title: "Pro Plan — save 35% monthly", body: "Upgrade to Pro and get 8 Premium washes + priority booking.", time: "June 7", read: true },
];

const typeConfig: Record<NotifType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  order: { icon: Droplets, color: "text-brand-blue", bg: "bg-brand-blue/10", border: "border-brand-blue/20" },
  payment: { icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  promo: { icon: Gift, color: "text-brand-purple", bg: "bg-brand-purple/10", border: "border-brand-purple/20" },
  system: { icon: Zap, color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200" },
  rating: { icon: Star, color: "text-yellow-500", bg: "bg-yellow-50", border: "border-yellow-200" },
};

const filterTabs = ["All", "Orders", "Promotions", "Payments"] as const;
type Filter = typeof filterTabs[number];

const filterMap: Record<Filter, NotifType[] | null> = {
  All: null,
  Orders: ["order", "rating"],
  Promotions: ["promo"],
  Payments: ["payment"],
};

export default function DashboardNotificationsPage() {
  const { t } = useLanguage();
  const [notifs, setNotifs] = useState<Notif[]>(initialNotifs);
  const [filter, setFilter] = useState<Filter>("All");

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const remove = (id: number) => setNotifs((prev) => prev.filter((n) => n.id !== id));

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
                  onClick={() => markRead(n.id)}
                  className={`relative flex gap-3 p-4 rounded-2xl border cursor-pointer transition-all group
                    ${n.read ? "bg-white border-slate-200 hover:border-slate-300" : "bg-brand-blue/[0.03] border-brand-blue/20 hover:border-brand-blue/40"}`}>
                  {/* Unread dot */}
                  {!n.read && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-blue flex-shrink-0" />
                  )}
                  {/* Urgent badge */}
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
                    <div className="text-[10px] text-slate-400 mt-1.5 font-medium">{n.time}</div>
                  </div>

                  {/* Delete on hover */}
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
