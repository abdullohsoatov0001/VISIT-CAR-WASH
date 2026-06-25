"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Users, Car, DollarSign, TrendingUp,
  Bell, Settings, Shield, Droplets, Activity, Database, Cpu, Globe, LogOut, Menu, X, AlertOctagon
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { label: t("admin.overview"), icon: BarChart3, href: "/admin" },
    { label: t("admin.orders"), icon: Car, href: "/admin/orders" },
    { label: t("admin.users"), icon: Users, href: "/admin/users" },
    { label: t("admin.workers"), icon: Shield, href: "/admin/workers" },
    { label: t("admin.analytics"), icon: TrendingUp, href: "/admin/analytics" },
    { label: t("admin.alerts"), icon: Bell, href: "/admin/alerts" },
    { label: t("admin.payments"), icon: DollarSign, href: "/admin/payments" },
    { label: "Ошибки", icon: AlertOctagon, href: "/admin/errors" },
    { label: t("admin.settings"), icon: Settings, href: "/admin/settings" },
  ];

  const healthItems = [
    { key: "health_api", value: "42ms", Icon: Activity },
    { key: "health_db", value: "12ms", Icon: Database },
    { key: "health_socket", value: "1,247", Icon: Cpu },
    { key: "health_cdn", value: "99.98%", Icon: Globe },
  ];

  return (
    <aside className={`${mobile ? "w-full" : "w-60 hidden lg:flex"} flex-col bg-white border-r border-slate-200 p-4 h-screen sticky top-0 shadow-sm`}>
      {mobile ? (
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-brand-blue" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Wash<span className="text-brand-blue"> Go</span></div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t("admin.title")}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
      ) : (
        <Link href="/admin" className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-brand-blue" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Wash<span className="text-brand-blue"> Go</span></div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t("admin.title")}</div>
          </div>
        </Link>
      )}

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, icon: Icon, href }) => {
          const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} onClick={mobile ? onClose : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-brand-blue/10 text-brand-blue border border-brand-blue/20" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-200 flex-shrink-0">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">{t("admin.systemHealth")}</div>
        {healthItems.map(({ key, value, Icon }) => (
          <div key={key} className="flex items-center gap-2 px-2 py-1.5">
            <Icon className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs text-slate-400 flex-1">{t(`admin.${key}`)}</span>
            <span className="text-xs text-emerald-600 font-mono">{value}</span>
          </div>
        ))}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 mt-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all">
          <LogOut className="w-3.5 h-3.5" />
          {t("common.logout")}
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayoutClient({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex">
      <Sidebar />

      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenu(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute left-0 top-0 bottom-0 w-[min(80vw,288px)] z-10">
              <Sidebar mobile onClose={() => setMobileMenu(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileMenu(true)} className="text-slate-400 hover:text-slate-700 p-1 -ml-1">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-brand-blue" />
            <span className="text-sm font-bold text-slate-900">Wash<span className="text-brand-blue"> Go</span> <span className="text-slate-400 font-normal">{t("admin.title")}</span></span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
