"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Plus, Navigation, History, CreditCard, Gift,
  Settings, Droplets, Menu, X, Bell, User, LogOut
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/hooks/useUser";
import { UserProvider, useUserContext } from "@/lib/context/UserContext";
import RatingPopup from "@/components/RatingPopup";

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router   = useRouter();
  const { profile } = useUserContext();

  const navItems = [
    { icon: Home,       label: t("dashboard.navDashboard"), href: "/dashboard" },
    { icon: Plus,       label: t("dashboard.navBook"),      href: "/booking" },
    { icon: Navigation, label: t("dashboard.navTracking"),  href: "/dashboard/tracking" },
    { icon: History,    label: t("dashboard.navHistory"),   href: "/dashboard/history" },
    { icon: CreditCard, label: t("dashboard.navPayments"),  href: "/dashboard/payment" },
    { icon: Gift,       label: t("dashboard.navRewards"),   href: "/dashboard/rewards" },
    { icon: Settings,   label: t("dashboard.navSettings"),  href: "/dashboard/settings" },
  ];

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initials    = profile ? getInitials(profile.name) : "…";
  const displayName = profile?.name ?? "Загрузка…";

  return (
    <aside className={`${mobile ? "w-full" : "w-64 hidden lg:flex"} flex-col bg-white border-r border-slate-200 p-5 h-screen sticky top-0`}>
      {mobile ? (
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-brand-blue" />
            <span className="font-bold text-slate-900">Wash<span className="text-brand-blue"> Go</span></span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
      ) : (
        <Link href="/" className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-brand-blue" />
          </div>
          <span className="text-base font-bold text-slate-900">Wash<span className="text-brand-blue"> Go</span></span>
        </Link>
      )}

      <nav className="flex-1 space-y-1">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href || (href !== "/dashboard" && href !== "/booking" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} onClick={mobile ? onClose : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-brand-blue/10 text-brand-blue border border-brand-blue/20" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}

        <Link href="/dashboard/notifications" onClick={mobile ? onClose : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${pathname === "/dashboard/notifications" ? "bg-brand-blue/10 text-brand-blue border border-brand-blue/20" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}>
          <Bell className="w-4 h-4" />
          {t("common.notifications")}
        </Link>
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-200 space-y-1">
        <Link href="/dashboard/profile" onClick={mobile ? onClose : undefined}
          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === "/dashboard/profile" ? "bg-brand-blue/10 text-brand-blue border border-brand-blue/20" : "hover:bg-slate-50"}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">{displayName}</div>
            <div className="text-xs text-slate-400">{profile?.email ?? ""}</div>
          </div>
          <User className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
          <LogOut className="w-4 h-4" />
          {t("common.logout")}
        </button>
      </div>
    </aside>
  );
}

function DashboardContent({ children }: { children: ReactNode }) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const { profile } = useUserContext();

  const initials = profile ? getInitials(profile.name) : "…";

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

      <main className="flex-1 overflow-auto">
        <div className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => setMobileMenu(true)} className="text-slate-400 hover:text-slate-700 p-1 -ml-1 mr-3">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-brand-blue" />
              <span className="text-sm font-bold text-slate-900">Wash<span className="text-brand-blue"> Go</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/notifications"
              className="relative w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all">
              <Bell className="w-4 h-4" />
            </Link>
            <Link href="/dashboard/profile"
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </Link>
          </div>
        </div>
        {children}
      </main>

      <RatingPopup />
    </div>
  );
}

export default function DashboardLayoutClient({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <DashboardContent>{children}</DashboardContent>
    </UserProvider>
  );
}
