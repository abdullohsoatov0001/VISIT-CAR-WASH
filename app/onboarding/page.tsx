"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Navigation, CreditCard, Star, ChevronRight } from "lucide-react";
import { useLanguage, type Lang } from "@/lib/i18n";

type Slide = { icon: typeof Car; title: string; text: string };

const CONTENT: Record<Lang, { skip: string; next: string; start: string; slides: Slide[] }> = {
  ru: {
    skip: "Пропустить",
    next: "Далее",
    start: "Начать",
    slides: [
      { icon: Car, title: "Закажите мойку", text: "Выберите тариф и адрес — мойщик выезжает к вашей машине." },
      { icon: Navigation, title: "Следите вживую", text: "Видите на карте, где мойщик и через сколько он будет у вас." },
      { icon: CreditCard, title: "Платите как удобно", text: "Карта, Click, Payme или наличными — после мойки." },
      { icon: Star, title: "Оценивайте и копите бонусы", text: "Чем больше моек — тем выше скидки и уровень." },
    ],
  },
  en: {
    skip: "Skip",
    next: "Next",
    start: "Get started",
    slides: [
      { icon: Car, title: "Book a wash", text: "Pick a plan and address — a worker comes to your car." },
      { icon: Navigation, title: "Track live", text: "See on the map where the worker is and when they'll arrive." },
      { icon: CreditCard, title: "Pay your way", text: "Card, Click, Payme, or cash — right after the wash." },
      { icon: Star, title: "Rate and earn rewards", text: "More washes — bigger discounts and a higher tier." },
    ],
  },
  uz: {
    skip: "O'tkazib yuborish",
    next: "Keyingisi",
    start: "Boshlash",
    slides: [
      { icon: Car, title: "Yuvishga buyurtma bering", text: "Tarif va manzilni tanlang — mashinangizga mойщик keladi." },
      { icon: Navigation, title: "Jonli kuzatib boring", text: "Xaritada mойщикning qayerda ekanini va qachon yetib kelishini ko'rasiz." },
      { icon: CreditCard, title: "Qulay usulda to'lang", text: "Karta, Click, Payme yoki naqd — yuvishdan keyin." },
      { icon: Star, title: "Baholang va bonus to'plang", text: "Qancha ko'p yuvdirsangiz — chegirma va daraja shuncha yuqori." },
    ],
  },
};

const LANG_LABELS: Record<Lang, string> = { ru: "Рус", uz: "O'zb", en: "Eng" };

export default function OnboardingPage() {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const [step, setStep] = useState(0);
  const content = CONTENT[lang];
  const isLast = step === content.slides.length - 1;

  const finish = () => {
    localStorage.setItem("washgo_onboarded", "1");
    router.replace("/register");
  };

  const skip = () => {
    localStorage.setItem("washgo_onboarded", "1");
    router.replace("/login");
  };

  const Icon = content.slides[step].icon;

  return (
    <main className="min-h-screen bg-[#F8FAFF] flex flex-col">
      <div className="flex items-center justify-between p-5">
        <div className="flex gap-1.5">
          {(["ru", "uz", "en"] as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors ${
                lang === l ? "bg-brand-blue text-white border-brand-blue" : "text-slate-400 border-slate-200"
              }`}>
              {LANG_LABELS[l]}
            </button>
          ))}
        </div>
        <button onClick={skip} className="text-sm text-slate-400 font-medium">{content.skip}</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-brand-blue/10 flex items-center justify-center mb-8">
              <Icon className="w-10 h-10 text-brand-blue" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-3">{content.slides[step].title}</h1>
            <p className="text-slate-500 leading-relaxed max-w-xs">{content.slides[step].text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 pb-10">
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {content.slides.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-brand-blue" : "w-1.5 bg-slate-200"}`} />
          ))}
        </div>
        <button
          onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          className="w-full h-13 py-3.5 rounded-2xl bg-brand-blue text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/20">
          {isLast ? content.start : content.next}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </main>
  );
}
