"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Droplets, Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { roleRedirect } from "@/lib/hooks/useUser";

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep]         = useState<Step>(1);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const steps = [{ num: 1, label: "Имя" }, { num: 2, label: "Контакты" }, { num: 3, label: "Пароль" }];

  const nextStep = () => {
    setError("");
    if (step === 1 && !name.trim()) { setError("Введите ваше имя"); return; }
    if (step === 2 && !email.trim()) { setError("Введите email адрес"); return; }
    setStep((s) => (s + 1) as Step);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Пароль минимум 6 символов"); return; }
    if (password !== confirm) { setError("Пароли не совпадают"); return; }

    setLoading(true);

    try {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name, role: "USER" },
        },
      });

      if (err) {
        setLoading(false);
        const msg = (err.message ?? "").trim();
        if (!msg || msg === "{}" || msg === "{}") {
          setError("Ошибка отправки письма подтверждения. Удалите SMTP настройки в Supabase → Project Settings → Authentication → SMTP.");
        } else if (msg.includes("already registered") || msg.includes("User already registered")) {
          setError("Этот email уже зарегистрирован. Войдите или используйте другой email.");
        } else if (msg.includes("invalid") || msg.includes("Invalid")) {
          setError("Неверный формат email");
        } else if (msg.includes("weak") || msg.includes("password")) {
          setError("Пароль слишком простой. Используйте буквы, цифры и символы.");
        } else {
          setError(msg);
        }
        return;
      }

      // Upsert profile
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          name,
          role: "USER",
          phone: phone.trim() || null,
        });
      }

      setLoading(false);

      // If session returned immediately → "Confirm email" is OFF → go to dashboard
      if (data.session) {
        router.push(roleRedirect(data.user?.user_metadata?.role ?? "USER"));
        router.refresh();
        return;
      }

      // Otherwise → email confirmation needed → go to verify
      router.push(`/verify?method=email&contact=${encodeURIComponent(email.trim())}`);
    } catch (e: unknown) {
      setLoading(false);
      const msg = e instanceof Error ? e.message : "Неизвестная ошибка";
      setError(msg || "Ошибка соединения. Проверьте интернет и попробуйте ещё раз.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center"><Droplets className="w-5 h-5 text-brand-blue" /></div>
          <span className="text-lg font-bold text-slate-900">VISIT<span className="text-brand-blue">.</span></span>
        </Link>

        <h1 className="text-3xl font-black text-slate-900 mb-1">Создайте аккаунт</h1>
        <p className="text-slate-400 mb-8">Бесплатно · Займёт минуту</p>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step > s.num ? "bg-emerald-500 text-white" : step === s.num ? "bg-brand-blue text-white" : "bg-slate-100 text-slate-400"}`}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-xs font-medium ${step === s.num ? "text-slate-900" : "text-slate-400"}`}>{s.label}</span>
              {i < steps.length - 1 && <div className={`h-px mx-1 transition-all duration-300 ${step > s.num ? "bg-emerald-300" : "bg-slate-200"}`} style={{ width: 24 }} />}
            </div>
          ))}
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Ваше имя</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && nextStep()} placeholder="Санжар" autoFocus className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all" />
                </div>
              </div>
              <motion.button onClick={nextStep} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="w-full h-12 rounded-xl bg-brand-blue text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md">
                Далее <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" autoFocus className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Телефон <span className="text-slate-300 normal-case font-normal">(необязательно)</span></label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998901234567" className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="h-12 px-5 rounded-xl bg-slate-100 text-slate-600 font-medium text-sm flex items-center hover:bg-slate-200 transition-all"><ArrowLeft className="w-4 h-4" /></button>
                <motion.button onClick={nextStep} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="flex-1 h-12 rounded-xl bg-brand-blue text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md">Далее <ArrowRight className="w-4 h-4" /></motion.button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.form key="step3" onSubmit={handleSubmit} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Придумайте пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Минимум 6 символов" autoFocus className="w-full h-12 pl-10 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                {password && (
                  <div className="mt-2 flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-all ${password.length >= i*3 ? i<=1?"bg-red-400":i<=2?"bg-orange-400":i<=3?"bg-yellow-400":"bg-emerald-400" : "bg-slate-200"}`} />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Повторите пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showPass ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Повторите пароль" className={`w-full h-12 pl-10 pr-4 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:bg-white transition-all ${confirm && password !== confirm ? "border-red-300" : "border-slate-200 focus:border-brand-blue/50"}`} />
                  {confirm && password === confirm && <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="h-12 px-5 rounded-xl bg-slate-100 text-slate-600 font-medium text-sm flex items-center hover:bg-slate-200 transition-all"><ArrowLeft className="w-4 h-4" /></button>
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(14,165,233,0.3)" }} whileTap={{ scale: 0.98 }} className="flex-1 h-12 rounded-xl bg-brand-blue text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-md">
                  {loading ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Создаём…</> : <>Создать аккаунт <Check className="w-4 h-4" /></>}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-slate-400 mt-6">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-brand-blue hover:underline font-medium">Войти</Link>
        </p>
      </div>
    </div>
  );
}
