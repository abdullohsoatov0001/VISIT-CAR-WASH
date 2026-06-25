"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Droplets, Phone, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isValidUzPhone, toE164 } from "@/lib/phone";

export default function ForgotPasswordPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [phone, setPhone]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValidUzPhone(phone)) { setError("Введите номер телефона полностью"); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({ phone: toE164(phone) });
    setLoading(false);

    if (err) { setError(err.message || "Не удалось отправить SMS"); return; }
    router.push(`/verify?method=phone&contact=${encodeURIComponent(toE164(phone))}&mode=reset`);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-brand-blue" />
          </div>
          <span className="font-bold text-slate-900">Wash<span className="text-brand-blue"> Go</span></span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-black text-slate-900 mb-1">Забыли пароль?</h1>
          <p className="text-slate-400 text-sm mb-6">Пришлём код по SMS для сброса пароля</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">+998</span>
              <input
                type="tel" value={phone} autoFocus
                onChange={(e) => setPhone(e.target.value)}
                placeholder="90 123 45 67"
                className="w-full h-12 pl-[5.5rem] pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all"
              />
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="w-full h-12 rounded-xl bg-brand-blue text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-md mt-1">
              {loading ? "Отправляем…" : <>Отправить код <ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </form>

          <Link href="/login" className="flex items-center gap-1.5 justify-center text-sm text-slate-400 hover:text-slate-600 mt-5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Назад ко входу
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
