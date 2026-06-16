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

    // Listen for auth changes (login/logout)
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
