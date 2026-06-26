"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ArrowLeft, Droplets, Locate, Copy, Paperclip, AlertCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { getClientCoords } from "@/lib/geo";
import { compressImage } from "@/lib/image";
import { buildPaymentDetails, MANUAL_PAYMENT_METHODS, type AppPaymentSettings } from "@/lib/payment";
import { workerEarning } from "@/lib/commission";

declare global {
  interface Window {
    Telegram?: { WebApp?: { ready: () => void; expand: () => void; setHeaderColor: (c: string) => void; setBackgroundColor: (c: string) => void } };
  }
}

const servicePrices: Record<string, number> = { express: 200000, premium: 320000, detail: 450000 };

const services = [
  { id: "express", icon: "⚡", name: "Standard", price: "200 000", time: "~30 min" },
  { id: "premium", icon: "✨", name: "Premium", price: "320 000", time: "~60 min", popular: true },
  { id: "detail", icon: "💎", name: "VIP", price: "450 000", time: "~2 hrs" },
];

type SavedAddress = { id: string; label: string; address: string; lat: number; lng: number; is_default: boolean };

const paymentOptions = [
  { id: "card",  icon: "💳", label: "Карта" },
  { id: "click", icon: "🟢", label: "Click" },
  { id: "payme", icon: "🔵", label: "Payme" },
  { id: "cash",  icon: "💵", label: "Наличные" },
];

