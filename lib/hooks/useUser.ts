"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type UserProfile = {
  id: string;
  name: string;
  role: "USER" | "WORKER" | "ADMIN";
  phone: string | null;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
  loyalty_points: number;
  loyalty_tier: string;
  total_washes: number;
  total_spent: number;
};

export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("profiles")
        .select("id, name, role, phone, avatar_url, is_active, loyalty_points, loyalty_tier, total_washes, total_spent")
        .eq("id", user.id)
        .single();

      setProfile(data ? {
        ...data,
        email:          user.email ?? "",
        is_active:      data.is_active      ?? false,
        loyalty_points: data.loyalty_points ?? 0,
        loyalty_tier:   data.loyalty_tier   ?? "Bronze",
        total_washes:   data.total_washes   ?? 0,
        total_spent:    data.total_spent    ?? 0,
      } : null);
      setLoading(false);
    }

    load();
  }, []);

  return { profile, loading };
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function roleRedirect(role: string): string {
  if (role === "WORKER") return "/worker";
  if (role === "ADMIN")  return "/admin";
  return "/dashboard";
}

export const tierColors: Record<string, string> = {
  Bronze:   "bg-orange-50 text-orange-600 border-orange-200",
  Silver:   "bg-slate-100 text-slate-600 border-slate-300",
  Gold:     "bg-yellow-50 text-yellow-600 border-yellow-200",
  Platinum: "bg-purple-50 text-purple-600 border-purple-200",
  Elite:    "bg-gradient-to-r from-brand-blue/10 to-brand-purple/10 text-brand-blue border-brand-blue/20",
};

export function getLoyaltyInfo(points: number) {
  if (points >= 5000) return { next: "Elite",    toNext: Math.max(0, 10000 - points), progress: Math.min(100, (points - 5000) / 50) };
  if (points >= 2500) return { next: "Platinum", toNext: 5000  - points, progress: (points - 2500) / 25 };
  if (points >= 1000) return { next: "Gold",     toNext: 2500  - points, progress: (points - 1000) / 15 };
  return                     { next: "Silver",   toNext: 1000  - points, progress: points / 10 };
}
