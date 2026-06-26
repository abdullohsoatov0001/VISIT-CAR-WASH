"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Car, Clock, CreditCard, Check, ChevronRight, ArrowLeft, Droplets, Zap, Shield, Plus, MapPin, Copy, Paperclip, AlertCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { buildPaymentDetails, MANUAL_PAYMENT_METHODS, type AppPaymentSettings } from "@/lib/payment";
import { workerEarning } from "@/lib/commission";
import type { PickedLocation } from "@/components/LocationPicker";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { ssr: false });

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
    { id: "express", name: t("booking.expressName"), desc: t("booking.expressDesc"), price: 200000, duration: "30–45 min", icon: "⚡",
      includes: ["Exterior wash", "Window clean", "Tire shine", "Air freshener"], color: "blue" },
    { id: "premium", name: t("booking.premiumName"), desc: t("booking.premiumDesc"), price: 320000, duration: "60–75 min", icon: "✨",
      includes: ["All Standard +", "Interior vacuum", "Dashboard polish", "Door jambs", "Before/after photos"], popular: true, color: "purple" },
    { id: "elite", name: t("booking.eliteName"), desc: t("booking.eliteDesc"), price: 450000, duration: "2–3 hours", icon: "💎",
      includes: ["All Premium +", "Clay bar treatment", "Leather conditioning", "Engine bay", "Odor elimination", "AI health report"], color: "cyan" },
  ];

  const addons = [
    { id: "ceramic", label: t("booking.addonCeramic"), price: 89000, icon: "🛡️" },
    { id: "ozone", label: t("booking.addonOzone"), price: 39000, icon: "💨" },
    { id: "tint", label: t("booking.addonTint"), price: 120000, icon: "🔲" },
    { id: "polish", label: t("booking.addonHeadlight"), price: 25000, icon: "💡" },
  ];

  const basePaymentMethods = [
    { id: "card", label: t("booking.payCard"), icon: "💳", desc: t("booking.payCardDesc") },
    { id: "click", label: t("booking.payClick"), icon: "🟢", desc: t("booking.payClickDesc") },
    { id: "payme", label: t("booking.payPayme"), icon: "🔵", desc: t("booking.payPaymeDesc") },
    { id: "cash", label: t("booking.payCash"), icon: "💵", desc: t("booking.payCashDesc") },
  ];

  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState("premium");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<{ id: string; label: string; address: string; lat: number; lng: number; is_default: boolean }[]>([]);
  const [selectedTime, setSelectedTime] = useState("Now (ASAP)");
  const [selectedDate, setSelectedDate] = useState("Today");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [subscription, setSubscription] = useState<{ id: string; plan: string; washes_left: number } | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState("");
  const [copiedDetail, setCopiedDetail] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<AppPaymentSettings | null>(null);
  const companyDetails = buildPaymentDetails(paymentSettings);

  // Реквизиты для ручной оплаты задаются админом в /admin/settings
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("app_settings")
      .select("payment_card_number, payment_click_number, payment_payme_number")
      .eq("id", 1)
      .single()
      .then(({ data }) => { if (data) setPaymentSettings(data); });
  }, []);

  // Загружаем реальные сохранённые адреса пользователя (профиль → "Мои адреса")
  // и активную подписку (если есть — можно оплатить мойку моками вместо карты)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase
        .from("addresses")
        .select("id, label, address, lat, lng, is_default")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true })
        .then(({ data }) => {
          setSavedAddresses(data ?? []);
          const def = (data ?? []).find(a => a.is_default) ?? data?.[0];
          if (def) {
            setSelectedLocation(def.id);
            setPickedLocation({ lat: def.lat, lng: def.lng, address: def.address });
          }
        });

      supabase
        .from("subscriptions")
        .select("id, plan, washes_left")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data && (data.washes_left < 0 || data.washes_left > 0)) {
            setSubscription(data);
            setPaymentMethod("subscription");
          }
        });
    });
  }, []);

  const choosePreset = (id: string) => {
    setSelectedLocation(id);
    const preset = savedAddresses.find(l => l.id === id);
    if (preset) setPickedLocation({ lat: preset.lat, lng: preset.lng, address: preset.address });
  };
  const [loading, setLoading] = useState(false);

  const paymentMethods = subscription
    ? [{ id: "subscription", label: `Подписка ${subscription.plan}`, icon: "⭐", desc: subscription.washes_left < 0 ? "Безлимит — без оплаты" : `Осталось моек: ${subscription.washes_left}` }, ...basePaymentMethods]
    : basePaymentMethods;

  const service = services.find((s) => s.id === selectedService)!;
  const addonTotal = addons.filter((a) => selectedAddons.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const total = paymentMethod === "subscription" ? addonTotal : service.price + addonTotal;

  const toggleAddon = (id: string) => setSelectedAddons((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const isManualPayment = MANUAL_PAYMENT_METHODS.includes(paymentMethod);

  const goNext = () => {
    if (step === 3 && isManualPayment && !receiptFile) {
      setReceiptError("Прикрепите фото или скрин чека перевода — без него заказ нельзя оформить");
      return;
    }
    setStep((s) => s + 1);
  };

  const copyDetail = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedDetail(true);
      setTimeout(() => setCopiedDetail(false), 1500);
    });
  };

  const handleConfirm = async () => {
    if (isManualPayment && !receiptFile) {
      setStep(3);
      setReceiptError("Прикрепите фото или скрин чека перевода — без него заказ нельзя оформить");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      window.location.href = "/login";
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
        setStep(3);
        return;
      }
      receiptUrl = supabase.storage.from("payment-receipts").getPublicUrl(path).data.publicUrl;
    }

    const orderNumber = "W-" + Math.floor(1000 + Math.random() * 9000);
    const { data: profileData } = await supabase.from("profiles").select("phone").eq("id", user.id).single();

    const { error } = await supabase.from("orders").insert({
      user_id:        user.id,
      order_number:   orderNumber,
      service_type:   service.name,
      status:         "pending",
      price:          total,
      worker_earning: workerEarning(service.id, service.price + addonTotal),
      location_name:  pickedLocation?.address ?? "",
      notes:          selectedAddons.length > 0 ? selectedAddons.join(", ") : null,
      scheduled_at:   selectedTime === "Now (ASAP)" ? new Date().toISOString() : null,
      client_lat:     pickedLocation?.lat ?? null,
      client_lng:     pickedLocation?.lng ?? null,
      client_phone:   profileData?.phone ?? null,
      payment_method: paymentMethod,
      payment_status: isManualPayment ? "awaiting_verification" : paymentMethod === "cash" ? "unpaid" : "verified",
      receipt_url:    receiptUrl,
    });

    if (error) {
      setLoading(false);
      alert("Ошибка: " + error.message);
      return;
    }

    if (paymentMethod === "subscription" && subscription && subscription.washes_left > 0) {
      await supabase.from("subscriptions").update({ washes_left: subscription.washes_left - 1 }).eq("id", subscription.id);
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
          locationName: pickedLocation?.address ?? "",
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
            <span className="font-bold text-slate-900 text-sm">Wash<span className="text-brand-blue"> Go</span></span>
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

              {savedAddresses.length > 0 && (
                <div className="space-y-3 mb-6">
                  {savedAddresses.map((loc) => (
                    <motion.div key={loc.id} whileHover={{ x: 4 }} onClick={() => choosePreset(loc.id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${selectedLocation === loc.id ? "bg-brand-blue/5 border-brand-blue/30" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"}`}>
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 text-sm">{loc.label}</div>
                        <div className="text-xs text-slate-400 truncate">{loc.address}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedLocation === loc.id ? "border-brand-blue bg-brand-blue" : "border-slate-300"}`}>
                        {selectedLocation === loc.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                {savedAddresses.length > 0 ? "Или выберите точку на карте" : "Выберите точку на карте"}
              </p>
              <LocationPicker
                value={pickedLocation}
                onChange={(loc) => { setPickedLocation(loc); setSelectedLocation("custom"); }}
              />
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

              {isManualPayment && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("booking.manualPayInstructions")}</div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-400">{companyDetails[paymentMethod]?.label}</div>
                        <div className="font-mono font-bold text-slate-900">{companyDetails[paymentMethod]?.value}</div>
                      </div>
                      <button onClick={() => copyDetail(companyDetails[paymentMethod]?.value ?? "")}
                        className="flex items-center gap-1 h-8 px-3 rounded-lg bg-white border border-slate-200 text-slate-500 text-xs font-medium hover:border-slate-300 transition-all shrink-0">
                        <Copy className="w-3.5 h-3.5" /> {copiedDetail ? t("common.copied") : t("common.copy")}
                      </button>
                    </div>
                    <div className="text-xs text-slate-500">{t("booking.manualPayAmount")}: <span className="font-bold text-slate-900">{total.toLocaleString()} so'm</span></div>
                  </div>

                  {receiptError && (
                    <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />{receiptError}
                    </div>
                  )}

                  <label className="flex items-center gap-2 h-11 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-slate-600 text-sm font-medium cursor-pointer hover:bg-slate-100 transition-all">
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span className="truncate">{receiptFile ? receiptFile.name : t("booking.attachReceipt")}</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={(e) => { setReceiptFile(e.target.files?.[0] ?? null); setReceiptError(""); }} />
                  </label>
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
                  { label: t("booking.location"), value: pickedLocation?.address || "", icon: "📍", stepNum: 1 },
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
              onClick={step < 4 ? goNext : handleConfirm}
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
