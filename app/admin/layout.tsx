import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.user_metadata?.role ?? "USER";
  if (role !== "ADMIN") redirect("/dashboard");

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
