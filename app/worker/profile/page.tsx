"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Award, Camera, Shield, Bell, Globe, ChevronRight, Save, LogOut, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const badges = [
  { icon: "⚡", label: "Speed King", desc: "Fastest avg time" },
  { icon: "⭐", label: "5-Star Pro", desc: "50+ five-star ratings" },
  { icon: "🔥", label: "12-Day Streak", desc: "Active 12 days running" },
  { icon: "💎", label: "Top Earner", desc: "Top 10% this month" },
];

export default function WorkerProfilePage() {
  const { t, lang, setLang } = useLanguage();
  const [pushNotif, setPushNotif] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-brand-blue" : "bg-slate-200"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${value ? "left-5" : "left-0.5"}`} />
    </button>
  );

  return (
    <>
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-slate-900">{t("worker.navProfile")}</h1>
          </div>
          <button onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold transition-all ${saved ? "bg-emerald-500 text-white" : "bg-brand-blue text-white hover:bg-brand-blue/90"}`}>
            {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? t("common.done") : t("common.save")}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Avatar + info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-5 mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xl font-bold">NT</div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-slate-900 border-2 border-white flex items-center justify-center">
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
            <div>
              <div className="text-lg font-black text-slate-900">Nodir Toshev</div>
              <div className="flex items-center gap-1.5 text-sm">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-slate-700">4.9</span>
                <span className="text-slate-400">· 88 {t("admin.totalOrders")}</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Worker since Jan 2026</div>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: t("register.fullName"), value: "Nodir Toshev" },
              { label: t("login.phone"), value: "+998 90 123 45 67" },
              { label: "Zone", value: "Yunusobod, Chilonzor" },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">{f.label}</label>
                <input defaultValue={f.value}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-brand-blue/50 transition-all" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-bold text-slate-900">Badges</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((b, i) => (
              <motion.div key={b.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 + 0.1 }}
                className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">{b.label}</div>
                  <div className="text-[10px] text-slate-400">{b.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-brand-blue" />
            <span className="text-sm font-bold text-slate-900">{t("common.notifications")}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900">Push notifications</div>
              <div className="text-xs text-slate-400">New orders, messages</div>
            </div>
            <Toggle value={pushNotif} onChange={setPushNotif} />
          </div>
        </motion.div>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-brand-blue" />
            <span className="text-sm font-bold text-slate-900">Language</span>
          </div>
          <div className="flex gap-2">
            {[{ code: "ru", label: "РУ", flag: "🇷🇺" }, { code: "uz", label: "UZ", flag: "🇺🇿" }, { code: "en", label: "EN", flag: "🇬🇧" }].map(l => (
              <button key={l.code} onClick={() => setLang(l.code as "en" | "ru" | "uz")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${lang === l.code ? "bg-brand-blue/10 border-brand-blue/30 text-brand-blue" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}>
                {l.flag} {l.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Security links */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {["Change Password", "Privacy Settings"].map((item) => (
            <button key={item} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-900 flex-1 text-left">{item}</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          ))}
        </motion.div>

        <button className="w-full h-11 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" /> {t("dashboard.navLogout")}
        </button>
      </div>
    </>
  );
}
