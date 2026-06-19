"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Droplets, Mail, ArrowRight, ArrowLeft, AlertCircle, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Введите email"); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (err) { setError(err.message || "Не удалось отправить письмо"); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-brand-blue" />
          </div>
          <span className="font-bold text-slate-900">VISIT<span className="text-brand-blue">.</span></span>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {sent ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-emerald-500" />
              </div>
              <h1 className="text-xl font-black text-slate-900 mb-2">Письмо отправлено</h1>
              <p className="text-sm text-slate-400 mb-6">Проверьте {email} — там ссылка для сброса пароля.</p>
              <Link href="/login" className="text-brand-blue text-sm font-semibold hover:underline">Назад ко входу</Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-black text-slate-900 mb-1">Забыли пароль?</h1>
              <p className="text-slate-400 text-sm mb-6">Пришлём ссылку для сброса на email</p>

              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email" value={email} autoFocus
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all"
                  />
                </div>

                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="w-full h-12 rounded-xl bg-brand-blue text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-md mt-1">
                  {loading ? "Отправляем…" : <>Отправить ссылку <ArrowRight className="w-4 h-4" /></>}
                </motion.button>
              </form>

              <Link href="/login" className="flex items-center gap-1.5 justify-center text-sm text-slate-400 hover:text-slate-600 mt-5 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Назад ко входу
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
