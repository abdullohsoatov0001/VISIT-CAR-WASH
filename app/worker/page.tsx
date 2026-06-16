"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  MapPin, Clock, Star, Bell, Car, Navigation, Phone, Check, X,
  Award, Wallet, Power
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "@/lib/context/UserContext";
import { getInitials } from "@/lib/hooks/useUser";

const incomingOrders = [
  { id: "W-1044", client: "Aziz T.",   service: "Premium Wash",  location: "Yunusobod, 12-house",       distance: "2.4 km", price: 99000,  eta: "8 min",  urgent: false, expires: 60 },
  { id: "W-1045", client: "Dilnoza Y.",service: "Express Wash",  location: "Amir Temur Ave, 107B",      distance: "4.1 km", price: 49000,  eta: "15 min", urgent: true,  expires: 30 },
];

const todayJobs = [
  { time: "08:30", client: "Rustam K.",  service: "Premium",     price: 99000,  rating: 5 },
  { time: "10:00", client: "Nodira R.",  service: "Elite Detail",price: 199000, rating: 5 },
  { time: "12:30", client: "Bobur M.",   service: "Express",     price: 49000,  rating: 4 },
  { time: "14:00", client: "Lobar S.",   service: "Eco Wash",    price: 59000,  rating: 5 },
  { time: "16:00", client: "Jamshid A.", service: "Premium",     price: 99000,  rating: 5 },
];

