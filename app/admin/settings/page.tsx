"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Shield, Bell as BellIcon, Zap } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

type Settings = {
  new_order_alerts: boolean;
  fraud_alerts: boolean;
  auto_assign_workers: boolean;
  maintenance_mode: boolean;
};

export default function AdminSettingsPage() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<Settings>({
    new_order_alerts: true, fraud_alerts: true, auto_assign_workers: true, maintenance_mode: false,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("app_settings").select("*").eq("id", 1).single().then(({ data }) => {
      if (data) setSettings(data);
      setLoading(false);
    });
  }, []);

  const update = (key: keyof Settings, value: boolean) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const supabase = createClient();
    await supabase.from("app_settings").update(settings).eq("id", 1);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-brand-blue" : "bg-slate-200"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${value ? "left-5" : "left-0.5"}`} />
    </button>
  );

  const sections = [
    {
      icon: BellIcon,
      title: t("common.notifications"),
      items: [
        { label: "New order alerts",      desc: "Get notified for every new order",          value: settings.new_order_alerts, onChange: (v: boolean) => update("new_order_alerts", v) },
        { label: "Fraud detection alerts", desc: "Real-time suspicious activity alerts",      value: settings.fraud_alerts,      onChange: (v: boolean) => update("fraud_alerts", v) },
      ]
    },
    {
      icon: Zap,
      title: "Automation",
      items: [
        { label: "Auto-assign workers", desc: "Automatically assign nearest available worker", value: settings.auto_assign_workers, onChange: (v: boolean) => update("auto_assign_workers", v) },
        { label: "Maintenance mode",    desc: "Disable new bookings for maintenance",          value: settings.maintenance_mode,    onChange: (v: boolean) => update("maintenance_mode", v) },
      ]
    },
  ];

  return (
    <>
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-lg font-bold text-slate-900">{t("admin.settings")}</div>
          <div className="text-xs text-slate-400">System configuration</div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={loading}
            className={`flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-semibold transition-all ${saved ? "bg-emerald-500 text-white" : "bg-brand-blue text-white hover:bg-brand-blue/90"}`}>
            <Save className="w-4 h-4" /> {saved ? t("common.done") : t("common.save")}
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold">AD</div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-2xl">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <motion.div key={section.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-brand-blue" />
                <span className="font-bold text-slate-900 text-sm">{section.title}</span>
              </div>
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{item.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <Toggle value={item.value} onChange={item.onChange} />
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* System info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-brand-blue" />
            <span className="font-bold text-slate-900 text-sm">System Info</span>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Database", value: "Supabase (PostgreSQL)" },
              { label: "Framework", value: "Next.js 14" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-slate-400">{item.label}</span>
                <span className="text-slate-900 font-mono text-xs">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}
