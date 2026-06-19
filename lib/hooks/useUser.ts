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
