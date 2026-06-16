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
};

export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("profiles")
        .select("id, name, role, phone, avatar_url")
        .eq("id", user.id)
        .single();

      setProfile(data ? { ...data, email: user.email ?? "" } : null);
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
