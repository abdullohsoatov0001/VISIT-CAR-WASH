"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Star, Car, ArrowLeft, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  order_number: string;
  service_type: string;
  worker_name: string | null;
  user_rating: number | null;
  review_text: string | null;
  before_photos: string[] | null;
  after_photos: string[] | null;
  status: string;
};

export default function RateOrderPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("orders")
      .select("id, order_number, service_type, worker_name, user_rating, review_text, before_photos, after_photos, status")
      .eq("id", params.orderId)
      .maybeSingle()
      .then(({ data }) => {
        setOrder(data ?? null);
        setRating(data?.user_rating ?? 0);
        setReview(data?.review_text ?? "");
        setLoading(false);
      });
  }, [params.orderId]);

  const submit = async () => {
    if (!order || rating === 0 || submitting) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase
      .from("orders")
      .update({ user_rating: rating, review_text: review.trim() || null })
      .eq("id", order.id);
    setSubmitting(false);
    setDone(true);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl h-64 animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm">
          <Car className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <div className="font-semibold text-slate-600 mb-1">Заказ не найден</div>
          <button onClick={() => router.push("/dashboard/history")} className="text-sm text-brand-blue font-semibold mt-3">
            К истории заказов →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
      <button onClick={() => router.push("/dashboard/history")} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="text-xs font-semibold text-brand-blue uppercase tracking-wider mb-1">Заказ {order.order_number}</div>
        <div className="font-bold text-slate-900 text-lg">{order.service_type}</div>
        {order.worker_name && <div className="text-sm text-slate-400 mt-0.5">Мойщик: {order.worker_name}</div>}
      </div>

      {(order.before_photos?.length || order.after_photos?.length) ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-900 mb-3">Фото до / после</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">До</div>
              <div className="grid grid-cols-2 gap-1.5">
                {(order.before_photos ?? []).map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="До мойки" className="w-full aspect-square object-cover rounded-lg border border-slate-200" />
                ))}
                {(order.before_photos?.length ?? 0) === 0 && (
                  <div className="col-span-2 aspect-square rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-slate-300">Нет фото</div>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">После</div>
              <div className="grid grid-cols-2 gap-1.5">
                {(order.after_photos ?? []).map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="После мойки" className="w-full aspect-square object-cover rounded-lg border border-slate-200" />
                ))}
                {(order.after_photos?.length ?? 0) === 0 && (
                  <div className="col-span-2 aspect-square rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-slate-300">Нет фото</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        {done ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="font-bold text-slate-900 mb-1">Спасибо за отзыв!</div>
            <div className="text-sm text-slate-400">Ваша оценка помогает нам становиться лучше</div>
          </motion.div>
        ) : (
          <>
            <div className="text-sm font-bold text-slate-900 mb-3">Оцените мойку</div>
            <div className="flex items-center gap-1.5 mb-4">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < (hoverRating || rating);
                return (
                  <button key={i} onClick={() => setRating(i + 1)}
                    onMouseEnter={() => setHoverRating(i + 1)} onMouseLeave={() => setHoverRating(0)}
                    className="p-1">
                    <Star className={`w-8 h-8 transition-colors ${filled ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} />
                  </button>
                );
              })}
            </div>
            <textarea value={review} onChange={(e) => setReview(e.target.value)}
              placeholder="Расскажите, как всё прошло (необязательно)"
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all resize-none mb-4" />
            <button onClick={submit} disabled={rating === 0 || submitting}
              className="w-full h-12 rounded-xl bg-brand-blue text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-blue/90 transition-all disabled:opacity-50 shadow-sm">
              {submitting ? "Отправляем…" : "Отправить отзыв"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
