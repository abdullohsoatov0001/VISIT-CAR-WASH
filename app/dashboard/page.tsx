"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Car, MapPin, Clock, Star, Plus, Bell, ChevronRight,
  Award, Zap, Navigation, CreditCard, ArrowUpRight
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { getInitials } from "@/lib/hooks/useUser";
import { useUserContext } from "@/lib/context/UserContext";

const recentOrders = [
  { id: "W-1042", service: "Premium Wash", date: "Today, 10:30", status: "completed", price: "99 000", worker: "Jamshid U.", rating: 5, location: "Yunusobod" },
  { id: "W-1039", service: "Express Wash", date: "Yesterday, 14:00", status: "completed", price: "49 000", worker: "Sardor K.", rating: 4, location: "Chilonzor" },
  { id: "W-1031", service: "Elite Detail", date: "Jun 8, 09:15", status: "completed", price: "199 000", worker: "Bobur M.", rating: 5, location: "Mirzo Ulugbek" },
];

const activeOrder = { id: "W-1043", service: "Premium Wash", worker: "Nodir T.", workerRating: 4.8, eta: "8 min", status: "en-route", price: "99 000" };
const loyaltyPoints = 2340;
const level = "Gold";
const nextLevel = "Platinum";
const pointsToNext = 660;

const quickServices = [
  { id: "express", icon: "⚡", label: "Express", price: "49K", color: "bg-brand-blue/10 border-brand-blue/20 text-brand-blue", time: "~30 min" },
  { id: "premium", icon: "✨", label: "Premium", price: "99K", color: "bg-brand-purple/10 border-brand-purple/20 text-brand-purple", time: "~60 min" },
  { id: "detail", icon: "💎", label: "Detail", price: "199K", color: "bg-cyan-50 border-cyan-200 text-cyan-600", time: "~120 min" },
  { id: "eco", icon: "🌿", label: "Eco", price: "59K", color: "bg-emerald-50 border-emerald-200 text-emerald-600", time: "~45 min" },
];

const recommendations = [
  { icon: "🌧️", title: "Rain expected tomorrow", desc: "Book a wash now before the rain — 15% off today.", cta: "Book Express", urgent: true },
  { icon: "📅", title: "You haven't washed in 14 days", desc: "Your Premium Membership includes 2 more washes this month.", cta: "Book Now" },
];

export default function UserDashboard() {
  const { t } = useLanguage();
  const { profile } = useUserContext();

  const firstName  = profile?.name?.split(" ")[0] ?? "…";
  const initials   = profile ? getInitials(profile.name) : "…";
  const today      = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

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
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-blue rounded-full" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold">{initials}</div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Active Order Banner */}
        {activeOrder && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-brand-blue/5 border border-brand-blue/20 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-brand-blue/5 to-transparent" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                    <Car className="w-5 h-5 text-brand-blue" />
                  </div>
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }} transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-brand-blue uppercase tracking-wider">{t("dashboard.activeOrder")}</span>
                    <span className="text-xs text-slate-400">#{activeOrder.id}</span>
                  </div>
                  <div className="font-bold text-slate-900">{activeOrder.worker} {t("tracking.workerOnWay").toLowerCase()}</div>
                  <div className="text-sm text-slate-500">{activeOrder.service} · {t("dashboard.etaLabel")} <span className="text-emerald-600 font-semibold">{activeOrder.eta}</span></div>
                </div>
              </div>
              <Link href="/dashboard/tracking">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue text-white text-sm font-semibold shadow-sm">
                  {t("dashboard.trackLive")} <Navigation className="w-3.5 h-3.5" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Quick Book */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">{t("dashboard.quickBook")}</h2>
            <Link href="/booking" className="text-xs text-brand-blue hover:text-brand-blue/80 flex items-center gap-1">{t("dashboard.seeAll")} <ChevronRight className="w-3 h-3" /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

        {/* AI Recommendations */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-brand-blue" />
            <h2 className="font-bold text-slate-900">{t("dashboard.aiRecommendations")}</h2>
          </div>
          <div className="space-y-3">
            {recommendations.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${r.urgent ? "bg-orange-50 border-orange-200" : "bg-white border-slate-200"}`}>
                <span className="text-2xl flex-shrink-0">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 text-sm mb-0.5">{r.title}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{r.desc}</div>
                </div>
                <Link href="/booking">
                  <button className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${r.urgent ? "bg-orange-500 text-white" : "bg-brand-blue/10 text-brand-blue border border-brand-blue/20 hover:bg-brand-blue/20"}`}>
                    {r.cta}
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">{t("dashboard.recentOrders")}</h2>
              <Link href="/dashboard/history" className="text-xs text-brand-blue hover:text-brand-blue/80 flex items-center gap-1">{t("dashboard.seeAll")} <ChevronRight className="w-3 h-3" /></Link>
            </div>
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
                        <div className="font-semibold text-slate-900 text-sm">{order.service}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <MapPin className="w-3 h-3" />{order.location}
                          <span>·</span>
                          <Clock className="w-3 h-3" />{order.date}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm">{order.price}</div>
                      <div className="flex items-center gap-0.5 justify-end mt-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className={`w-2.5 h-2.5 ${j < order.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <div className="w-5 h-5 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-[9px] font-bold text-brand-blue">
                      {order.worker[0]}
                    </div>
                    <span className="text-xs text-slate-400">{order.worker}</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 font-medium border border-emerald-200">{t("common.completed")}</span>
                  </div>
                </motion.div>
              ))}
            </div>
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
                <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded-lg font-semibold border border-yellow-200">{level}</span>
              </div>
              <div className="text-3xl font-black text-slate-900 mb-1">{loyaltyPoints.toLocaleString()}</div>
              <div className="text-xs text-slate-400 mb-4">{pointsToNext} {t("dashboard.pointsToNext")} {nextLevel}</div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(loyaltyPoints / (loyaltyPoints + pointsToNext)) * 100}%` }}
                  transition={{ duration: 1.2, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full" />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                <span>{level}</span>
                <span>{nextLevel}</span>
              </div>
            </div>

            {/* Monthly stats */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4">{t("dashboard.thisMonth")}</h3>
              <div className="space-y-3">
                {[
                  { labelKey: "dashboard.totalWashes", value: "7", icon: Car, color: "text-brand-blue" },
                  { labelKey: "dashboard.totalSpent", value: "483 000", icon: CreditCard, color: "text-brand-purple" },
                  { labelKey: "dashboard.timeSaved", value: "~14 hrs", icon: Clock, color: "text-emerald-600" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.labelKey} className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 text-xs text-slate-400`}>
                        <Icon className="w-4 h-4" />{t(s.labelKey)}
                      </div>
                      <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
                    </div>
                  );
                })}
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
