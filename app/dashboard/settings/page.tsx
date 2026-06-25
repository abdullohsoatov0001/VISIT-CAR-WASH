"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Shield, Globe, LogOut, ChevronRight, Save, X, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useUserContext } from "@/lib/context/UserContext";
import { getInitials, tierColors } from "@/lib/hooks/useUser";
import { createClient } from "@/lib/supabase/client";

export default function DashboardSettingsPage() {
  const { t, lang, setLang } = useLanguage();
  const { profile } = useUserContext();
  const router = useRouter();

  const [pushNotif, setPushNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!profile) return;
    setPushNotif(profile.push_notifications_enabled);
    setSmsNotif(profile.sms_notifications_enabled);
  }, [profile?.id]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ push_notifications_enabled: pushNotif, sms_notifications_enabled: smsNotif })
      .eq("id", profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (newPassword.length < 6) {
      setPasswordError("Пароль должен быть не короче 6 символов");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Пароли не совпадают");
      return;
    }
    setPasswordSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setPasswordSaved(true);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      setPasswordSaved(false);
      setShowPasswordModal(false);
    }, 1500);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "УДАЛИТЬ") return;
    setDeleting(true);
    setDeleteError("");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleteError(body.error ?? "Не удалось удалить аккаунт");
      setDeleting(false);
      return;
    }
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-brand-blue" : "bg-slate-200"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${value ? "left-5" : "left-0.5"}`} />
    </button>
  );

  const initials    = profile ? getInitials(profile.name) : "…";
  const displayName = profile?.name ?? "Загрузка…";
  const tierClass   = tierColors[profile?.loyalty_tier ?? "Bronze"] ?? tierColors.Bronze;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900">{t("dashboard.navSettings")}</h1>
        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-1.5 px-4 h-9 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${saved ? "bg-emerald-500 text-white" : "bg-brand-blue text-white hover:bg-brand-blue/90"}`}>
          <Save className="w-3.5 h-3.5" /> {saving ? "…" : saved ? t("common.done") : t("common.save")}
        </button>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-lg font-bold flex-shrink-0">{initials}</div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate">{displayName}</div>
            <div className="text-sm text-slate-400 truncate">{profile?.email ?? ""}</div>
            <div className={`inline-flex items-center gap-1 text-xs font-medium mt-1 px-2 py-0.5 rounded-lg border ${tierClass}`}>
              ⭐ {profile?.loyalty_tier ?? "Bronze"} Member
            </div>
          </div>
        </div>
        <button onClick={() => router.push("/dashboard/profile")}
          className="w-full h-10 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">{t("common.profile")}</button>
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
        <button onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100">
          <Shield className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-900 flex-1 text-left">Change Password</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </button>
        <button onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition-colors">
          <Trash2 className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-red-500 flex-1 text-left">Удалить аккаунт</span>
          <ChevronRight className="w-4 h-4 text-red-300" />
        </button>
      </motion.div>

      {/* Log out */}
      <button onClick={handleLogout}
        className="w-full h-11 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" /> {t("dashboard.navLogout")}
      </button>

      {/* Change password modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => !passwordSaving && setShowPasswordModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Смена пароля</h3>
                <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>
              {passwordSaved ? (
                <div className="text-center py-6 text-emerald-600 font-semibold text-sm">Пароль обновлён ✓</div>
              ) : (
                <div className="space-y-3">
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Новый пароль"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите пароль"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all" />
                  {passwordError && <div className="text-xs text-red-500">{passwordError}</div>}
                  <button onClick={handleChangePassword} disabled={passwordSaving}
                    className="w-full h-11 rounded-xl bg-brand-blue text-white font-semibold text-sm hover:bg-brand-blue/90 transition-all disabled:opacity-60">
                    {passwordSaving ? "Сохраняем…" : "Сохранить пароль"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete account modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-red-600">Удалить аккаунт</h3>
                <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-slate-500 mb-4">Это действие необратимо. Все ваши заказы, адреса и история будут удалены навсегда. Введите <b>УДАЛИТЬ</b>, чтобы подтвердить.</p>
              <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="УДАЛИТЬ"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-300 text-sm focus:outline-none focus:border-red-300 focus:bg-white transition-all mb-3" />
              {deleteError && <div className="text-xs text-red-500 mb-3">{deleteError}</div>}
              <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== "УДАЛИТЬ" || deleting}
                className="w-full h-11 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-all disabled:opacity-50">
                {deleting ? "Удаляем…" : "Удалить аккаунт навсегда"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
