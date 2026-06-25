"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Check, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "@/lib/context/UserContext";

type CompletedOrder = {
  id: string;
  order_number: string;
  service_type: string;
  before_photos: string[] | null;
  after_photos: string[] | null;
};

export default function RatingPopup() {
  const { profile } = useUserContext();
  const router = useRouter();
  const pathname = usePathname();

  const [order, setOrder] = useState<CompletedOrder | null>(null);
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();

    supabase
      .from("orders")
      .select("id, order_number, service_type, before_photos, after_photos")
      .eq("user_id", profile.id)
      .eq("status", "completed")
      .is("user_rating", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setOrder(data);
          setTimeout(() => setShow(true), 800);
        }
      });

    const channel = supabase
      .channel(`rating-popup-${profile.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${profile.id}`,
      }, (payload) => {
        const updated = payload.new as any;
        if (updated.status === "completed" && updated.user_rating == null) {
          setOrder({
            id: updated.id,
            order_number: updated.order_number,
            service_type: updated.service_type,
            before_photos: updated.before_photos,
            after_photos: updated.after_photos,
          });
          setRating(0);
          setDone(false);
          setShow(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  if (!order || pathname.startsWith("/dashboard/rate") || dismissedId === order.id) return null;

  const close = () => {
    setShow(false);
    setDismissedId(order.id);
  };

  const submit = async () => {
    if (!order || rating === 0 || submitting) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from("orders").update({ user_rating: rating }).eq("id", order.id);
    setSubmitting(false);
    setDone(true);
    setTimeout(() => setShow(false), 1800);
  };

  const hasPhotos = (order.before_photos?.length ?? 0) > 0 || (order.after_photos?.length ?? 0) > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-80 z-[100] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5"
        >
          <button onClick={close} className="absolute top-3 right-3 text-slate-300 hover:text-slate-500 transition-colors">
            <X className="w-4 h-4" />
          </button>

          {done ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-2">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="font-bold text-slate-900 text-sm">Спасибо за оценку!</div>
            </div>
          ) : (
            <>
              <div className="text-xs font-semibold text-brand-blue uppercase tracking-wider mb-1">Мойка завершена</div>
              <div className="font-bold text-slate-900 text-sm mb-3">{order.service_type} · {order.order_number}</div>

              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = i < (hoverRating || rating);
                  return (
                    <button key={i} onClick={() => setRating(i + 1)}
                      onMouseEnter={() => setHoverRating(i + 1)} onMouseLeave={() => setHoverRating(0)}
                      className="p-0.5">
                      <Star className={`w-7 h-7 transition-colors ${filled ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`} />
                    </button>
                  );
                })}
              </div>

              <button onClick={submit} disabled={rating === 0 || submitting}
                className="w-full h-10 rounded-xl bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue/90 transition-all disabled:opacity-50 shadow-sm mb-2">
                {submitting ? "Отправляем…" : "Оценить"}
              </button>

              {hasPhotos && (
                <button onClick={() => router.push(`/dashboard/rate/${order.id}`)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-brand-blue transition-colors py-1">
                  <ImageIcon className="w-3.5 h-3.5" /> Сравнить фото до/после
                </button>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