export default function WorkerDashboard() {
  const { t } = useLanguage();
  const { profile } = useUserContext();
  const supabase = createClient();

  const [online, setOnline]           = useState(true);
  const [activeOrder, setActiveOrder] = useState<string | null>(null);
  const [orders, setOrders]           = useState(incomingOrders);
  const [togglingOnline, setTogglingOnline] = useState(false);

  const todayStats = {
    completed: todayJobs.length,
    earnings:  todayJobs.reduce((s, j) => s + j.price, 0),
    hours:     6.5,
    rating:    4.9,
    streak:    12,
  };

  const firstName = profile?.name?.split(" ")[0] ?? "Воркер";
  const initials  = profile ? getInitials(profile.name) : "…";

  // Toggle online status → save to DB
  const handleToggleOnline = async () => {
    if (!profile?.id || togglingOnline) return;
    setTogglingOnline(true);
    const newStatus = !online;
    setOnline(newStatus);
    await supabase
      .from("profiles")
      .update({ is_active: newStatus })
      .eq("id", profile.id);
    setTogglingOnline(false);
  };

  // Load online status from profile
  useEffect(() => {
    if (profile) setOnline(profile.is_active ?? true);
  }, [profile]);

  const acceptOrder = (id: string) => {
    setActiveOrder(id);
    setOrders(o => o.filter(x => x.id !== id));
  };

  const rejectOrder = (id: string) => setOrders(o => o.filter(x => x.id !== id));

  const completeOrder = async () => {
    setActiveOrder(null);
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {initials}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Привет, {firstName}! 👋</div>
              <div className="flex items-center gap-1.5 text-xs">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-500 font-semibold">4.9</span>
                <span className="text-slate-400">· {todayStats.streak} дней подряд 🔥</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
              <Bell className="w-4 h-4" />
              {orders.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-blue rounded-full" />}
            </button>
            <motion.button
              onClick={handleToggleOnline}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={togglingOnline}
              className={`flex items-center gap-2 h-9 px-4 rounded-xl border font-semibold text-sm transition-all disabled:opacity-60 ${
                online
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "bg-slate-100 border-slate-200 text-slate-400"
              }`}>
              <motion.div
                animate={{ scale: online ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 1.5, repeat: online ? Infinity : 0 }}
                className={`w-2 h-2 rounded-full ${online ? "bg-emerald-500" : "bg-slate-400"}`}
              />
              {online ? "В сети" : "Не в сети"}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Today stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Заработок", value: `${(todayStats.earnings / 1000).toFixed(0)}K`, icon: Wallet, color: "text-brand-blue",   bg: "bg-brand-blue/10 border-brand-blue/20",     sub: "so'm" },
            { label: "Заказов",   value: todayStats.completed,                           icon: Car,    color: "text-brand-purple", bg: "bg-brand-purple/10 border-brand-purple/20", sub: "сегодня" },
            { label: "Часов",     value: todayStats.hours,                               icon: Clock,  color: "text-cyan-600",     bg: "bg-cyan-50 border-cyan-200",                sub: "часов" },
            { label: "Рейтинг",   value: todayStats.rating,                              icon: Star,   color: "text-yellow-500",   bg: "bg-yellow-50 border-yellow-200",            sub: "★" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center mb-2 ${s.bg} ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {s.value} <span className="text-xs font-normal text-slate-400">{s.sub}</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Active Order */}
        <AnimatePresence>
          {activeOrder && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Активный заказ</span>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-lg font-semibold">{activeOrder}</span>
              </div>
              <div className="text-slate-900 font-bold mb-1">Едете к клиенту</div>
              <div className="text-sm text-slate-500 mb-4">Premium Wash · Yunusobod, 12-house</div>
              <div className="flex gap-2">
                <Link href="/dashboard/tracking" className="flex-1">
                  <button className="w-full h-10 rounded-xl bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm">
                    <Navigation className="w-4 h-4" /> Навигация
                  </button>
                </Link>
                <button className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all">
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={completeOrder}
                  className="h-10 px-4 rounded-xl bg-brand-blue text-white text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-brand-blue/90 transition-all">
                  <Check className="w-4 h-4" /> Готово
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Offline state */}
        {!online && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <Power className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-600 font-semibold mb-1">Вы не в сети</div>
            <div className="text-sm text-slate-400 mb-4">Включите режим "В сети" чтобы получать заказы</div>
            <button onClick={handleToggleOnline}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all shadow-sm">
              Перейти в сеть
            </button>
          </motion.div>
        )}

        {/* Incoming orders */}
        {online && orders.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
              <h2 className="font-bold text-slate-900 text-sm">Входящие заказы</h2>
              <span className="text-xs bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full font-semibold border border-brand-blue/20">
                {orders.length}
              </span>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {orders.map((order) => (
                  <motion.div key={order.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    className={`border rounded-2xl p-5 shadow-sm ${order.urgent ? "bg-orange-50 border-orange-200" : "bg-white border-slate-200"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-900">{order.service}</span>
                          {order.urgent && (
                            <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">СРОЧНО</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">Клиент: {order.client} · {order.id}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-slate-900">{(order.price / 1000).toFixed(0)}K</div>
                        <div className="text-xs text-slate-400">so'm</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.location}</span>
                      <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />{order.distance}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{order.eta}</span>
                    </div>
                    {/* Timer bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Окно принятия</span>
                        <span className={order.urgent ? "text-orange-500 font-semibold" : "text-slate-400"}>{order.expires}с</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${order.urgent ? "bg-orange-400" : "bg-brand-blue"}`}
                          initial={{ width: "100%" }}
                          animate={{ width: "0%" }}
                          transition={{ duration: order.expires, ease: "linear" }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => rejectOrder(order.id)}
                        className="flex-1 h-10 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-red-100 transition-all">
                        <X className="w-4 h-4" /> Отклонить
                      </button>
                      <button onClick={() => acceptOrder(order.id)}
                        className="flex-1 h-10 rounded-xl bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-600 transition-all shadow-sm">
                        <Check className="w-4 h-4" /> Принять
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {online && orders.length === 0 && !activeOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <Car className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <div className="text-slate-600 font-semibold mb-1">Ожидаем новые заказы</div>
            <div className="text-sm text-slate-400">Вы в сети — новые заказы появятся здесь</div>
          </motion.div>
        )}

        {/* Today's jobs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900 text-sm">Выполненные сегодня</h2>
            <span className="text-xs text-slate-400">{todayJobs.length} заказов</span>
          </div>
          <div className="space-y-2">
            {todayJobs.map((job, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <div className="text-xs text-slate-400 w-12 flex-shrink-0 font-mono">{job.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">{job.client}</div>
                  <div className="text-xs text-slate-400">{job.service}</div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: job.rating }).map((_, j) => (
                    <Star key={j} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <div className="text-sm font-bold text-slate-900 w-14 text-right">{(job.price / 1000).toFixed(0)}K</div>
                <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-emerald-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Weekly earnings teaser */}
        <div className="bg-gradient-to-br from-brand-blue/8 to-brand-purple/5 border border-brand-blue/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-semibold text-brand-blue uppercase tracking-wider mb-1">Неделя</div>
              <div className="text-2xl font-black text-slate-900">1 820 000 <span className="text-sm font-normal text-slate-400">so'm</span></div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-brand-blue" />
            </div>
          </div>
          <Link href="/worker/earnings">
            <button className="w-full h-9 rounded-xl bg-brand-blue text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-brand-blue/90 transition-all">
              Подробная статистика →
            </button>
          </Link>
        </div>

      </div>
    </>
  );
}
