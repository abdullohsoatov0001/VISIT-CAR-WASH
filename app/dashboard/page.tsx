"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Car, MapPin, Clock, Star, Bell, ChevronRight,
  Award, Zap, CreditCard, ArrowUpRight, Package
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { getInitials, getLoyaltyInfo, tierColors } from "@/lib/hooks/useUser";
import { useUserContext } from "@/lib/context/UserContext";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  order_number: string;
  service_type: string;
  status: string;
  price: number;
  location_name: string;
  worker_name: string | null;
  worker_rating: number | null;
  user_rating: number | null;
  created_at: string;
  completed_at: string | null;
};

const quickServices = [
  { id: "express", icon: "⚡", label: "Standard", price: "200K", color: "bg-brand-blue/10 border-brand-blue/20 text-brand-blue", time: "~30 min" },
  { id: "premium", icon: "✨", label: "Premium", price: "320K", color: "bg-brand-purple/10 border-brand-purple/20 text-brand-purple", time: "~60 min" },
  { id: "detail", icon: "💎", label: "VIP", price: "450K", color: "bg-cyan-50 border-cyan-200 text-cyan-600", time: "~120 min" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatPrice(n: number) {
  return n.toLocaleString("ru-RU");
}

export default function UserDashboard() {
  const { t } = useLanguage();
  const { profile } = useUserContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const firstName     = profile?.name?.split(" ")[0] ?? "…";
  const initials      = profile ? getInitials(profile.name) : "…";
  const today         = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const loyaltyPoints = profile?.loyalty_points ?? 0;
  const loyaltyTier   = profile?.loyalty_tier   ?? "Bronze";
  const loyalty       = getLoyaltyInfo(loyaltyPoints);
  const totalWashes   = profile?.total_washes   ?? 0;
  const totalSpent    = profile?.total_spent    ?? 0;
  const tierColor     = tierColors[loyaltyTier] ?? tierColors.Bronze;

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function fetchOrders() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || cancelled) { setOrdersLoading(false); return; }

      const { data } = await supabase
        .from("orders")
        .select("id, order_number, service_type, status, price, location_name, worker_name, worker_rating, user_rating, created_at, completed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (cancelled) return;
      setOrders(data ?? []);
      setOrdersLoading(false);

      // Realtime — только заказы этого пользователя, не вся таблица
      channel = supabase
        .channel("dashboard-orders")
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          const row = (payload.new ?? payload.old) as Order;
          setOrders(prev => {
            const exists = prev.find(o => o.id === row.id);
            if (payload.eventType === "INSERT" && !exists) return [row, ...prev];
            if (payload.eventType === "UPDATE") return prev.map(o => o.id === row.id ? { ...o, ...row } : o);
            if (payload.eventType === "DELETE") return prev.filter(o => o.id !== row.id);
            return prev;
          });
        })
        .subscribe();
    }

    fetchOrders();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const recentOrders = orders.filter(o => o.status === "completed").slice(0, 3);

  return (
    <>
      {/* Top bar */}
      <div className="hidden lg:flex sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 py-4 items-center justify-between">
        <div>
          <div className="text-lg font-bold text-slate-900">{t("dashboard.greeting")}, {firstName} 👋</div>
          <div className="text-xs text-slate-400 capitalize">{today}</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all">
            <Bell className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold">{initials}</div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">

        {/* Quick Book */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">{t("dashboard.quickBook")}</h2>
            <Link href="/booking" className="text-xs text-brand-blue hover:text-brand-blue/80 flex items-center gap-1">
              {t("dashboard.seeAll")} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {quickServices.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className={`border rounded-2xl p-4 cursor-pointer transition-all ${s.color}`}>
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="font-bold text-sm">{s.label}</div>
                <div className="text-xs opacity-60 mb-2">{s.time}</div>
                <div className="font-black text-base">{s.price}</div>
                <div className="text-xs opacity-50">so'm</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Orders */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">{t("dashboard.recentOrders")}</h2>
              {recentOrders.length > 0 && (
                <Link href="/dashboard/history" className="text-xs text-brand-blue hover:text-brand-blue/80 flex items-center gap-1">
                  {t("dashboard.seeAll")} <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 animate-pulse h-24" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
                <div className="font-bold text-slate-900 mb-1">Заказов пока нет</div>
                <div className="text-sm text-slate-400 mb-6">Закажите первую мойку — мастер приедет к вам</div>
                <Link href="/booking">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="px-6 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold shadow-md hover:bg-brand-blue/90 transition-all">
                    Заказать мойку
                  </motion.button>
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order, i) => (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-brand-blue/20 transition-all cursor-pointer shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                          <Car className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{order.service_type}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            {order.location_name && <><MapPin className="w-3 h-3" />{order.location_name}<span>·</span></>}
                            <Clock className="w-3 h-3" />{formatDate(order.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 text-sm">{formatPrice(order.price)} so'm</div>
                        {order.user_rating && (
                          <div className="flex items-center gap-0.5 justify-end mt-1">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star key={j} className={`w-2.5 h-2.5 ${j < (order.user_rating ?? 0) ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {order.worker_name && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                        <div className="w-5 h-5 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-[9px] font-bold text-brand-blue">
                          {order.worker_name[0]}
                        </div>
                        <span className="text-xs text-slate-400">{order.worker_name}</span>
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium border border-emerald-200">
                          {t("common.completed")}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* Loyalty */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold text-slate-900 text-sm">{t("dashboard.loyaltyPoints")}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg font-semibold border ${tierColor}`}>{loyaltyTier}</span>
              </div>
              <div className="text-3xl font-black text-slate-900 mb-1">{loyaltyPoints.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mb-4">{loyalty.toNext} {t("dashboard.pointsToNext")} {loyalty.next}</div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${loyalty.progress}%` }}
                  transition={{ duration: 1.2, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full" />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                <span>{loyaltyTier}</span>
                <span>{loyalty.next}</span>
              </div>
            </div>

            {/* Monthly stats */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4">{t("dashboard.thisMonth")}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Car className="w-4 h-4" />{t("dashboard.totalWashes")}
                  </div>
                  <span className="text-sm font-bold text-brand-blue">{totalWashes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <CreditCard className="w-4 h-4" />{t("dashboard.totalSpent")}
                  </div>
                  <span className="text-sm font-bold text-brand-purple">
                    {totalSpent > 0 ? `${formatPrice(totalSpent)} so'm` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-4 h-4" />{t("dashboard.timeSaved")}
                  </div>
                  <span className="text-sm font-bold text-emerald-600">
                    {totalWashes > 0 ? `~${totalWashes * 2} hrs` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Subscription CTA */}
            <div className="bg-gradient-to-br from-brand-blue/8 to-brand-purple/5 border border-brand-blue/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-brand-blue" />
                <span className="text-xs font-semibold text-brand-blue uppercase tracking-wider">{t("dashboard.proPlan")}</span>
              </div>
              <div className="text-sm font-bold text-slate-900 mb-1">{t("dashboard.saveMonthly")}</div>
              <div className="text-xs text-slate-500 mb-4">{t("dashboard.proDesc")}</div>
              <Link href="/pricing">
                <button className="w-full h-9 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-1 shadow-sm">
                  {t("dashboard.upgradePro")} <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
