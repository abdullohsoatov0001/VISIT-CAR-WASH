"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Phone, Mail, Car, Camera, Shield, Star,
  Award, Edit2, Check, ChevronRight, LogOut, Droplets
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const vehicles = [
  { id: 1, make: "Chevrolet", model: "Malibu", year: 2021, plate: "01 A 234 BC", color: "White", default: true },
  { id: 2, make: "Hyundai", model: "Tucson", year: 2019, plate: "01 B 567 DE", color: "Black", default: false },
];

const stats = [
  { icon: Droplets, label: "Total Washes", value: "24", color: "text-brand-blue", bg: "bg-brand-blue/10 border-brand-blue/20" },
  { icon: Star, label: "Avg Rating Given", value: "4.9", color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200" },
  { icon: Award, label: "Loyalty Level", value: "Gold", color: "text-orange-500", bg: "bg-orange-50 border-orange-200" },
];

export default function DashboardProfilePage() {
  const { t } = useLanguage();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("Aziz Toshmatov");
  const [phone, setPhone] = useState("+998 90 123 45 67");
  const [email, setEmail] = useState("aziz@example.com");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">{t("common.profile")}</h1>
          <p className="text-sm text-slate-400">{t("profile.subtitle")}</p>
        </div>
        {saved && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            <Check className="w-3.5 h-3.5" /> {t("profile.saved")}
          </motion.div>
        )}
      </div>

      {/* Avatar card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-2xl font-black">
              AT
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-white border border-slate-200 shadow flex items-center justify-center text-slate-500 hover:text-brand-blue transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-black text-slate-900">{name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2.5 py-0.5 rounded-full font-semibold">⭐ Gold Member</span>
            </div>
            <div className="text-xs text-slate-400 mt-1.5">{t("profile.memberSince")} March 2024</div>
          </div>
          <button
            onClick={() => editMode ? handleSave() : setEditMode(true)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${editMode ? "bg-brand-blue text-white border-brand-blue" : "bg-slate-100 text-slate-600 border-slate-200 hover:border-brand-blue hover:text-brand-blue"}`}>
            {editMode ? <><Check className="w-3.5 h-3.5" />{t("common.save")}</> : <><Edit2 className="w-3.5 h-3.5" />{t("profile.edit")}</>}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`border rounded-xl p-3 ${s.bg}`}>
                <Icon className={`w-4 h-4 mb-1.5 ${s.color}`} />
                <div className={`text-sm font-black ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-slate-500 leading-tight">{s.label}</div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Personal info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="text-sm font-bold text-slate-900">{t("profile.personalInfo")}</div>

        {[
          { icon: User, label: t("register.fullName"), value: name, setter: setName, type: "text", placeholder: "Aziz Toshmatov" },
          { icon: Phone, label: t("login.phoneNumber"), value: phone, setter: setPhone, type: "tel", placeholder: "+998 90 000 00 00" },
          { icon: Mail, label: t("login.email"), value: email, setter: setEmail, type: "email", placeholder: "you@example.com" },
        ].map(({ icon: Icon, label, value, setter, type, placeholder }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wide">{label}</div>
              {editMode ? (
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  className="w-full text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 transition-all"
                />
              ) : (
                <div className="text-sm font-medium text-slate-900">{value}</div>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Vehicles */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold text-slate-900">{t("profile.myCars")}</div>
          <button className="text-xs text-brand-blue font-semibold hover:text-brand-blue/80 transition-colors">
            + {t("profile.addCar")}
          </button>
        </div>
        <div className="space-y-3">
          {vehicles.map((v, i) => (
            <motion.div key={v.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${v.default ? "border-brand-blue/30 bg-brand-blue/5" : "border-slate-200 hover:border-slate-300"}`}>
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                <Car className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900">{v.year} {v.make} {v.model}</div>
                <div className="text-xs text-slate-500">{v.plate} · {v.color}</div>
              </div>
              {v.default && (
                <span className="text-[10px] bg-brand-blue/10 text-brand-blue border border-brand-blue/20 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                  {t("payment.default_")}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="text-sm font-bold text-slate-900 mb-3">{t("profile.security")}</div>
        {[
          { icon: Shield, label: t("profile.changePassword"), sub: t("profile.lastChanged") + " 45 days ago", danger: false },
          { icon: Phone, label: t("profile.twoFactor"), sub: t("profile.twoFactorSub"), danger: false },
        ].map(({ icon: Icon, label, sub }) => (
          <button key={label} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-slate-900">{label}</div>
              <div className="text-xs text-slate-400">{sub}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </button>
        ))}
      </motion.div>

      {/* Danger zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-all">
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-semibold">{t("common.logout")}</span>
        </button>
      </motion.div>
    </div>
  );
}
