"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Shield, Globe, LogOut, ChevronRight, Save } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function DashboardSettingsPage() {
  const { t, lang, setLang } = useLanguage();
  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
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
    <div className="p-4 sm:p-6 space-y-5 max-w-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900">{t("dashboard.navSettings")}</h1>
        <button onClick={handleSave}
          className={`flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold transition-all ${saved ? "bg-emerald-500 text-white" : "bg-brand-blue text-white hover:bg-brand-blue/90"}`}>
          <Save className="w-3.5 h-3.5" /> {saved ? t("common.done") : t("common.save")}
        </button>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-lg font-bold">AT</div>
          <div>
            <div className="font-bold text-slate-900">Aziz Toshmatov</div>
            <div className="text-sm text-slate-400">aziz@mail.com</div>
            <div className="text-xs text-yellow-500 font-medium mt-0.5">⭐ Gold Member</div>
          </div>
        </div>
        <button className="w-full h-10 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">{t("common.profile")}</button>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-brand-blue" />
          <span className="font-bold text-slate-900 text-sm">{t("common.notifications")}</span>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900">Push notifications</div>
              <div className="text-xs text-slate-400">Order updates, ETA alerts</div>
            </div>
            <Toggle value={pushNotif} onChange={setPushNotif} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900">SMS notifications</div>
              <div className="text-xs text-slate-400">Booking confirmations</div>
            </div>
            <Toggle value={smsNotif} onChange={setSmsNotif} />
          </div>
        </div>
      </motion.div>

      {/* Language */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-brand-blue" />
          <span className="font-bold text-slate-900 text-sm">Language</span>
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

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {[
          { icon: Shield, label: "Change Password" },
          { icon: Shield, label: "Privacy Settings" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <button key={item.label} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
              <Icon className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-900 flex-1 text-left">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          );
        })}
      </motion.div>

      {/* Log out */}
      <button className="w-full h-11 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" /> {t("dashboard.navLogout")}
      </button>
    </div>
  );
}
