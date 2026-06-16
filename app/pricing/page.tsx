"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Zap, Star, Award, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useLanguage } from "@/lib/i18n";

const plans = [
  {
    id: "starter",
    name: "Starter",
    icon: <Zap className="w-5 h-5" />,
    monthlyPrice: 159000,
    annualPrice: 127200,
    washes: 4,
    type: "Express Washes",
    color: "default",
    perks: [
      "4 Express washes per month",
      "Schedule up to 7 days in advance",
      "Free rescheduling (24h notice)",
      "Real-time GPS tracking",
      "Basic notifications",
      "Email support",
    ],
    notIncluded: ["Priority booking", "AI recommendations", "Car health report", "VIP specialist"],
  },
  {
    id: "pro",
    name: "Pro",
    icon: <Star className="w-5 h-5" />,
    monthlyPrice: 299000,
    annualPrice: 239200,
    washes: 8,
    type: "Premium Washes",
    color: "blue",
    popular: true,
    perks: [
      "8 Premium washes per month",
      "Schedule up to 30 days in advance",
      "Free rescheduling (anytime)",
      "Priority booking (15 min guarantee)",
      "AI wash recommendations",
      "Monthly car health report",
      "Before & after photos",
      "Priority chat support",
    ],
    notIncluded: ["VIP specialist only", "Black card"],
  },
  {
    id: "black",
    name: "Black",
    icon: <Award className="w-5 h-5" />,
    monthlyPrice: 499000,
    annualPrice: 399200,
    washes: "∞",
    type: "Unlimited Washes",
    color: "purple",
    perks: [
      "Unlimited washes (any service)",
      "VIP top-rated specialists only",
      "Instant booking (< 5 min response)",
      "Personal wash concierge",
      "AI health analytics dashboard",
      "Quarterly ceramic treatment",
      "Black membership card",
      "24/7 priority phone support",
      "Exclusive member events",
    ],
    notIncluded: [],
  },
];

const faqs = [
  { q: "Can I cancel my subscription anytime?", a: "Yes, you can cancel anytime from your account settings. Your plan remains active until the end of the current billing period." },
  { q: "What happens if I don't use all my washes?", a: "Unused washes expire at the end of each month. We recommend scheduling your washes in advance to make the most of your plan." },
  { q: "Can I upgrade or downgrade my plan?", a: "Absolutely. You can switch plans at any time. Upgrades take effect immediately; downgrades apply at the next billing cycle." },
  { q: "What payment methods are accepted?", a: "We accept Click, Payme, Humo, UzCard, and all major credit/debit cards. Monthly auto-renewal is supported for all methods." },
  { q: "Is there a contract or minimum commitment?", a: "No contracts. All plans are month-to-month (or annual for savings). Cancel with one click, no questions asked." },
];

const colorBtn: Record<string, string> = {
  default: "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
  blue: "bg-brand-blue text-white hover:bg-brand-blue-dark border-brand-blue",
  purple: "bg-brand-purple text-white hover:bg-brand-purple/80 border-brand-purple",
};

const colorBorder: Record<string, string> = {
  default: "border-slate-200 bg-white",
  blue: "border-brand-blue/30 bg-brand-blue/5 shadow-[0_0_60px_rgba(14,165,233,0.08)]",
  purple: "border-brand-purple/30 bg-brand-purple/5 shadow-[0_0_60px_rgba(139,92,246,0.08)]",
};

const colorCheck: Record<string, string> = {
  default: "text-slate-400",
  blue: "text-brand-blue",
  purple: "text-brand-purple",
};

export default function PricingPage() {
  const { t } = useLanguage();
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="text-center mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-blue mb-4">Pricing</span>
          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 mb-4">
            {t("pricing.title").split(",")[0]},{" "}
            <span className="gradient-text">{t("pricing.title").split(",")[1]?.trim() || "pricing"}</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
            {t("pricing.subtitle")}
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
            <button onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${!annual ? "bg-brand-blue text-white shadow-sm" : "text-slate-400 hover:text-slate-700"}`}>
              {t("pricing.monthly")}
            </button>
            <button onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${annual ? "bg-brand-blue text-white shadow-sm" : "text-slate-400 hover:text-slate-700"}`}>
              {t("pricing.annual")}
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t("pricing.savePercent")}</span>
            </button>
          </div>
        </motion.div>

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {plans.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ y: -6 }}
              className={`relative rounded-3xl border p-7 transition-all duration-400 shadow-sm ${colorBorder[plan.color]}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-blue text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-md">{t("pricing.mostPopular")}</span>
                </div>
              )}

              <div className="mb-6">
                <div className={`w-10 h-10 rounded-xl border mb-4 flex items-center justify-center ${
                  plan.color === "blue" ? "bg-brand-blue/10 border-brand-blue/20 text-brand-blue" :
                  plan.color === "purple" ? "bg-brand-purple/10 border-brand-purple/20 text-brand-purple" :
                  "bg-slate-100 border-slate-200 text-slate-500"
                }`}>
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-400">{plan.washes} {plan.type}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">
                    {((annual ? plan.annualPrice : plan.monthlyPrice) / 1000).toFixed(0)}K
                  </span>
                  <span className="text-slate-400 text-sm">so'm / mo</span>
                </div>
                {annual && (
                  <div className="text-xs text-emerald-600 mt-1">
                    Save {((plan.monthlyPrice - plan.annualPrice) * 12 / 1000).toFixed(0)}K/year
                  </div>
                )}
              </div>

              <ul className="space-y-2.5 mb-8">
                {plan.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colorCheck[plan.color]}`} />
                    {p}
                  </li>
                ))}
                {plan.notIncluded.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-slate-300 line-through">
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-200" />
                    {p}
                  </li>
                ))}
              </ul>

              <Link href="/booking">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className={`w-full h-12 rounded-xl font-semibold text-sm border transition-all ${colorBtn[plan.color]}`}>
                  {t("pricing.getStarted")}
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* One-time services */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="mb-20">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-8">{t("pricing.oneTime")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Express Wash", price: "49 000", icon: "⚡", time: "~30 min" },
              { name: "Premium Wash", price: "99 000", icon: "✨", time: "~60 min" },
              { name: "Elite Detail", price: "199 000", icon: "💎", time: "~2 hrs" },
              { name: "Eco Wash", price: "59 000", icon: "🌿", time: "~45 min" },
            ].map((s, i) => (
              <motion.div key={s.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-brand-blue/30 hover:shadow-md transition-all cursor-pointer group shadow-sm">
                <span className="text-2xl mb-3 block">{s.icon}</span>
                <div className="font-bold text-slate-900 text-sm mb-1 group-hover:text-brand-blue transition-colors">{s.name}</div>
                <div className="text-xs text-slate-400 mb-3">{s.time}</div>
                <div className="text-xl font-black text-slate-900">{s.price}<span className="text-xs font-normal text-slate-400"> so'm</span></div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6 }} className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 text-center mb-8">{t("pricing.faqTitle")}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-all">
                  <span className="font-medium text-slate-900 text-sm pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-brand-blue flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-5 pb-5 text-sm text-slate-500 leading-relaxed border-t border-slate-100" style={{ paddingTop: 16 }}>
                    {faq.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
