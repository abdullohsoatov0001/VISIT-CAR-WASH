"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Droplets, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { roleRedirect } from "@/lib/hooks/useUser";

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim())    { setError("Введите email"); return; }
    if (!password)        { setError("Введите пароль"); return; }

    setLoading(true);

    const { data, error: err } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    });

    if (err) {
      setLoading(false);
      if (err.message.includes("Invalid login credentials") || err.message.includes("invalid_credentials")) {
        setError("Неверный email или пароль");
      } else if (err.message.includes("Email not confirmed")) {
        setError("Email не подтверждён. Обратитесь к администратору.");
      } else {
        setError(err.message || "Ошибка входа");
      }
      return;
    }

    setSuccess(true);
    const role = data.user?.user_metadata?.role ?? "USER";
    setTimeout(() => {
      router.push(roleRedirect(role));
      router.refresh();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex">

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-gradient-to-br from-[#EEF4FF] to-[#E0ECFF]">
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 50%, rgba(14,165,233,0.1) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(139,92,246,0.08) 0%, transparent 50%)" }} />
        <div className="relative z-10 space-y-4 max-w-sm">
          <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Мойка завершена!</div>
                <div className="text-xs text-slate-400">Premium Wash · 5 минут назад</div>
              </div>
            </div>
            <div className="flex gap-2">
              {["До", "После"].map((l, i) => (
                <div key={l} className={`flex-1 h-16 rounded-xl flex items-center justify-center text-xs font-medium ${i === 0 ? "bg-slate-100 text-slate-400" : "bg-brand-blue/10 border border-brand-blue/20 text-brand-blue"}`}>{l}</div>
              ))}
            </div>
          </motion.div>

          <motion.div animate={{ y: [8, -8, 8] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg ml-8">
            <div className="text-xs text-slate-400 mb-2">Ваш мастер</div>
            <div className="text-slate-900 font-bold mb-3">🚗 Едет · 8 минут</div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full"
                initial={{ width: "0%" }} animate={{ width: "60%" }} transition={{ duration: 2, delay: 0.5 }} />
            </div>
          </motion.div>

          <motion.div animate={{ y: [-5, 10, -5] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="bg-white border border-brand-blue/20 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white font-bold text-sm">4.9★</div>
              <div>
                <div className="text-sm font-bold text-slate-900">Jamshid U.</div>
                <div className="text-xs text-slate-400">Назначенный специалист</div>
              </div>
              <div className="ml-auto text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">В сети</div>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-8 left-8 text-slate-400 text-sm">© 2025 Wash Go Technologies</div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-md">

          <Link href="/" className="inline-flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-brand-blue" />
            </div>
            <span className="text-lg font-bold text-slate-900">Wash<span className="text-brand-blue"> Go</span></span>
          </Link>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Добро пожаловать</h1>
            <p className="text-slate-400 mb-8">Войдите в свой аккаунт Wash Go</p>

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </motion.div>
            )}

            {/* Success */}
            {success && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-xl mb-4">
                <Check className="w-4 h-4 shrink-0" /> Входим…
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email" value={email} autoFocus
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Пароль</label>
                  <Link href="/forgot-password" className="text-xs text-brand-blue hover:underline font-medium">Забыли пароль?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPass ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ваш пароль"
                    className="w-full h-12 pl-10 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button type="submit" disabled={loading || success}
                whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(14,165,233,0.3)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-12 rounded-xl bg-brand-blue text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all mt-2 shadow-md">
                {loading
                  ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Входим…</>
                  : <>Войти <ArrowRight className="w-4 h-4" /></>
                }
              </motion.button>
            </form>

            <p className="text-center text-sm text-slate-400 mt-6">
              Нет аккаунта?{" "}
              <Link href="/register" className="text-brand-blue hover:underline font-medium">Зарегистрироваться</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