export default function TelegramMiniApp() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState("premium");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [location, setLocation] = useState("current");
  const [time, setTime] = useState("Now");
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState("");
  const [copied, setCopied] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<AppPaymentSettings | null>(null);

  const companyDetails = buildPaymentDetails(paymentSettings);
  const isManualPayment = MANUAL_PAYMENT_METHODS.includes(paymentMethod);
  const service = services.find(s => s.id === selected)!;
  const locations = [...savedAddresses, { id: "current", label: "Текущее местоположение", address: "Определим по GPS", lat: 0, lng: 0, is_default: false }];

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => {
      const tg = window.Telegram?.WebApp;
      if (!tg) return;
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#0EA5E9");
      tg.setBackgroundColor("#F0F7FF");
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setNeedsLogin(true); return; }
      supabase.from("addresses").select("id, label, address, lat, lng, is_default")
        .eq("user_id", session.user.id).order("is_default", { ascending: false })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setSavedAddresses(data);
            setLocation(data.find(a => a.is_default)?.id ?? data[0].id);
          }
        });
    });

    supabase.from("app_settings").select("payment_card_number, payment_click_number, payment_payme_number").eq("id", 1).single()
      .then(({ data }) => { if (data) setPaymentSettings(data); });
  }, []);

  const copyDetail = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const confirm = async () => {
    if (isManualPayment && !receiptFile) {
      setReceiptError("Прикрепите фото или скрин чека перевода — без него заказ нельзя оформить");
      return;
    }

    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      setLoading(false);
      setNeedsLogin(true);
      return;
    }

    let receiptUrl: string | null = null;
    if (isManualPayment && receiptFile) {
      const blob = await compressImage(receiptFile).catch(() => null);
      const path = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from("payment-receipts").upload(path, blob ?? receiptFile, { contentType: "image/jpeg" });
      if (uploadError) {
        setLoading(false);
        setReceiptError("Не удалось загрузить чек, попробуйте ещё раз");
        return;
      }
      receiptUrl = supabase.storage.from("payment-receipts").getPublicUrl(path).data.publicUrl;
    }

    const newOrderNumber = "W-" + Math.floor(1000 + Math.random() * 9000);
    const chosen = savedAddresses.find(l => l.id === location);
    const [profileRes, coords] = await Promise.all([
      supabase.from("profiles").select("phone").eq("id", user.id).single(),
      chosen ? Promise.resolve(null) : getClientCoords(),
    ]);

    const { error: err } = await supabase.from("orders").insert({
      user_id: user.id,
      order_number: newOrderNumber,
      service_type: `${service.name} Wash`,
      status: "pending",
      price: servicePrices[service.id],
      worker_earning: workerEarning(service.id, servicePrices[service.id]),
      location_name: chosen?.address ?? "Текущее местоположение",
      scheduled_at: time === "Now (ASAP)" ? new Date().toISOString() : null,
      client_lat: chosen?.lat ?? coords?.lat ?? null,
      client_lng: chosen?.lng ?? coords?.lng ?? null,
      client_phone: profileRes.data?.phone ?? null,
      payment_method: paymentMethod,
      payment_status: isManualPayment ? "awaiting_verification" : "unpaid",
      receipt_url: receiptUrl,
    });

    setLoading(false);
    if (err) { setError("Ошибка: " + err.message); return; }
    setOrderNumber(newOrderNumber);
    setBooked(true);
  };

  if (booked) {
    return (
      <div className="min-h-screen bg-[#F0F7FF] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }} className="text-center">
          <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.2 }} className="text-7xl mb-6">
            🎉
          </motion.div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">{t("telegram.booked")}</h2>
          <p className="text-slate-500 mb-6">{t("telegram.washerOnWay")}<br />ETA: <span className="text-brand-blue font-bold">~15 {t("common.min")}</span></p>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 text-left shadow-sm">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Service</span>
              <span className="text-slate-900 font-medium">{service.icon} {service.name} Wash</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Location</span>
              <span className="text-slate-900 font-medium">{locations.find(l => l.id === location)?.label}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Price</span>
              <span className="text-slate-900 font-bold">{service.price} so'm</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Order ID</span>
              <span className="font-mono text-brand-blue text-xs">{orderNumber}</span>
            </div>
          </div>

          <a href="/dashboard/tracking" className="block w-full h-12 rounded-xl bg-brand-blue text-white font-bold text-sm shadow-md flex items-center justify-center">
            {t("telegram.trackLive")} 🗺️
          </a>
        </motion.div>
      </div>
    );
  }

  if (needsLogin) {
    return (
      <div className="min-h-screen bg-[#F0F7FF] flex items-center justify-center px-4 text-center">
        <div>
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-lg font-black text-slate-900 mb-2">Войдите в аккаунт Wash Go</h2>
          <p className="text-sm text-slate-500 mb-6">Чтобы оформить заказ через Telegram, нужно войти в свой аккаунт.</p>
          <a href="/login" className="inline-block px-6 py-3 rounded-xl bg-brand-blue text-white font-bold text-sm shadow-md">
            Войти
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F7FF] flex flex-col" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Telegram-style header */}
      <div className="bg-brand-blue px-4 py-3 flex items-center gap-3 shadow-md">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="text-white/80 mr-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
          <Droplets className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-white">Wash Go</div>
          <div className="text-xs text-white/60">Bot</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-slate-200">
        <motion.div className="h-full bg-brand-blue" style={{ width: `${(step / 4) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>

      <div className="flex-1 p-4 overflow-auto space-y-3 max-w-sm mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* STEP 0 — Choose Service */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-5 pt-2">
                <div className="text-4xl mb-2">🚗</div>
                <h1 className="text-lg font-black text-slate-900 mb-1">{t("telegram.bookTitle")}</h1>
                <p className="text-sm text-slate-400">{t("telegram.bookSub")}</p>
              </div>

              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("telegram.chooseService")}</div>
              <div className="space-y-2">
                {services.map((s) => (
                  <button key={s.id} onClick={() => setSelected(s.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${selected === s.id ? "bg-brand-blue/10 border-brand-blue/40" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"}`}>
                    <span className="text-xl w-8 text-center">{s.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{s.name}</span>
                        {s.popular && <span className="text-[9px] bg-brand-blue text-white px-1.5 py-0.5 rounded-full font-bold">Popular</span>}
                      </div>
                      <div className="text-xs text-slate-400">{s.time}</div>
                    </div>
                    <div className="text-sm font-black text-slate-900">{s.price}</div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected === s.id ? "border-brand-blue bg-brand-blue" : "border-slate-300"}`}>
                      {selected === s.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 1 — Location */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">📍 {t("telegram.whereIsCar")}</div>
              <div className="space-y-2 mb-4">
                {locations.map((loc) => (
                  <button key={loc.id} onClick={() => setLocation(loc.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${location === loc.id ? "bg-brand-blue/10 border-brand-blue/40" : "bg-white border-slate-200 shadow-sm"}`}>
                    {loc.id === "current" && <Locate className="w-4 h-4 text-brand-blue flex-shrink-0" />}
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900">{loc.label}</div>
                      <div className="text-xs text-slate-400">{loc.address}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${location === loc.id ? "border-brand-blue bg-brand-blue" : "border-slate-300"}`}>
                      {location === loc.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Time */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">🕐 {t("telegram.when")}</div>
              <div className="grid grid-cols-2 gap-2">
                {["Now (ASAP)", "In 30 min", "1 hour", "2 hours", "This afternoon", "Tomorrow morning"].map((t) => (
                  <button key={t} onClick={() => setTime(t)}
                    className={`p-3 rounded-2xl border text-sm font-medium transition-all ${time === t ? "bg-brand-blue/10 border-brand-blue/40 text-brand-blue" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm"}`}>
                    {t}
                  </button>
                ))}
              </div>

              <div className="mt-4 bg-brand-blue/5 border border-brand-blue/20 rounded-2xl p-3 text-xs text-slate-500">
                <span className="text-brand-blue font-bold">💡 {t("telegram.aiTip")}</span> {t("telegram.aiTipText")}
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Payment method */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">💳 Способ оплаты</div>
              <div className="space-y-2 mb-4">
                {paymentOptions.map((p) => (
                  <button key={p.id} onClick={() => { setPaymentMethod(p.id); setReceiptError(""); }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${paymentMethod === p.id ? "bg-brand-blue/10 border-brand-blue/40" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"}`}>
                    <span className="text-xl w-8 text-center">{p.icon}</span>
                    <span className="flex-1 text-sm font-bold text-slate-900">{p.label}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === p.id ? "border-brand-blue bg-brand-blue" : "border-slate-300"}`}>
                      {paymentMethod === p.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              {isManualPayment && (
                <div className="bg-white rounded-2xl p-4 space-y-3 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs text-slate-400">{companyDetails[paymentMethod]?.label}</div>
                      <div className="font-mono font-bold text-slate-900 text-sm">{companyDetails[paymentMethod]?.value}</div>
                    </div>
                    <button onClick={() => copyDetail(companyDetails[paymentMethod]?.value ?? "")}
                      className="flex items-center gap-1 h-8 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium shrink-0">
                      <Copy className="w-3.5 h-3.5" /> {copied ? "Скопировано" : "Скопировать"}
                    </button>
                  </div>
                  <div className="text-xs text-slate-500">Сумма: <span className="font-bold text-slate-900">{service.price} so&apos;m</span></div>

                  {receiptError && (
                    <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />{receiptError}
                    </div>
                  )}

                  <label className="flex items-center gap-2 h-11 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-slate-600 text-sm font-medium cursor-pointer">
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span className="truncate">{receiptFile ? receiptFile.name : "Прикрепить чек (фото/скрин)"}</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={(e) => { setReceiptFile(e.target.files?.[0] ?? null); setReceiptError(""); }} />
                  </label>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4 — Confirm */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">✅ {t("telegram.confirmOrder")}</div>

              <div className="bg-white rounded-2xl p-4 space-y-3 mb-4 border border-slate-200 shadow-sm">
                {[
                  ["Service", `${service.icon} ${service.name} Wash`],
                  ["Location", locations.find(l => l.id === location)?.label || ""],
                  ["Time", time],
                  ["Price", `${service.price} so'm`],
                  ["Payment", `${paymentOptions.find(p => p.id === paymentMethod)?.icon} ${paymentOptions.find(p => p.id === paymentMethod)?.label}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-xs text-slate-400">{k}</span>
                    <span className="text-sm font-semibold text-slate-900">{v}</span>
                  </div>
                ))}
              </div>

              <div className="text-xs text-slate-400 text-center mb-3 leading-relaxed">
                {t("telegram.agreeTerms")} <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-brand-blue underline">{t("telegram.termsOfService")}</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom action button */}
      <div className="p-4 bg-white border-t border-slate-200 max-w-sm mx-auto w-full shadow-lg">
        {error && <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2 text-center">{error}</div>}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            if (step === 3 && isManualPayment && !receiptFile) {
              setReceiptError("Прикрепите фото или скрин чека перевода — без него заказ нельзя оформить");
              return;
            }
            if (step < 4) setStep(s => s + 1); else confirm();
          }}
          disabled={loading}
          className="w-full h-12 rounded-2xl bg-brand-blue text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60 shadow-md transition-all"
        >
          {loading ? (
            <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Booking...</>
          ) : step === 4 ? (
            <>{t("telegram.confirmPay")} {service.price} <Check className="w-4 h-4" /></>
          ) : (
            <>Continue <ChevronRight className="w-4 h-4" /></>
          )}
        </motion.button>
        <div className="text-center text-[10px] text-slate-400 mt-2">{t("telegram.poweredBy")}</div>
      </div>
    </div>
  );
}
