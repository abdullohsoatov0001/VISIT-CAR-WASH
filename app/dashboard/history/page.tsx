"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Star, Car, MapPin, Clock, Package } from "lucide-react";
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
        .select("id, order_number, service_type, price, location_name, worker_name, user_rating, status, created_at, completed_at")
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

  const completed   = orders.filter(o => o.status === "completed");
  const totalSpent  = completed.reduce((s, o) => s + o.price, 0);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Всего заказов",  value: orders.length,                             color: "text-brand-blue" },
          { label: "Завершено",      value: completed.length,                          color: "text-emerald-600" },
          { label: "Потрачено",      value: `${formatPrice(Math.round(totalSpent/1000))}K`, color: "text-brand-purple" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по услуге, адресу, мойщику..."
          className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all shadow-sm" />
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 h-28 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <div className="font-semibold text-slate-600 mb-1">
            {search ? "Ничего не найдено" : "Заказов пока нет"}
          </div>
          <div className="text-sm text-slate-400">
            {search ? "Попробуйте другой запрос" : "Ваши заказы появятся здесь"}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => {
            const st = statusLabel[order.status] ?? statusLabel.pending;
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-brand-blue/20 transition-all shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                      <Car className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{order.service_type}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{order.order_number}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 text-sm">{formatPrice(order.price)} so'm</div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border mt-1 inline-block ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                  {order.location_name && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.location_name}</span>
                  )}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(order.created_at)}</span>
                </div>

                {(order.worker_name || order.user_rating) && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    {order.worker_name && (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-[9px] font-bold text-brand-blue">
                          {order.worker_name[0]}
                        </div>
                        <span className="text-xs text-slate-400">{order.worker_name}</span>
                      </div>
                    )}
                    {order.user_rating && (
                      <div className="flex items-center gap-0.5 ml-auto">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className={`w-3 h-3 ${j < order.user_rating! ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                    )}
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
