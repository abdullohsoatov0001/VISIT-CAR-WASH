"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Car, Wallet, BarChart3, Award, LogOut, Droplets } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { UserProvider, useUserContext } from "@/lib/context/UserContext";
import { getInitials } from "@/lib/hooks/useUser";

function WorkerContent({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router   = useRouter();
  const { profile } = useUserContext();

  const handleLogout = async () => {
    const supabase = createClient();
    // Set worker offline before logout
    if (profile?.id) {
      await supabase.from("profiles").update({ is_active: false }).eq("id", profile.id);
    }
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { key: "orders",   icon: Car,      label: t("worker.navOrders"),   href: "/worker" },
    { key: "earnings", icon: Wallet,   label: t("worker.navEarnings"), href: "/worker/earnings" },
    { key: "stats",    icon: BarChart3,label: t("worker.navStats"),    href: "/worker/stats" },
    { key: "profile",  icon: Award,    label: t("worker.navProfile"),  href: "/worker/profile" },
  ];

  const initials    = profile ? getInitials(profile.name) : "…";
  const displayName = profile?.name ?? "Загрузка…";

  return (
    <div className="min-h-screen bg-[#F8FAFF] pb-20">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
            <Droplets className="w-3.5 h-3.5 text-brand-blue" />
          </div>
          <span className="text-sm font-bold text-slate-900">
            Wash<span className="text-brand-blue"> Go</span>{" "}
            <span className="text-slate-400 font-normal">Worker</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Worker badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-blue/10 border border-brand-blue/20 rounded-xl">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white text-[9px] font-bold">
              {initials}
            </div>
            <span className="text-xs font-semibold text-brand-blue truncate max-w-[80px]">{displayName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-transparent hover:border-red-100 transition-all">
            <LogOut className="w-3.5 h-3.5" />
            {t("common.logout")}
          </button>
        </div>
      </div>

      {children}

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-lg z-40">
        <div className="flex max-w-lg mx-auto">
          {navItems.map(({ key, icon: Icon, label, href }) => {
            const isActive = pathname === href || (href !== "/worker" && pathname.startsWith(href));
            return (
              <Link key={key} href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${isActive ? "text-brand-blue" : "text-slate-400 hover:text-slate-600"}`}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function WorkerLayoutClient({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <WorkerContent>{children}</WorkerContent>
    </UserProvider>
  );
}
