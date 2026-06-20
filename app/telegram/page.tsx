"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ArrowLeft, Droplets } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { getClientCoords } from "@/lib/geo";

const servicePrices: Record<string, number> = { express: 49000, premium: 99000, detail: 199000, eco: 59000 };

const services = [
  { id: "express", icon: "⚡", name: "Express", price: "49 000", time: "~30 min" },
  { id: "premium", icon: "✨", name: "Premium", price: "99 000", time: "~60 min", popular: true },
  { id: "detail", icon: "💎", name: "Detail", price: "199 000", time: "~2 hrs" },
  { id: "eco", icon: "🌿", name: "Eco", price: "59 000", time: "~45 min" },
];

const locations = [
  { id: "home", label: "Home", address: "Yunusobod, 12-house" },
  { id: "office", label: "Office", address: "Amir Temur 107B" },
  { id: "custom", label: "Other location", address: "Enter address" },
];

export default function TelegramMiniApp() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState("premium");
  const [location, setLocation] = useState("home");
  const [time, setTime] = useState("Now");
  const [booked, setBooked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");

  const service = services.find(s => s.id === selected)!;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setNeedsLogin(true);
    });
  }, []);

  const confirm = async () => {
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

    const newOrderNumber = "W-" + Math.floor(1000 + Math.random() * 9000);
    const loc = locations.find(l => l.id === location);
    const coords = await getClientCoords();

    const { error: err } = await supabase.from("orders").insert({
      user_id: user.id,
      order_number: newOrderNumber,
      service_type: `${service.name} Wash`,
      status: "pending",
      price: servicePrices[service.id],
      location_name: loc?.address ?? "",
      scheduled_at: time === "Now (ASAP)" ? new Date().toISOString() : null,
      client_lat: coords?.lat ?? null,
      client_lng: coords?.lng ?? null,
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
          <h2 className="text-lg font-black text-slate-900 mb-2">Войдите в аккаунт VISIT</h2>
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
          <div className="text-sm font-bold text-white">VISIT Car Wash</div>
          <div className="text-xs text-white/60">Bot</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-slate-200">
        <motion.div className="h-full bg-brand-blue" style={{ width: `${(step / 3) * 100}%` }} transition={{ duration: 0.3 }} />
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

          {/* STEP 3 — Confirm */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">✅ {t("telegram.confirmOrder")}</div>

              <div className="bg-white rounded-2xl p-4 space-y-3 mb-4 border border-slate-200 shadow-sm">
                {[
                  ["Service", `${service.icon} ${service.name} Wash`],
                  ["Location", locations.find(l => l.id === location)?.label || ""],
                  ["Time", time],
                  ["Price", `${service.price} so'm`],
                  ["Payment", "💵 При получении"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-xs text-slate-400">{k}</span>
                    <span className="text-sm font-semibold text-slate-900">{v}</span>
                  </div>
                ))}
              </div>

              <div className="text-xs text-slate-400 text-center mb-3 leading-relaxed">
                {t("telegram.agreeTerms")} <span className="text-brand-blue">{t("telegram.termsOfService")}</span>
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
          onClick={step < 3 ? () => setStep(s => s + 1) : confirm}
          disabled={loading}
          className="w-full h-12 rounded-2xl bg-brand-blue text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60 shadow-md transition-all"
        >
          {loading ? (
            <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Booking...</>
          ) : step === 3 ? (
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
