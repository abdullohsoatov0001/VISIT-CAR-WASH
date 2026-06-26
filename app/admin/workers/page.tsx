"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Star, MapPin, X, User, Mail, Lock, Phone, Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isValidUzPhone } from "@/lib/phone";

type Worker = {
  id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
};

type Review = {
  order_number: string;
  rating: number;
  review_text: string | null;
  client_name: string;
  completed_at: string;
};

const statusColor: Record<string, string> = {
  true:  "bg-emerald-50 text-emerald-600 border-emerald-200",
  false: "bg-slate-50 text-slate-400 border-slate-200",
};

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminWorkersPage() {
  const [workers, setWorkers]     = useState<Worker[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [ratings, setRatings]     = useState<Record<string, { avg: number; count: number }>>({});
  const [reviewsByWorker, setReviewsByWorker] = useState<Record<string, Review[]>>({});
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Form state
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  async function fetchWorkers() {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, name, phone, is_active, created_at")
      .eq("role", "WORKER")
      .order("created_at", { ascending: false })
      .limit(500);
    setWorkers(data ?? []);
    setLoading(false);
  }

  async function fetchReviews() {
    const supabase = createClient();
    const { data: orderRows } = await supabase
      .from("orders")
      .select("order_number, worker_id, user_id, user_rating, review_text, completed_at")
      .eq("status", "completed")
      .not("user_rating", "is", null)
      .not("worker_id", "is", null);

    const rows = orderRows ?? [];
    const userIds = Array.from(new Set(rows.map((r: any) => r.user_id)));
    let names: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", userIds);
      names = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.name]));
    }

    const grouped: Record<string, Review[]> = {};
    const sums: Record<string, { total: number; count: number }> = {};
    for (const r of rows as any[]) {
      if (!grouped[r.worker_id]) grouped[r.worker_id] = [];
      grouped[r.worker_id].push({
        order_number: r.order_number,
        rating: r.user_rating,
        review_text: r.review_text,
        client_name: names[r.user_id] ?? "—",
        completed_at: r.completed_at,
      });
      sums[r.worker_id] = sums[r.worker_id] ?? { total: 0, count: 0 };
      sums[r.worker_id].total += r.user_rating;
      sums[r.worker_id].count += 1;
    }

    setReviewsByWorker(grouped);
    setRatings(Object.fromEntries(Object.entries(sums).map(([id, s]) => [id, { avg: s.total / s.count, count: s.count }])));
  }

  useEffect(() => { fetchWorkers(); fetchReviews(); }, []);

  const filtered = workers.filter(w =>
    !search || w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.phone ?? "").includes(search)
  );

  const onlineCount  = workers.filter(w => w.is_active).length;
  const offlineCount = workers.filter(w => !w.is_active).length;

  function resetForm() {
    setName(""); setEmail(""); setPassword(""); setPhone("");
    setFormError(""); setFormSuccess(false); setShowPass(false);
  }

  function openModal() { resetForm(); setShowModal(true); }
  function closeModal() { setShowModal(false); resetForm(); }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!name.trim())          { setFormError("Введите имя"); return; }
    if (!phone.trim())         { setFormError("Введите телефон — мойщик входит по нему"); return; }
    if (!isValidUzPhone(phone)) { setFormError("Введите номер в формате +998 9X XXX XX XX"); return; }
    if (password.length < 6)   { setFormError("Пароль минимум 6 символов"); return; }

    setSaving(true);
    const res = await fetch("/api/admin/create-worker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, phone: phone.trim() }),
    });

    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setFormError(json.error ?? "Ошибка создания аккаунта");
      return;
    }

    setFormSuccess(true);
    await fetchWorkers();
    setTimeout(() => closeModal(), 1500);
  }

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-lg font-bold text-slate-900">Мойщики</div>
          <div className="text-xs text-slate-400">{onlineCount} онлайн · {workers.length} всего</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск..."
              className="w-52 h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all" />
          </div>
          <motion.button onClick={openModal}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-brand-blue text-white text-sm font-semibold shadow-sm hover:bg-brand-blue/90 transition-all">
            <Plus className="w-4 h-4" /> Добавить мойщика
          </motion.button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Всего мойщиков", value: workers.length, icon: "👥" },
            { label: "Онлайн",         value: onlineCount,    icon: "🟢" },
            { label: "Офлайн",         value: offlineCount,   icon: "🔴" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-black text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Workers grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 h-36 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <div className="text-4xl mb-3">👷</div>
            <div className="font-bold text-slate-900 mb-1">
              {search ? "Не найдено" : "Мойщиков нет"}
            </div>
            <div className="text-sm text-slate-400 mb-5">
              {search ? "Попробуйте другой запрос" : "Добавьте первого мойщика"}
            </div>
            {!search && (
              <motion.button onClick={openModal} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="px-5 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold shadow-sm">
                Добавить мойщика
              </motion.button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((w, i) => {
              const rating = ratings[w.id];
              const reviewCount = reviewsByWorker[w.id]?.length ?? 0;
              return (
              <motion.div key={w.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                onClick={() => reviewCount > 0 && setSelectedWorker(w)}
                className={`bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-blue/20 hover:shadow-md transition-all shadow-sm ${reviewCount > 0 ? "cursor-pointer" : ""}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-sm font-bold">
                      {getInitials(w.name)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{w.name}</div>
                      <div className="text-xs text-slate-400">{w.phone ?? "—"}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${statusColor[String(w.is_active)]}`}>
                    {w.is_active ? "Онлайн" : "Офлайн"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3 h-3" /> Добавлен {formatDate(w.created_at)}
                  </div>
                  {rating && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-yellow-600">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> {rating.avg.toFixed(1)} ({rating.count})
                    </div>
                  )}
                </div>
              </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Новый мойщик</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Создать аккаунт для мойщика</p>
                </div>
                <button onClick={closeModal} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />{formError}
                </motion.div>
              )}

              {formSuccess && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-xl mb-4">
                  <Check className="w-4 h-4 shrink-0" /> Аккаунт создан!
                </motion.div>
              )}

              <form onSubmit={handleCreate} className="space-y-3">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Имя *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus
                      placeholder="Имя мойщика"
                      className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Телефон * <span className="text-slate-300 normal-case font-normal">(для входа)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+998901234567"
                      className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email <span className="text-slate-300 normal-case font-normal">(необязательно)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="worker@example.com"
                      className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Пароль *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      className="w-full h-11 pl-10 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal}
                    className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-all">
                    Отмена
                  </button>
                  <motion.button type="submit" disabled={saving || formSuccess}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    className="flex-1 h-11 rounded-xl bg-brand-blue text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm">
                    {saving
                      ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Создаём…</>
                      : <><Plus className="w-4 h-4" /> Создать аккаунт</>
                    }
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Worker reviews modal */}
      <AnimatePresence>
        {selectedWorker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedWorker(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{selectedWorker.name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {ratings[selectedWorker.id] ? `${ratings[selectedWorker.id].avg.toFixed(1)} ★ · ${ratings[selectedWorker.id].count} отзывов` : "Отзывов нет"}
                  </p>
                </div>
                <button onClick={() => setSelectedWorker(null)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {(reviewsByWorker[selectedWorker.id] ?? []).map((r, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-slate-900">{r.client_name}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className={`w-3 h-3 ${j < r.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                    </div>
                    {r.review_text && <p className="text-sm text-slate-600 italic mb-1">"{r.review_text}"</p>}
                    <div className="text-[10px] text-slate-400">{r.order_number} · {formatDate(r.completed_at)}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
