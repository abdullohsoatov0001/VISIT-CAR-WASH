"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Check, Loader2, ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";

type PendingPhoto = { id: string; blob: Blob; previewUrl: string };

const copy = {
  before: {
    title: "Фото до мойки",
    subtitle: "Сфотографируйте автомобиль перед началом работы",
    confirm: "Подтвердить и начать",
  },
  after: {
    title: "Фото после мойки",
    subtitle: "Сфотографируйте результат работы",
    confirm: "Завершить заказ",
  },
};

export default function WashPhotoModal({
  orderId,
  mode,
  onConfirm,
  onClose,
}: {
  orderId: string;
  mode: "before" | "after";
  onConfirm: (urls: string[]) => Promise<void> | void;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const c = copy[mode];

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError("");

    const compressed = await Promise.all(
      files.map(async (file) => {
        try {
          const blob = await compressImage(file);
          return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, blob, previewUrl: URL.createObjectURL(blob) };
        } catch {
          return null;
        }
      })
    );

    setPhotos((prev) => [...prev, ...compressed.filter((p): p is PendingPhoto => p !== null)]);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleConfirm = async () => {
    if (photos.length === 0 || busy) return;
    setBusy(true);
    setError("");
    const supabase = createClient();

    try {
      const urls = await Promise.all(
        photos.map(async (p, i) => {
          const path = `${orderId}/${mode}/${Date.now()}-${i}.jpg`;
          const { error: uploadError } = await supabase.storage.from("wash-photos").upload(path, p.blob, {
            contentType: "image/jpeg",
          });
          if (uploadError) throw uploadError;
          return supabase.storage.from("wash-photos").getPublicUrl(path).data.publicUrl;
        })
      );
      await onConfirm(urls);
    } catch {
      setError("Не удалось загрузить фото. Проверьте интернет и попробуйте снова.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 shadow-sm flex-shrink-0">
        <div>
          <div className="font-bold text-slate-900 text-sm">{c.title}</div>
          <div className="text-xs text-slate-400">{c.subtitle}</div>
        </div>
        <button onClick={onClose} disabled={busy}
          className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all flex-shrink-0 disabled:opacity-50">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={handleFiles}
        />

        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <AnimatePresence>
            {photos.map((p) => (
              <motion.div key={p.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removePhoto(p.id)} disabled={busy}
                  className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all disabled:opacity-50">
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <button onClick={() => inputRef.current?.click()} disabled={busy}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-brand-blue hover:text-brand-blue transition-all disabled:opacity-50">
            <Camera className="w-6 h-6" />
            <span className="text-[10px] font-semibold">Снять фото</span>
          </button>
        </div>

        {photos.length === 0 && (
          <div className="flex flex-col items-center text-center py-10 text-slate-400">
            <ImagePlus className="w-10 h-10 mb-3 text-slate-200" />
            <div className="text-sm font-semibold text-slate-500">Нужно минимум 1 фото</div>
            <div className="text-xs mt-1">Нажмите «Снять фото» — откроется камера</div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-200 flex-shrink-0">
        <button onClick={handleConfirm} disabled={photos.length === 0 || busy}
          className="w-full h-12 rounded-xl bg-brand-blue text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-blue/90 transition-all disabled:opacity-50 shadow-sm">
          {busy
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Загружаем фото…</>
            : <><Check className="w-4 h-4" /> {c.confirm}</>
          }
        </button>
      </div>
    </div>
  );
}
