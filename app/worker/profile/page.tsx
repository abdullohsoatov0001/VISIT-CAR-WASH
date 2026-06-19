"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Phone, Mail, Save, Check, AlertCircle, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserContext } from "@/lib/context/UserContext";
import { getInitials } from "@/lib/hooks/useUser";
import { useRouter } from "next/navigation";

export default function WorkerProfilePage() {
  const { profile, loading } = useUserContext();
  const router = useRouter();

  const [name, setName]     = useState("");
  const [phone, setPhone]   = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.id) return;
    setError(""); setSaving(true);

    const supabase = createClient();
    const { error: err } = await supabase
      .from("profiles")
      .update({ name: name.trim(), phone: phone.trim() || null })
      .eq("id", profile.id);

    setSaving(false);
    if (err) { setError(err.message); return; }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    if (profile?.id) {
      await supabase.from("profiles").update({ is_active: false }).eq("id", profile.id);
    }
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {[1,2,3].map(i => <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 h-20 animate-pulse" />)}
      </div>
    );
  }

  const initials = profile ? getInitials(profile.name) : "…";

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">

      {/* Avatar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xl font-black mx-auto mb-3">
          {initials}
        </div>
        <div className="font-bold text-slate-900">{profile?.name}</div>
        <div className="text-sm text-slate-400">{profile?.email}</div>
        <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
          <span className="text-xs font-semibold text-brand-blue">Мойщик</span>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="text-sm font-bold text-slate-900 mb-2">Редактировать профиль</div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Имя</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ваше имя"
              className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all" />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Телефон</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+998901234567"
              className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-brand-blue/50 focus:bg-white transition-all" />
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="email" value={profile?.email ?? ""} disabled
              className="w-full h-11 pl-10 pr-4 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 text-sm cursor-not-allowed" />
          </div>
          <p className="text-xs text-slate-400 mt-1">Email изменить нельзя</p>
        </div>

        <motion.button onClick={handleSave} disabled={saving || saved}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className="w-full h-11 rounded-xl bg-brand-blue text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm">
          {saved
            ? <><Check className="w-4 h-4" /> Сохранено</>
            : saving
              ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Сохраняем…</>
              : <><Save className="w-4 h-4" /> Сохранить</>
          }
        </motion.button>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full h-11 rounded-xl bg-red-50 border border-red-200 text-red-500 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-all">
        <LogOut className="w-4 h-4" /> Выйти из аккаунта
      </button>

    </div>
  );
}
