"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { type UserProfile } from "@/lib/hooks/useUser";

type UserContextType = {
  profile: UserProfile | null;
  loading: boolean;
};

const UserContext = createContext<UserContextType>({ profile: null, loading: true });

export function UserProvider({ children }: { children: ReactNode }) {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ profile, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  return useContext(UserContext);
}
