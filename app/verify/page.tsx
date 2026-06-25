"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Mail, Smartphone, CheckCircle, RefreshCw, ArrowLeft, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { roleRedirect } from "@/lib/hooks/useUser";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyForm />
    </Suspense>
  );
}

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const method  = params.get("method") as "email" | "phone" | null;
  const contact = params.get("contact") ?? "";

  const [digits, setDigits]       = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);
  const [cooldown, setCooldown]   = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const focusInput = (i: number) => inputRefs.current[i]?.focus();

  const handleChange = (i: number, val: string) => {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    setError("");
    if (char && i < OTP_LENGTH - 1) focusInput(i + 1);
    if (next.every((d) => d !== "")) handleVerify(next.join(""));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        focusInput(i - 1);
      }
    }
    if (e.key === "ArrowLeft" && i > 0) focusInput(i - 1);
    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) focusInput(i + 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
    if (pasted.length === OTP_LENGTH) handleVerify(pasted);
  };

  const handleVerify = useCallback(async (code: string) => {
    if (!method || !contact || code.length < OTP_LENGTH) return;
    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.verifyOtp(
      method === "email"
        ? { email: contact, token: code, type: "signup" }
        : { phone: contact,  token: code, type: "sms"    }
    );

    if (err) {
      // Try alternate type for login flow
      if (method === "email") {
        const { error: err2 } = await supabase.auth.verifyOtp({ email: contact, token: code, type: "email" });
        if (err2) { setLoading(false); setError("Неверный код. Попробуйте ещё раз."); setDigits(Array(OTP_LENGTH).fill("")); focusInput(0); return; }
      } else {
        setLoading(false); setError("Неверный код. Попробуйте ещё раз."); setDigits(Array(OTP_LENGTH).fill("")); focusInput(0); return;
      }
    }

    setSuccess(true);
    const { data: { user: u } } = await supabase.auth.getUser();
    const redirect = roleRedirect(u?.user_metadata?.role ?? "USER");
    setTimeout(() => router.push(redirect), 1500);
  }, [method, contact, router, supabase]);

  const handleResend = async () => {
    if (!canResend || !method || !contact) return;
    setResending(true);
    setError("");

    const { error: err } =
      method === "email"
        ? await supabase.auth.signInWithOtp({ email: contact })
        : await supabase.auth.signInWithOtp({ phone: contact });

    setResending(false);
    if (err) { setError("Не удалось отправить код. Попробуйте позже."); return; }
    setCooldown(RESEND_COOLDOWN);
    setCanResend(false);
    setDigits(Array(OTP_LENGTH).fill(""));
    focusInput(0);
  };

  const maskedContact = contact.includes("@")
    ? contact.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.min(b.length, 4)) + c)
    : contact.slice(0, 4) + "****" + contact.slice(-3);

  if (!method || !contact) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Неверная ссылка. <a href="/register" className="text-brand-blue underline">Зарегистрироваться</a></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <a href="/" className="inline-flex items-center gap-2.5 mb-12">
          <div className="w-9 h-9 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-brand-blue" />
          </div>
          <span className="text-lg font-bold text-slate-900">Wash<span className="text-brand-blue"> Go</span></span>
        </a>

        <AnimatePresence mode="wait">
          {success ? (
            /* Success state */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </motion.div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Подтверждено!</h2>
              <p className="text-slate-400">Перенаправляем в личный кабинет…</p>
              <motion.div
                className="h-1 bg-brand-blue rounded-full mt-6 mx-auto"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5 }}
              />
            </motion.div>
          ) : (
            /* OTP input state */
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center mb-6">
                {method === "email"
                  ? <Mail className="w-7 h-7 text-brand-blue" />
                  : <Smartphone className="w-7 h-7 text-brand-blue" />}
              </div>

              <h1 className="text-3xl font-black text-slate-900 mb-2">Введите код</h1>
              <p className="text-slate-400 mb-1">
                Мы отправили 6-значный код на
              </p>
              <p className="font-semibold text-slate-700 mb-8">
                {method === "email" ? "📧" : "📱"} {maskedContact}
              </p>

              {/* OTP Digits */}
              <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <motion.div
                    key={i}
                    animate={error ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <input
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onFocus={(e) => e.target.select()}
                      className={`w-10 h-12 text-center text-lg font-bold rounded-xl border-2 transition-all outline-none
                        ${d ? "border-brand-blue bg-brand-blue/5 text-brand-blue"
                             : "border-slate-200 bg-slate-50 text-slate-900"}
                        ${error ? "border-red-300 bg-red-50" : ""}
                        focus:border-brand-blue focus:bg-white focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)]`}
                      disabled={loading}
                      autoFocus={i === 0}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Loading bar */}
              {loading && (
                <motion.div className="h-0.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-blue rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                </motion.div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Resend */}
              <div className="text-center mt-2">
                {canResend ? (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="inline-flex items-center gap-2 text-sm text-brand-blue hover:text-brand-blue/80 font-medium transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
                    {resending ? "Отправляем…" : "Отправить код повторно"}
                  </button>
                ) : (
                  <p className="text-sm text-slate-400">
                    Повторная отправка через{" "}
                    <span className="font-semibold text-slate-600 tabular-nums">{cooldown}с</span>
                  </p>
                )}
              </div>

              {/* Back */}
              <div className="flex items-center justify-center mt-8">
                <button
                  onClick={() => router.push("/register")}
                  className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Назад к регистрации
                </button>
              </div>

              {method === "phone" && (
                <p className="text-xs text-center text-slate-300 mt-4">
                  SMS отправляется через Twilio. Убедитесь что Twilio настроен в Supabase.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
