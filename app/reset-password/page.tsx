"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Droplets, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady]       = useState(false);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Пароль минимум 6 символов"); return; }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) { setError(err.message || "Не удалось обновить пароль"); return; }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 1500);
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
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-emerald-500" />
              </div>
              <h1 className="text-xl font-black text-slate-900 mb-2">Пароль обновлён</h1>
              <p className="text-sm text-slate-400">Перенаправляем на вход…</p>
            </div>
          ) : !ready ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-400">Открывайте эту страницу по ссылке из письма для сброса пароля.</p>
              <Link href="/forgot-password" className="text-brand-blue text-sm font-semibold hover:underline mt-3 inline-block">Запросить ссылку заново</Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-black text-slate-900 mb-1">Новый пароль</h1>
              <p className="text-slate-400 text-sm mb-6">Придумайте новый пароль для входа</p>

              {error && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPass ? "text" : "password"} value={password} autoFocus
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Новый пароль (мин. 6 символов)"
                    className="w-full h-12 pl-10 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="w-full h-12 rounded-xl bg-brand-blue text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-md mt-1">
                  {loading ? "Сохраняем…" : <>Сохранить пароль <ArrowRight className="w-4 h-4" /></>}
                </motion.button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
