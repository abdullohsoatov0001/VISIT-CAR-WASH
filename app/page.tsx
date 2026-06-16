"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  MapPin, Clock, Star, Shield, Zap, ChevronRight, Play,
  Check, ArrowRight, Droplets, Car, Users, TrendingUp,
  Sparkles, Award, Smartphone, Bell, CreditCard, Wifi,
  Navigation, Camera, BarChart3, Globe, Lock, ChevronDown,
  Quote, BadgeCheck
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

/* ───────────────────── HELPERS ───────────────────── */
const colorMap: Record<string, string> = {
  blue: "text-brand-blue bg-brand-blue/10 border-brand-blue/20",
  purple: "text-brand-purple bg-brand-purple/10 border-brand-purple/20",
  cyan: "text-cyan-600 bg-cyan-50 border-cyan-200",
  green: "text-emerald-600 bg-emerald-50 border-emerald-200",
  default: "text-slate-500 bg-slate-100 border-slate-200",
};

function GlowOrb({ x, y, color = "#0EA5E9", size = 400 }: { x: string; y: string; color?: string; size?: number }) {
  return (
    <div className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size,
        background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`,
        transform: "translate(-50%, -50%)", filter: "blur(40px)" }} />
  );
}

function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const [display, setDisplay] = useState("0");
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  return <span ref={ref}>{target}{suffix}</span>;
}

/* ───────────────────── HERO ───────────────────── */
function HeroSection() {
  const { t } = useLanguage();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const stats = [
    { value: "12K+", label: t("landing.statsHappy"), suffix: "" },
    { value: "98", label: t("landing.statsSatisfaction"), suffix: "%" },
    { value: "4.9", label: t("landing.statsRating"), suffix: "★" },
    { value: "45", label: t("landing.statsCities"), suffix: "+" },
  ];

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-gradient-to-b from-[#F8FAFF] to-[#EEF4FF]">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <GlowOrb x="20%" y="40%" color="#0EA5E9" size={600} />
      <GlowOrb x="80%" y="30%" color="#8B5CF6" size={500} />
      <GlowOrb x="50%" y="80%" color="#06B6D4" size={400} />

      {[...Array(15)].map((_, i) => (
        <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-brand-blue/30"
          style={{ left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }} />
      ))}

      <motion.div style={{ y, opacity }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-sm font-medium mb-8">
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-brand-blue" />
          {t("landing.heroTag")}
          <ChevronRight className="w-3.5 h-3.5" />
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[0.9]">
          <span className="block text-slate-900">{t("landing.heroTitle1")},</span>
          <span className="block gradient-text">{t("landing.heroTitleHighlight")}</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t("landing.heroSub")}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/booking">
            <motion.button whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(14,165,233,0.4)" }} whileTap={{ scale: 0.97 }}
              className="relative flex items-center gap-2.5 h-14 px-8 rounded-2xl bg-brand-blue text-white font-semibold text-base overflow-hidden group shadow-lg">
              <span className="relative z-10 flex items-center gap-2.5">
                <Droplets className="w-5 h-5" />
                {t("common.bookWash")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div className="absolute inset-0 bg-gradient-to-r from-brand-blue via-cyan-400 to-brand-blue"
                style={{ backgroundSize: "200% 100%" }}
                animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
            </motion.button>
          </Link>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 h-14 px-6 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium text-base transition-all shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Play className="w-4 h-4 fill-slate-600 text-slate-600" />
            </div>
            {t("landing.watchDemo")}
          </motion.button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="text-2xl font-black text-slate-900 mb-1">{stat.value}{stat.suffix}</div>
              <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-xs text-slate-400 tracking-widest uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.8, y: 60 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl pointer-events-none">
        <div className="relative">
          <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="text-center">
            <div className="text-[120px] leading-none filter drop-shadow-2xl">🚗</div>
          </motion.div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-8 bg-brand-blue/10 rounded-full blur-2xl" />
        </div>
      </motion.div>
    </section>
  );
}

/* ───────────────────── HOW IT WORKS ───────────────────── */
function HowItWorksSection() {
  const { t } = useLanguage();

  const steps = [
    { number: "01", icon: <MapPin className="w-6 h-6" />, title: t("landing.step1Title"), desc: t("landing.step1Desc"), color: "blue" },
    { number: "02", icon: <Car className="w-6 h-6" />, title: t("landing.step2Title"), desc: t("landing.step2Desc"), color: "purple" },
    { number: "03", icon: <CreditCard className="w-6 h-6" />, title: t("landing.step3Title"), desc: t("landing.step3Desc"), color: "cyan" },
    { number: "04", icon: <Navigation className="w-6 h-6" />, title: t("landing.step4Title"), desc: t("landing.step4Desc"), color: "green" },
  ];

  return (
    <section id="how-it-works" className="py-32 relative overflow-hidden bg-white">
      <GlowOrb x="90%" y="50%" color="#8B5CF6" size={500} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} className="text-center mb-20">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-blue mb-4">{t("landing.howTitle")}</span>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">{t("landing.howSub")}</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-brand-blue/20 to-transparent" />
          {steps.map((step, i) => (
            <motion.div key={step.number} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.23, 1, 0.32, 1] }} whileHover={{ y: -6 }} className="relative group">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full hover:border-brand-blue/30 transition-all duration-400 hover:shadow-[0_20px_60px_rgba(14,165,233,0.08)] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0", colorMap[step.color])}>{step.icon}</div>
                  <span className="text-4xl font-black text-slate-100 group-hover:text-brand-blue/20 transition-colors">{step.number}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="mt-16 bg-white border border-slate-200 rounded-3xl p-8 overflow-hidden relative shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/3 to-brand-purple/3" />
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Live Now</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">{t("tracking.title")}</h3>
              <p className="text-slate-500 mb-6 leading-relaxed">{t("tracking.subtitle")}</p>
              <div className="space-y-3">
                {[
                  { icon: "✓", text: t("tracking.step1"), time: "2 min ago", done: true },
                  { icon: "→", text: t("tracking.step2"), time: `${t("tracking.eta")} 12 min`, done: false },
                  { icon: "○", text: t("tracking.step3"), time: t("common.pending"), done: false },
                ].map((item, i) => (
                  <div key={i} className={cn("flex items-center gap-3 text-sm", item.done ? "text-slate-700" : "text-slate-400")}>
                    <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border",
                      item.done ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                      i === 1 ? "bg-brand-blue/10 border-brand-blue/30 text-brand-blue animate-pulse" :
                      "bg-slate-50 border-slate-200 text-slate-300")}>{item.icon}</span>
                    <span className="flex-1">{item.text}</span>
                    <span className="text-xs text-slate-400">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-52 md:h-64 bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
              <div className="absolute inset-0 grid-bg opacity-80" />
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
                <motion.path d="M 80 200 Q 160 100 280 120 Q 340 130 360 160" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="6 4" fill="none" opacity="0.6"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
              </svg>
              <div className="absolute top-[40%] right-[15%] flex flex-col items-center">
                <div className="w-8 h-8 bg-red-50 border border-red-200 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-red-500" />
                </div>
              </div>
              <motion.div className="absolute" style={{ top: "55%", left: "25%" }}
                animate={{ x: [0, 60, 0], y: [0, -30, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
                <div className="w-10 h-10 bg-brand-blue/10 border border-brand-blue/30 rounded-full flex items-center justify-center shadow-md">
                  <Car className="w-5 h-5 text-brand-blue" />
                </div>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-brand-blue text-white text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap font-semibold">
                  12 min
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────── FEATURES ───────────────────── */
function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    { icon: <Navigation className="w-5 h-5" />, title: t("landing.feat1Title"), desc: t("landing.feat1Desc"), color: "blue" },
    { icon: <Sparkles className="w-5 h-5" />, title: t("landing.feat2Title"), desc: t("landing.feat2Desc"), color: "purple" },
    { icon: <Camera className="w-5 h-5" />, title: t("landing.feat3Title"), desc: t("landing.feat3Desc"), color: "cyan" },
    { icon: <Bell className="w-5 h-5" />, title: t("landing.feat4Title"), desc: t("landing.feat4Desc"), color: "green" },
    { icon: <Shield className="w-5 h-5" />, title: t("landing.feat5Title"), desc: t("landing.feat5Desc"), color: "blue" },
    { icon: <Award className="w-5 h-5" />, title: t("landing.feat6Title"), desc: t("landing.feat6Desc"), color: "purple" },
    { icon: <Globe className="w-5 h-5" />, title: t("landing.feat7Title"), desc: t("landing.feat7Desc"), color: "cyan" },
    { icon: <BarChart3 className="w-5 h-5" />, title: t("landing.feat8Title"), desc: t("landing.feat8Desc"), color: "green" },
  ];

  return (
    <section id="features" className="py-32 relative bg-[#F8FAFF]">
      <GlowOrb x="10%" y="50%" color="#0EA5E9" size={500} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} className="text-center mb-20">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-blue mb-4">{t("nav.features")}</span>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">{t("landing.whyTitle")}</h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.23, 1, 0.32, 1] }} whileHover={{ y: -4, scale: 1.01 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-blue/30 transition-all duration-300 group cursor-default shadow-sm hover:shadow-md">
              <div className={cn("w-10 h-10 rounded-xl border mb-4 flex items-center justify-center", colorMap[f.color])}>{f.icon}</div>
              <h3 className="font-bold text-slate-900 mb-2 group-hover:text-brand-blue transition-colors">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── BEFORE/AFTER ───────────────────── */
function BeforeAfterSection() {
  const { t } = useLanguage();
  const [position, setPosition] = useState(50);

  return (
    <section className="py-32 relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-blue mb-4">Results</span>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">{t("landing.resultsTitle")}</h2>
          <p className="text-slate-400 text-lg">{t("landing.resultsSub")}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="relative max-w-3xl mx-auto rounded-3xl overflow-hidden border border-slate-200 shadow-xl" style={{ height: 400 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
            <div className="text-center"><div className="text-6xl mb-4 opacity-50">🚗</div>
              <span className="text-slate-500 text-lg font-medium">{t("login.before")}</span></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#EEF4FF] to-[#E0ECFF] flex items-center justify-center overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-brand-purple/5" />
            <div className="text-center relative z-10">
              <motion.div animate={{ filter: ["brightness(0.9)", "brightness(1.2)", "brightness(0.9)"] }} transition={{ duration: 3, repeat: Infinity }} className="text-6xl mb-4">✨</motion.div>
              <span className="text-brand-blue text-lg font-semibold">{t("login.after")}</span>
            </div>
          </div>
          <div className="absolute inset-y-0 w-0.5 bg-white shadow-lg z-10" style={{ left: `${position}%` }}>
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center cursor-grab">
              <span className="text-slate-600 text-xs font-black select-none">⟷</span>
            </div>
          </div>
          <input type="range" min={5} max={95} value={position} onChange={(e) => setPosition(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-grab z-20" />
          <div className="absolute top-4 left-4 z-10">
            <span className="text-xs font-semibold text-slate-500 bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm border border-slate-200">{t("login.before").toUpperCase()}</span>
          </div>
          <div className="absolute top-4 right-4 z-10">
            <span className="text-xs font-semibold text-brand-blue bg-brand-blue/10 px-3 py-1 rounded-full backdrop-blur-sm border border-brand-blue/20">{t("login.after").toUpperCase()}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────── PRICING ───────────────────── */
function PricingSection() {
  const { t } = useLanguage();

  const plans = [
    {
      nameKey: "landing.planExpressName", descKey: "landing.planExpressDesc",
      price: "49 000", popular: false, color: "default",
      features: ["Exterior wash", "Window cleaning", "Tire shine", "Up to 45 min", "Basic tracking"],
    },
    {
      nameKey: "landing.planPremiumName", descKey: "landing.planPremiumDesc",
      price: "99 000", popular: true, color: "blue",
      features: ["Full exterior + interior", "Deep vacuum", "Dashboard polish", "Before/After photos", "Live tracking", "Priority support"],
    },
    {
      nameKey: "landing.planEliteName", descKey: "landing.planEliteDesc",
      price: "199 000", popular: false, color: "purple",
      features: ["Full ceramic treatment", "Engine bay cleaning", "Leather conditioning", "Odor elimination", "Before/After photos", "Dedicated specialist", "AI car health report"],
    },
  ];

  const subscriptions = [
    { nameKey: "Starter", washes: 4, price: "159 000", savings: "20%", icon: <Droplets className="w-5 h-5" />, color: "default", perks: ["4 Express washes/month", "Schedule in advance", "Free rescheduling"] },
    { nameKey: "Pro", washes: 8, price: "299 000", savings: "35%", icon: <Star className="w-5 h-5" />, color: "blue", perks: ["8 Premium washes/month", "AI recommendations", "Priority booking", "Monthly car report"] },
    { nameKey: "Black", washes: 12, price: "499 000", savings: "50%", icon: <Award className="w-5 h-5" />, color: "purple", perks: ["Unlimited washes", "VIP specialists only", "Concierge support", "Elite detail included", "Black card"] },
  ];

  return (
    <section id="pricing" className="py-32 relative overflow-hidden bg-[#F8FAFF]">
      <GlowOrb x="50%" y="50%" color="#8B5CF6" size={600} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.7 }} className="text-center mb-20">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-blue mb-4">{t("nav.pricing")}</span>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">{t("landing.pricingTitle")}</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">{t("landing.pricingNoFees")}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, i) => (
            <motion.div key={plan.nameKey} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.23, 1, 0.32, 1] }} whileHover={{ y: -6 }}
              className={cn("relative rounded-3xl border p-7 transition-all duration-400 shadow-sm",
                plan.popular ? "bg-brand-blue/5 border-brand-blue/30 shadow-[0_0_60px_rgba(14,165,233,0.1)]" :
                plan.color === "purple" ? "bg-brand-purple/5 border-brand-purple/20" : "bg-white border-slate-200")}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-blue text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">{t("landing.mostPopular")}</span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-1">{t(plan.nameKey)}</h3>
                <p className="text-sm text-slate-400">{t(plan.descKey)}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                <span className="text-slate-400 text-sm ml-2">so'm</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Check className={cn("w-4 h-4 flex-shrink-0", plan.popular ? "text-brand-blue" : plan.color === "purple" ? "text-brand-purple" : "text-slate-400")} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/booking">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className={cn("w-full h-12 rounded-xl font-semibold text-sm transition-all",
                    plan.popular ? "bg-brand-blue text-white hover:bg-brand-blue/90 shadow-md" :
                    plan.color === "purple" ? "bg-brand-purple/10 text-brand-purple border border-brand-purple/30 hover:bg-brand-purple/20" :
                    "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200")}>
                  {t("landing.bookNowBtn")}
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}>
          <h3 className="text-2xl font-bold text-slate-900 text-center mb-8">{t("landing.subMonthlyTitle")}</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {subscriptions.map((sub, i) => (
              <motion.div key={sub.nameKey} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }} whileHover={{ y: -3 }}
                className={cn("relative rounded-2xl border p-5 transition-all shadow-sm",
                  sub.color === "blue" ? "bg-brand-blue/5 border-brand-blue/20" :
                  sub.color === "purple" ? "bg-brand-purple/5 border-brand-purple/20" : "bg-white border-slate-200")}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colorMap[sub.color])}>{sub.icon}</div>
                    <span className="font-bold text-slate-900">{sub.nameKey}</span>
                  </div>
                  <span className={cn("text-xs font-bold px-2 py-1 rounded-lg", colorMap[sub.color])}>{t("landing.subSave")} {sub.savings}</span>
                </div>
                <div className="text-2xl font-black text-slate-900 mb-1">{sub.price} <span className="text-sm font-normal text-slate-400">{t("landing.subPerMonth")}</span></div>
                <div className="text-xs text-slate-400 mb-4">{sub.washes} {t("landing.subWashes")}</div>
                <ul className="space-y-2">
                  {sub.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-slate-500">
                      <Check className="w-3 h-3 text-brand-blue flex-shrink-0" />{p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────── TESTIMONIALS ───────────────────── */
function TestimonialsSection() {
  const { t } = useLanguage();

  const testimonials = [
    { name: "Dilnoza Yusupova", role: "Marketing Director", avatar: "DY", text: "I booked during a meeting. By the time I walked out, my car was spotless. This is the future of car care.", rating: 5, location: "Tashkent" },
    { name: "Rustam Karimov", role: "Software Engineer", avatar: "RK", text: "The live tracking feature is insane. I could literally watch the washer navigate to my parking spot. 10/10.", rating: 5, location: "Almaty" },
    { name: "Aziz Toshmatov", role: "Entrepreneur", avatar: "AT", text: "Premium Black membership is worth every penny. VIP priority and my car is always immaculate.", rating: 5, location: "Dubai" },
    { name: "Nodira Rashidova", role: "Doctor", avatar: "NR", text: "As a busy doctor, time is everything. VISIT gives me back 2 hours a week. Life-changing app.", rating: 5, location: "Tashkent" },
  ];

  return (
    <section className="py-32 relative overflow-hidden bg-white">
      <GlowOrb x="30%" y="60%" color="#0EA5E9" size={400} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-blue mb-4">{t("landing.testimonialTitle")}</span>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">{t("landing.testimonialSub")}</h2>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {testimonials.map((item, i) => (
            <motion.div key={item.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }} whileHover={{ y: -4 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-blue/30 transition-all group shadow-sm hover:shadow-md">
              <Quote className="w-5 h-5 text-brand-blue/30 mb-4" />
              <p className="text-sm text-slate-500 leading-relaxed mb-5">"{item.text}"</p>
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: item.rating }).map((_, j) => (<Star key={j} className="w-3 h-3 text-yellow-400 fill-yellow-400" />))}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold">{item.avatar}</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 flex items-center gap-1">{item.name}<BadgeCheck className="w-3.5 h-3.5 text-brand-blue" /></div>
                  <div className="text-xs text-slate-400">{item.role} · {item.location}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── APP PREVIEW ───────────────────── */
function AppPreviewSection() {
  const { t } = useLanguage();

  const appFeatures = [
    { icon: <Smartphone className="w-5 h-5" />, text: "Native iOS & Android apps" },
    { icon: <Wifi className="w-5 h-5" />, text: "Telegram Mini App — no install needed" },
    { icon: <Bell className="w-5 h-5" />, text: "Push notifications with live updates" },
    { icon: <Lock className="w-5 h-5" />, text: "Biometric login & secure payments" },
  ];

  return (
    <section className="py-32 relative overflow-hidden bg-[#F8FAFF]">
      <GlowOrb x="70%" y="50%" color="#0EA5E9" size={500} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-blue mb-4">Mobile App</span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6">{t("landing.mobileTitle")}</h2>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed">{t("landing.mobileDesc")}</p>
            <div className="space-y-4 mb-8">
              {appFeatures.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }} className="flex items-center gap-3 text-slate-600">
                  <div className="w-9 h-9 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue flex-shrink-0">{item.icon}</div>
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </div>
            <div className="flex gap-3">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm">
                <span className="text-xl">🍎</span> App Store
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm shadow-sm">
                <span className="text-xl">🤖</span> Google Play
              </motion.button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} className="relative flex justify-center items-center h-[500px]">
            <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-8 top-8 w-52 rounded-3xl overflow-hidden border border-slate-200 shadow-xl" style={{ background: "#F8FAFF" }}>
              <div className="h-8 bg-slate-800 flex items-center justify-center"><div className="w-16 h-1 bg-white/20 rounded-full" /></div>
              <div className="p-3 space-y-2">
                <div className="h-28 rounded-xl bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 border border-brand-blue/10 flex items-center justify-center"><div className="text-4xl">🗺️</div></div>
                <div className="h-3 bg-slate-200 rounded" /><div className="h-3 bg-slate-100 rounded w-3/4" /><div className="h-8 rounded-lg bg-brand-blue/20" />
              </div>
            </motion.div>
            <motion.div animate={{ y: [5, -5, 5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="relative z-10 right-0 w-60 rounded-3xl overflow-hidden border border-slate-200 shadow-2xl" style={{ background: "#FFFFFF" }}>
              <div className="h-8 bg-slate-800 flex items-center justify-center"><div className="w-16 h-1 bg-white/20 rounded-full" /></div>
              <div className="p-4">
                <div className="text-xs text-slate-400 mb-1">Good morning, Aziz 👋</div>
                <div className="text-sm font-bold text-slate-900 mb-3">{t("common.bookWash")}?</div>
                <div className="h-32 rounded-2xl bg-gradient-to-br from-brand-blue/10 to-brand-purple/8 border border-brand-blue/10 flex items-center justify-center mb-3">
                  <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}><div className="text-5xl">🚗</div></motion.div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {["Express", "Premium", "Detail", "Eco"].map((s) => (
                    <div key={s} className="h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-slate-500">{s}</div>
                  ))}
                </div>
                <div className="h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white text-xs font-bold">{t("common.bookWash")} →</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── CTA ───────────────────── */
function CTASection() {
  const { t } = useLanguage();
  return (
    <section className="py-32 relative overflow-hidden bg-white">
      <GlowOrb x="50%" y="50%" color="#0EA5E9" size={700} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="bg-gradient-to-br from-brand-blue/8 to-brand-purple/5 border border-brand-blue/20 rounded-3xl p-12 md:p-16 shadow-xl">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
            <Droplets className="w-8 h-8 text-brand-blue" />
          </motion.div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-6">{t("landing.ctaTitle")}</h2>
          <p className="text-slate-500 text-lg mb-10 max-w-xl mx-auto">{t("landing.ctaSub")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking">
              <motion.button whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(14,165,233,0.4)" }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2.5 h-14 px-8 rounded-2xl bg-brand-blue text-white font-bold text-base shadow-lg">
                <Droplets className="w-5 h-5" />{t("landing.ctaBtn")}<ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link href="/telegram">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2.5 h-14 px-6 rounded-2xl bg-white border border-slate-200 text-slate-700 font-medium text-base hover:bg-slate-50 transition-all shadow-sm">
                <span className="text-xl">✈️</span>{t("landing.openTelegram")}
              </motion.button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" />{t("landing.noSubscription")}</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" />{t("landing.cancelAnytime")}</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" />{t("landing.satisfaction")}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────── FOOTER ───────────────────── */
function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-slate-200 py-16 bg-[#F8FAFF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-brand-blue" />
              </div>
              <span className="text-lg font-bold"><span className="text-slate-900">VISIT</span><span className="text-brand-blue">.</span></span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs mb-6">{t("landing.heroSub")}</p>
            <div className="flex gap-3">
              {["𝕏", "in", "📱", "✈️"].map((icon, i) => (
                <div key={i} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sm cursor-pointer hover:bg-slate-50 transition-all">{icon}</div>
              ))}
            </div>
          </div>
          {[
            { title: t("nav.product"), links: [t("nav.howItWorks"), t("nav.features"), t("nav.pricing"), "Subscriptions", "Telegram"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Press", "Contact"] },
            { title: "Legal", links: ["Privacy", "Terms", "Cookie Policy", "Licenses"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (<li key={link}><a href="#" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">{link}</a></li>))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-slate-400">© 2025 VISIT Technologies. All rights reserved.</span>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Built in</span><span>🇺🇿</span><span>Powered by</span><span className="text-brand-blue">Next.js</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ───────────────────── PAGE ───────────────────── */
export default function LandingPage() {
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <BeforeAfterSection />
      <PricingSection />
      <TestimonialsSection />
      <AppPreviewSection />
      <CTASection />
      <Footer />
    </main>
  );
}
