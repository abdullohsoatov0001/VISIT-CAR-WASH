"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Phone, Mail, Car, Camera, Shield, Star,
  Award, Edit2, Check, ChevronRight, LogOut, Droplets, Plus, X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "@/lib/context/UserContext";
import { getInitials } from "@/lib/hooks/useUser";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  plate: string | null;
  color: string | null;
  is_default: boolean;
};

export default function DashboardProfilePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { profile } = useUserContext();

  const [editMode, setEditMode] = useState(false);
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddCar, setShowAddCar] = useState(false);
  const [newCar, setNewCar] = useState({ make: "", model: "", year: "", plate: "", color: "" });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile?.name, profile?.phone, profile?.avatar_url]);

  useEffect(() => {
    if (!profile) return;
    const supabase = createClient();
    supabase
      .from("vehicles")
      .select("id, make, model, year, plate, color, is_default")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setVehicles(data ?? []));
  }, [profile?.id]);

  const handleSave = async () => {
    if (!profile) return;
    const supabase = createClient();
    await supabase.from("profiles").update({ name: name.trim(), phone: phone.trim() || null }).eq("id", profile.id);
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAddCar = async () => {
    if (!profile || !newCar.make.trim() || !newCar.model.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("vehicles")
      .insert({
        user_id: profile.id,
        make: newCar.make.trim(),
        model: newCar.model.trim(),
        year: newCar.year ? Number(newCar.year) : null,
        plate: newCar.plate.trim() || null,
        color: newCar.color.trim() || null,
        is_default: vehicles.length === 0,
      })
      .select("id, make, model, year, plate, color, is_default")
      .single();

    if (data) setVehicles((prev) => [...prev, data]);
    setNewCar({ make: "", model: "", year: "", plate: "", color: "" });
    setShowAddCar(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploadingAvatar(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: urlWithCacheBust }).eq("id", profile.id);
      setAvatarUrl(urlWithCacheBust);
    }
    setUploadingAvatar(false);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (newPassword.length < 6) { setPasswordError("Пароль минимум 6 символов"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Пароли не совпадают"); return; }

    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) { setPasswordError(error.message || "Не удалось обновить пароль"); return; }

    setPasswordSaved(true);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => { setPasswordSaved(false); setShowPasswordModal(false); }, 1500);
  };

  const initials = profile ? getInitials(profile.name) : "…";
  const stats = [
    { icon: Droplets, label: "Total Washes",     value: String(profile?.total_washes ?? 0), color: "text-brand-blue",  bg: "bg-brand-blue/10 border-brand-blue/20" },
    { icon: Star,      label: "Loyalty Points",   value: String(profile?.loyalty_points ?? 0), color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200" },
    { icon: Award,     label: "Loyalty Level",    value: profile?.loyalty_tier ?? "Bronze",   color: "text-orange-500", bg: "bg-orange-50 border-orange-200" },
  ];

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
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-2xl font-black overflow-hidden">
              {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-white border border-slate-200 shadow flex items-center justify-center text-slate-500 hover:text-brand-blue transition-colors cursor-pointer">
              {uploadingAvatar ? <span className="w-3 h-3 border-2 border-slate-300 border-t-brand-blue rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-black text-slate-900">{profile?.name ?? "…"}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2.5 py-0.5 rounded-full font-semibold">⭐ {profile?.loyalty_tier ?? "Bronze"} Member</span>
            </div>
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
          { icon: User,  label: t("register.fullName"),   value: name,             setter: setName,  type: "text",  placeholder: "Aziz Toshmatov",      editable: true },
          { icon: Phone, label: t("login.phoneNumber"),    value: phone,            setter: setPhone, type: "tel",   placeholder: "+998 90 000 00 00",   editable: true },
          { icon: Mail,  label: t("login.email"),          value: profile?.email ?? "", setter: undefined, type: "email", placeholder: "", editable: false },
        ].map(({ icon: Icon, label, value, setter, type, placeholder, editable }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-slate-400 mb-0.5 uppercase tracking-wide">{label}</div>
              {editMode && editable ? (
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setter?.(e.target.value)}
                  placeholder={placeholder}
                  className="w-full text-sm font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20 transition-all"
                />
              ) : (
                <div className="text-sm font-medium text-slate-900">{value || "—"}</div>
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
          <button onClick={() => setShowAddCar(true)} className="text-xs text-brand-blue font-semibold hover:text-brand-blue/80 transition-colors">
            + {t("profile.addCar")}
          </button>
        </div>
        {vehicles.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-4">Машины пока не добавлены</div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${v.is_default ? "border-brand-blue/30 bg-brand-blue/5" : "border-slate-200 hover:border-slate-300"}`}>
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                  <Car className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900">{v.year ?? ""} {v.make} {v.model}</div>
                  <div className="text-xs text-slate-500">{[v.plate, v.color].filter(Boolean).join(" · ")}</div>
                </div>
                {v.is_default && (
                  <span className="text-[10px] bg-brand-blue/10 text-brand-blue border border-brand-blue/20 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                    {t("payment.default_")}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add car modal */}
      <AnimatePresence>
        {showAddCar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowAddCar(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900">{t("profile.addCar")}</h3>
                <button onClick={() => setShowAddCar(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={newCar.make} onChange={(e) => setNewCar({ ...newCar, make: e.target.value })}
                    placeholder="Марка" className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-blue/50" />
                  <input value={newCar.model} onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                    placeholder="Модель" className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-blue/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={newCar.year} onChange={(e) => setNewCar({ ...newCar, year: e.target.value })}
                    placeholder="Год" inputMode="numeric" className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-blue/50" />
                  <input value={newCar.color} onChange={(e) => setNewCar({ ...newCar, color: e.target.value })}
                    placeholder="Цвет" className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-blue/50" />
                </div>
                <input value={newCar.plate} onChange={(e) => setNewCar({ ...newCar, plate: e.target.value })}
                  placeholder="Госномер" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-blue/50" />
              </div>
              <button onClick={handleAddCar}
                className="w-full h-12 mt-5 rounded-xl bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue/90 transition-all shadow-md flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Добавить машину
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="text-sm font-bold text-slate-900 mb-3">{t("profile.security")}</div>
        <button onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group">
          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-slate-900">{t("profile.changePassword")}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
        </button>
      </motion.div>

      {/* Change password modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900">{t("profile.changePassword")}</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>

              {passwordSaved ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold py-4 justify-center">
                  <Check className="w-4 h-4" /> Пароль обновлён
                </div>
              ) : (
                <>
                  {passwordError && (
                    <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{passwordError}</div>
                  )}
                  <div className="space-y-3">
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Новый пароль (мин. 6 символов)"
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-blue/50" />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повторите пароль"
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-blue/50" />
                  </div>
                  <button onClick={handleChangePassword} disabled={savingPassword}
                    className="w-full h-12 mt-5 rounded-xl bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue/90 transition-all shadow-md disabled:opacity-60">
                    {savingPassword ? "Сохраняем…" : "Сохранить новый пароль"}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Danger zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-all">
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-semibold">{t("common.logout")}</span>
        </button>
      </motion.div>
    </div>
  );
}
