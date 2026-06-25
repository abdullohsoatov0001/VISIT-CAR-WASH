"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Star, Car, MapPin, Clock, Package, Camera, Wallet, CheckCircle2, ListOrdered } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  order_number: string;
  service_type: string;
  price: number;
  location_name: string;
  worker_name: string | null;
  user_rating: number | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  before_photos: string[] | null;
  after_photos: string[] | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatPrice(n: number) {
  return n.toLocaleString("ru-RU");
}

const statusLabel: Record<string, { label: string; cls: string }> = {
  completed: { label: "Завершён",  cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  cancelled: { label: "Отменён",  cls: "bg-red-50 text-red-500 border-red-200" },
  pending:   { label: "Ожидание", cls: "bg-yellow-50 text-yellow-600 border-yellow-200" },
  accepted:  { label: "Принят",   cls: "bg-brand-blue/10 text-brand-blue border-brand-blue/20" },
};

export default function DashboardHistoryPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("orders")
        .select("id, order_number, service_type, price, location_name, worker_name, user_rating, status, created_at, completed_at, before_photos, after_photos")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setOrders(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = orders.filter(o =>
    !search ||
    o.service_type.toLowerCase().includes(search.toLowerCase()) ||
    (o.location_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (o.worker_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const rateOrder = async (orderId: string, rating: number) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, user_rating: rating } : o));
    const supabase = createClient();
    await supabase.from("orders").update({ user_rating: rating }).eq("id", orderId);
  };

  const completed   = orders.filter(o => o.status === "completed");
  const totalSpent  = completed.reduce((s, o) => s + o.price, 0);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">История заказов</h1>
        <p className="text-sm text-slate-400 mt-1">Все ваши мойки в одном месте</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Всего заказов", value: orders.length,                                  icon: ListOrdered,  color: "text-brand-blue",   bg: "bg-brand-blue/10 border-brand-blue/20" },
          { label: "Завершено",     value: completed.length,                                icon: CheckCircle2, color: "text-emerald-600",  bg: "bg-emerald-50 border-emerald-200" },
          { label: "Потрачено",     value: `${formatPrice(Math.round(totalSpent / 1000))}K`, icon: Wallet,       color: "text-brand-purple", bg: "bg-brand-purple/10 border-brand-purple/20" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center mb-3 ${s.bg} ${s.color}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className={`text-2xl sm:text-3xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">{s.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по услуге, адресу, мойщику..."
          className="w-full h-12 sm:h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-300 text-sm sm:text-base focus:outline-none focus:border-brand-blue/50 transition-all shadow-sm" />
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 h-36 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
          <Package className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <div className="font-bold text-slate-700 text-lg mb-1.5">
            {search ? "Ничего не найдено" : "Заказов пока нет"}
          </div>
          <div className="text-sm text-slate-400">
            {search ? "Попробуйте другой запрос" : "Ваши заказы появятся здесь"}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order, i) => {
            const st = statusLabel[order.status] ?? statusLabel.pending;
            const hasPhotos = (order.before_photos?.length ?? 0) > 0 || (order.after_photos?.length ?? 0) > 0;
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 hover:border-brand-blue/30 hover:shadow-md transition-all shadow-sm">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                      <Car className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-base sm:text-lg leading-tight">{order.service_type}</div>
                      <div className="text-xs sm:text-sm text-slate-400 mt-0.5">{order.order_number}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-slate-900 text-base sm:text-lg">{formatPrice(order.price)} <span className="text-xs sm:text-sm font-semibold text-slate-400">so&apos;m</span></div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border mt-1.5 inline-block ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap mb-1">
                  {order.location_name && (
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-300" />{order.location_name}</span>
                  )}
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-300" />Заказан {formatDate(order.created_at)}</span>
                  {order.completed_at && (
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-slate-300" />Завершён {formatDate(order.completed_at)}</span>
                  )}
                </div>

                {hasPhotos && (
                  <div className="flex items-center gap-2 mt-3">
                    {(order.before_photos ?? []).slice(0, 1).map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={url} src={url} alt="До" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                    ))}
                    {(order.after_photos ?? []).slice(0, 1).map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={url} src={url} alt="После" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                    ))}
                    <Link href={`/dashboard/rate/${order.id}`}
                      className="flex items-center gap-1.5 text-sm font-bold text-brand-blue hover:text-brand-blue/80 transition-colors ml-1">
                      <Camera className="w-4 h-4" /> Все фото до/после →
                    </Link>
                  </div>
                )}

                {(order.worker_name || order.user_rating || order.status === "completed") && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    {order.worker_name && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-xs font-bold text-brand-blue">
                          {order.worker_name[0]}
                        </div>
                        <span className="text-sm font-medium text-slate-500">{order.worker_name}</span>
                      </div>
                    )}
                    {order.user_rating ? (
                      <div className="flex items-center gap-1 ml-auto">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className={`w-4 h-4 ${j < order.user_rating! ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                    ) : order.status === "completed" ? (
                      <div className="flex items-center gap-2.5 ml-auto">
                        <span className="text-sm font-medium text-slate-400">Оценить:</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <button key={j} onClick={() => rateOrder(order.id, j + 1)} className="p-0.5">
                              <Star className="w-5 h-5 text-slate-200 hover:text-yellow-400 hover:fill-yellow-400 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
