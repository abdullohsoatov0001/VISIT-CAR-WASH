"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Eye, Bell, MapPin, ChevronDown, X, Star } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  order_number: string;
  user_id: string;
  service_type: string;
  worker_name: string | null;
  location_name: string;
  price: number;
  status: string;
  created_at: string;
  notes: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  user_rating: number | null;
  worker_rating: number | null;
  client_name?: string;
  client_phone?: string | null;
};

const statusBadge: Record<string, string> = {
  pending:     "bg-orange-50 text-orange-600 border-orange-200",
  accepted:    "bg-brand-blue/10 text-brand-blue border-brand-blue/20",
  en_route:    "bg-brand-purple/10 text-brand-purple border-brand-purple/20",
  in_progress: "bg-brand-purple/10 text-brand-purple border-brand-purple/20",
  completed:   "bg-emerald-50 text-emerald-600 border-emerald-200",
  cancelled:   "bg-red-50 text-red-500 border-red-200",
};

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} мин`;
  if (mins < 1440) return `${Math.floor(mins / 60)} ч`;
  return `${Math.floor(mins / 1440)} дн`;
}

export default function AdminOrdersPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: orderRows } = await supabase
        .from("orders")
        .select("id, order_number, user_id, service_type, worker_name, location_name, price, status, created_at, notes, scheduled_at, completed_at, user_rating, worker_rating")
        .order("created_at", { ascending: false })
        .limit(100);

      const rows = orderRows ?? [];
      const userIds = Array.from(new Set(rows.map((o) => o.user_id)));
      let names: Record<string, string> = {};
      let phones: Record<string, string | null> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, name, phone").in("id", userIds);
        names = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.name]));
        phones = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.phone]));
      }

      setOrders(rows.map((o) => ({ ...o, client_name: names[o.user_id] ?? "—", client_phone: phones[o.user_id] ?? null })));
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.client_name?.toLowerCase().includes(search.toLowerCase()) || o.order_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-lg font-bold text-slate-900">{t("admin.orders")}</div>
          <div className="text-xs text-slate-400">{filtered.length} {t("admin.orders").toLowerCase()}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("admin.searchOrders")}
              className="w-52 h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all" />
          </div>
          <button className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <Bell className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold">AD</div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          {["all", "pending", "accepted", "en_route", "in_progress", "completed", "cancelled"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${statusFilter === s ? "bg-brand-blue text-white border-brand-blue" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
              {s === "all" ? t("common.all") : s}
            </button>
          ))}
          <button className="ml-auto flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 hover:text-slate-900 transition-all">
            <Filter className="w-3 h-3" /> {t("common.filter")} <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[t("admin.orderId"), t("admin.clientCol"), t("admin.workerCol"), t("admin.serviceCol"), t("admin.locationCol"), t("admin.amountCol"), t("admin.statusCol"), t("admin.timeCol"), ""].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-12 text-slate-400 text-sm">Загрузка…</td></tr>
                ) : filtered.map((order, i) => (
                  <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-slate-50 transition-colors group">
                    <td className="px-5 py-3.5 text-sm font-mono text-brand-blue">{order.order_number}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-900 font-medium">{order.client_name}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{order.worker_name ?? "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{order.service_type}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" />{order.location_name || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-slate-900">{order.price.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${statusBadge[order.status] ?? statusBadge.pending}`}>{order.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{timeAgo(order.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setSelected(order)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">{t("history.noOrders")}</div>
          )}
        </div>
      </div>

      {/* Order details modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs font-semibold text-brand-blue uppercase tracking-wider">Заказ</div>
                  <h3 className="font-bold text-slate-900 text-lg font-mono">{selected.order_number}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Статус</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${statusBadge[selected.status] ?? statusBadge.pending}`}>{selected.status}</span>
                </div>
                <div className="flex justify-between"><span className="text-slate-400">Клиент</span><span className="font-medium text-slate-900">{selected.client_name}</span></div>
                {selected.client_phone && (
                  <div className="flex justify-between"><span className="text-slate-400">Телефон</span><span className="font-medium text-slate-900">{selected.client_phone}</span></div>
                )}
                <div className="flex justify-between"><span className="text-slate-400">Мойщик</span><span className="font-medium text-slate-900">{selected.worker_name ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Услуга</span><span className="font-medium text-slate-900">{selected.service_type}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Адрес</span><span className="font-medium text-slate-900 text-right">{selected.location_name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Сумма</span><span className="font-bold text-slate-900">{selected.price.toLocaleString()} so'm</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Создан</span><span className="font-medium text-slate-900">{new Date(selected.created_at).toLocaleString("ru-RU")}</span></div>
                {selected.completed_at && (
                  <div className="flex justify-between"><span className="text-slate-400">Завершён</span><span className="font-medium text-slate-900">{new Date(selected.completed_at).toLocaleString("ru-RU")}</span></div>
                )}
                {selected.notes && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-slate-400 mb-1">Заметки</div>
                    <div className="text-slate-700">{selected.notes}</div>
                  </div>
                )}
                {selected.user_rating && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-slate-400">Оценка клиента</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`w-3.5 h-3.5 ${j < selected.user_rating! ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
