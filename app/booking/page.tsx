"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { MapPin, Car, Clock, CreditCard, Check, ChevronRight, ArrowLeft, Droplets, Zap, Shield, Navigation, Plus } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { getClientCoords } from "@/lib/geo";

const colorCard: Record<string, string> = {
  blue: "border-brand-blue/30 bg-brand-blue/5",
  purple: "border-brand-purple/30 bg-brand-purple/5",
  cyan: "border-cyan-400/30 bg-cyan-50",
  green: "border-emerald-400/30 bg-emerald-50",
};

const timeSlots = ["Now (ASAP)", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

export default function BookingPage() {
  const { t } = useLanguage();

  const services = [
    { id: "express", name: t("booking.expressName"), desc: t("booking.expressDesc"), price: 49000, duration: "30–45 min", icon: "⚡",
      includes: ["Exterior wash", "Window clean", "Tire shine", "Air freshener"], color: "blue" },
    { id: "premium", name: t("booking.premiumName"), desc: t("booking.premiumDesc"), price: 99000, duration: "60–75 min", icon: "✨",
      includes: ["All Express +", "Interior vacuum", "Dashboard polish", "Door jambs", "Before/after photos"], popular: true, color: "purple" },
    { id: "elite", name: t("booking.eliteName"), desc: t("booking.eliteDesc"), price: 199000, duration: "2–3 hours", icon: "💎",
      includes: ["All Premium +", "Clay bar treatment", "Leather conditioning", "Engine bay", "Odor elimination", "AI health report"], color: "cyan" },
    { id: "eco", name: t("booking.ecoName"), desc: t("booking.ecoDesc"), price: 59000, duration: "45–60 min", icon: "🌿",
      includes: ["Waterless exterior", "Micro-fiber polish", "UV protection", "Eco certificate"], color: "green" },
  ];

  const addons = [
    { id: "ceramic", label: t("booking.addonCeramic"), price: 89000, icon: "🛡️" },
    { id: "ozone", label: t("booking.addonOzone"), price: 39000, icon: "💨" },
    { id: "tint", label: t("booking.addonTint"), price: 120000, icon: "🔲" },
    { id: "polish", label: t("booking.addonHeadlight"), price: 25000, icon: "💡" },
  ];

  const savedLocations = [
    { id: "home", label: t("booking.locHome"), address: "Yunusobod, 12-house, apt. 45", icon: "🏠" },
    { id: "office", label: t("booking.locOffice"), address: "Amir Temur Ave, 107-B", icon: "🏢" },
    { id: "mall", label: t("booking.locMall"), address: "Kichik Halqa yoli 2", icon: "🏪" },
  ];

  const paymentMethods = [
    { id: "card", label: t("booking.payCard"), icon: "💳", desc: t("booking.payCardDesc") },
    { id: "click", label: t("booking.payClick"), icon: "🟢", desc: t("booking.payClickDesc") },
    { id: "payme", label: t("booking.payPayme"), icon: "🔵", desc: t("booking.payPaymeDesc") },
    { id: "cash", label: t("booking.payCash"), icon: "💵", desc: t("booking.payCashDesc") },
  ];

  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState("premium");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("home");
  const [selectedTime, setSelectedTime] = useState("Now (ASAP)");
  const [selectedDate, setSelectedDate] = useState("Today");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [loading, setLoading] = useState(false);

  const service = services.find((s) => s.id === selectedService)!;
  const addonTotal = addons.filter((a) => selectedAddons.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const total = service.price + addonTotal;

  const toggleAddon = (id: string) => setSelectedAddons((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const handleConfirm = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const location = savedLocations.find(l => l.id === selectedLocation);

    const orderNumber = "W-" + Math.floor(1000 + Math.random() * 9000);
    const coords = await getClientCoords();

    const { error } = await supabase.from("orders").insert({
      user_id:       user.id,
      order_number:  orderNumber,
      service_type:  service.name,
      status:        "pending",
      price:         total,
      location_name: location?.address ?? "",
      notes:         selectedAddons.length > 0 ? selectedAddons.join(", ") : null,
      scheduled_at:  selectedTime === "Now (ASAP)" ? new Date().toISOString() : null,
      client_lat:    coords?.lat ?? null,
      client_lng:    coords?.lng ?? null,
    });

    if (error) {
      setLoading(false);
      alert("Ошибка: " + error.message);
      return;
    }

    if (user.email) {
      fetch("/api/notify/order-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          orderNumber,
          serviceType: service.name,
          price: total,
          locationName: location?.address ?? "",
        }),
      }).catch(() => {});
    }

    window.location.href = "/dashboard/tracking";
  };

  const dates = [
    { key: "Today", label: t("common.today") },
    { key: "Tomorrow", label: t("common.next") },
    { key: "Thu 12", label: "Thu 12" },
    { key: "Fri 13", label: "Fri 13" },
    { key: "Sat 14", label: "Sat 14" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFF] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard">
            <button className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> {t("common.back")}
            </button>
          </Link>
          <div className="flex items-center gap-1">
            <Droplets className="w-4 h-4 text-brand-blue" />
            <span className="font-bold text-slate-900 text-sm">VISIT<span className="text-brand-blue">.</span></span>
          </div>
          <div className="text-xs text-slate-400">{step + 1}/5</div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-1 mb-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button onClick={() => i <= step && setStep(i)}
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? "bg-emerald-500 text-white" : i === step ? "bg-brand-blue text-white shadow-[0_0_20px_rgba(14,165,233,0.3)]" : "bg-slate-100 border border-slate-200 text-slate-300"}`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </button>
              {i < 4 && <div className={`flex-1 h-px mx-1 ${i < step ? "bg-brand-blue/40" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 0 — Service */}
          {step === 0 && (
            <motion.div key="service" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{t("booking.chooseService")}</h1>
              <p className="text-slate-400 text-sm mb-6">{t("booking.aiRec")}</p>

              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {services.map((s) => (
                  <motion.div key={s.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedService(s.id)}
                    className={`relative border rounded-2xl p-5 cursor-pointer transition-all ${selectedService === s.id ? colorCard[s.color] : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"}`}>
                    {"popular" in s && s.popular && (
                      <div className="absolute -top-2.5 left-4">
                        <span className="bg-brand-blue text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">{t("booking.popularBadge")}</span>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{s.icon}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedService === s.id ? "border-brand-blue bg-brand-blue" : "border-slate-300"}`}>
                        {selectedService === s.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <div className="font-bold text-slate-900 mb-1">{s.name}</div>
                    <div className="text-xs text-slate-400 mb-3 leading-relaxed">{s.desc}</div>
                    <div className="flex items-center justify-between">
                      <div className="font-black text-lg text-slate-900">{(s.price / 1000).toFixed(0)}K <span className="text-xs font-normal text-slate-400">so'm</span></div>
                      <div className="flex items-center gap-1 text-xs text-slate-400"><Clock className="w-3 h-3" /> {s.duration}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-brand-blue" /> {t("booking.addons")}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {addons.map((a) => (
                    <button key={a.id} onClick={() => toggleAddon(a.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${selectedAddons.includes(a.id) ? "bg-brand-blue/10 border-brand-blue/30 text-brand-blue" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                      <span>{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">{a.label}</div>
                        <div className="text-xs opacity-60">+{(a.price / 1000).toFixed(0)}K</div>
                      </div>
                      {selectedAddons.includes(a.id) && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 1 — Location */}
          {step === 1 && (
            <motion.div key="location" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{t("booking.chooseLocation")}</h1>
              <p className="text-slate-400 text-sm mb-6">{t("booking.savedLocations")}</p>

              <div className="space-y-3 mb-6">
                {savedLocations.map((loc) => (
                  <motion.div key={loc.id} whileHover={{ x: 4 }} onClick={() => setSelectedLocation(loc.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${selectedLocation === loc.id ? "bg-brand-blue/5 border-brand-blue/30" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"}`}>
                    <span className="text-2xl">{loc.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 text-sm">{loc.label}</div>
                      <div className="text-xs text-slate-400">{loc.address}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedLocation === loc.id ? "border-brand-blue bg-brand-blue" : "border-slate-300"}`}>
                      {selectedLocation === loc.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="relative mb-4">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input placeholder={t("booking.addressPlaceholder")} className="w-full h-12 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all shadow-sm" />
              </div>

              <div className="h-48 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative">
                <div className="absolute inset-0 grid-bg opacity-40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Navigation className="w-8 h-8 text-brand-blue/40 mx-auto mb-2" />
                    <div className="text-xs text-slate-400">Interactive map</div>
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <motion.div animate={{ y: [-4, 0, -4] }} transition={{ duration: 2, repeat: Infinity }}>
                    <MapPin className="w-8 h-8 text-brand-blue drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Schedule */}
          {step === 2 && (
            <motion.div key="schedule" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{t("booking.pickDateTime")}</h1>
              <p className="text-slate-400 text-sm mb-6">{t("booking.date")} & {t("booking.time")}</p>

              <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {dates.map((d) => (
                  <button key={d.key} onClick={() => setSelectedDate(d.key)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${selectedDate === d.key ? "bg-brand-blue/10 border-brand-blue/30 text-brand-blue" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm"}`}>
                    {d.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6">
                {timeSlots.map((ts) => (
                  <button key={ts} onClick={() => setSelectedTime(ts)}
                    className={`py-3 rounded-xl text-sm font-medium border transition-all ${selectedTime === ts ? "bg-brand-blue/10 border-brand-blue/30 text-brand-blue" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm"}`}>
                    {ts}
                  </button>
                ))}
              </div>

              <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-2xl p-4 flex items-start gap-3">
                <Zap className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 mb-0.5">{t("telegram.aiTip")}</div>
                  <div className="text-xs text-slate-500">{t("telegram.aiTipText")}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Payment */}
          {step === 3 && (
            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{t("booking.payment")}</h1>
              <p className="text-slate-400 text-sm mb-6">{t("booking.paymentMethod")}</p>

              <div className="space-y-2 mb-6">
                {paymentMethods.map((m) => (
                  <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${paymentMethod === m.id ? "bg-brand-blue/5 border-brand-blue/30" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"}`}>
                    <span className="text-xl">{m.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">{m.label}</div>
                      <div className="text-xs text-slate-400">{m.desc}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === m.id ? "border-brand-blue bg-brand-blue" : "border-slate-300"}`}>
                      {paymentMethod === m.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              {paymentMethod === "card" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                  <input placeholder={t("booking.cardNumber")} className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all" />
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder={t("booking.expiryDate")} className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all" />
                    <input placeholder={t("booking.cvv")} className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 transition-all" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 4 — Confirm */}
          {step === 4 && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{t("booking.confirmOrder")}</h1>
              <p className="text-slate-400 text-sm mb-6">{t("booking.orderSummary")}</p>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-4 shadow-sm">
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("booking.service")}</div>
                    <button onClick={() => setStep(0)} className="text-xs text-brand-blue">{t("common.save")}</button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{service.icon}</span>
                    <div>
                      <div className="font-bold text-slate-900">{service.name}</div>
                      <div className="text-xs text-slate-400">{service.duration}</div>
                    </div>
                    <div className="ml-auto font-bold text-slate-900">{service.price.toLocaleString()} so'm</div>
                  </div>
                  {selectedAddons.length > 0 && addons.filter(a => selectedAddons.includes(a.id)).map(a => (
                    <div key={a.id} className="flex items-center justify-between mt-2 pl-11">
                      <span className="text-xs text-slate-400">{a.icon} {a.label}</span>
                      <span className="text-xs text-slate-500">+{a.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {[
                  { label: t("booking.location"), value: savedLocations.find(l => l.id === selectedLocation)?.address || "", icon: "📍", stepNum: 1 },
                  { label: t("booking.schedule"), value: `${selectedDate} · ${selectedTime}`, icon: "🕐", stepNum: 2 },
                  { label: t("booking.payment"), value: paymentMethods.find(m => m.id === paymentMethod)?.label || paymentMethod, icon: "💳", stepNum: 3 },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0">
                    <span>{row.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs text-slate-400">{row.label}</div>
                      <div className="text-sm font-medium text-slate-900">{row.value}</div>
                    </div>
                    <button onClick={() => setStep(row.stepNum)} className="text-xs text-brand-blue">{t("common.save")}</button>
                  </div>
                ))}
              </div>

              <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5">{t("booking.total")}</div>
                  <div className="text-2xl font-black text-slate-900">{total.toLocaleString()} <span className="text-sm font-normal text-slate-400">so'm</span></div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <Shield className="w-3.5 h-3.5" /> Secure
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-4 safe-bottom shadow-lg">
          <div className="max-w-3xl mx-auto flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="h-12 px-5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 flex items-center gap-2 text-sm transition-all bg-white">
                <ArrowLeft className="w-4 h-4" /> {t("common.back")}
              </button>
            )}
            <motion.button whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(14,165,233,0.3)" }} whileTap={{ scale: 0.98 }}
              onClick={step < 4 ? () => setStep(s => s + 1) : handleConfirm}
              disabled={loading}
              className="flex-1 h-12 rounded-xl bg-brand-blue text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all shadow-md">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> {t("booking.booking")}</>
              ) : step < 4 ? (
                <>{t("common.continue")} <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>{t("booking.confirmBook")} — {total.toLocaleString()} so'm <Check className="w-4 h-4" /></>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
