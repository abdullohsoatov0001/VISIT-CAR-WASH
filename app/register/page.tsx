"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Droplets, User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { roleRedirect } from "@/lib/hooks/useUser";

export default function RegisterPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim())       { setError("Введите имя"); return; }
    if (!email.trim())      { setError("Введите email"); return; }
    if (password.length < 6) { setError("Пароль минимум 6 символов"); return; }

    setLoading(true);

    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { name: name.trim(), role: "USER" } },
    });

    if (err) {
      setLoading(false);
      if (err.message?.includes("already registered") || err.message?.includes("User already registered")) {
        setError("Этот email уже зарегистрирован");
      } else if (err.message?.toLowerCase().includes("sending confirmation") || err.message?.toLowerCase().includes("email")) {
        setError("Не удалось отправить письмо с кодом. Проверьте настройки SMTP в Supabase.");
      } else {
        setError(err.message || `Ошибка при регистрации (код ${err.status ?? "?"})`);
      }
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id:   data.user.id,
        name: name.trim(),
        role: "USER",
      });
    }

    if (data.session) {
      router.push(roleRedirect(data.user?.user_metadata?.role ?? "USER"));
      router.refresh();
      return;
    }

    router.push(`/verify?method=email&contact=${encodeURIComponent(email.trim().toLowerCase())}`);
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
          <h1 className="text-2xl font-black text-slate-900 mb-1">Регистрация</h1>
          <p className="text-slate-400 text-sm mb-6">Создайте бесплатный аккаунт</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" value={name} autoFocus
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPass ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль (мин. 6 символов)"
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
              {loading
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Создаём…</>
                : <>Создать аккаунт <ArrowRight className="w-4 h-4" /></>
              }
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-brand-blue hover:underline font-medium">Войти</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
