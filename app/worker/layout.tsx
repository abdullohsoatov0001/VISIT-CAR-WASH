import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WorkerLayoutClient from "./WorkerLayoutClient";

export default async function WorkerLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role ?? "USER";
  if (role !== "WORKER" && role !== "ADMIN") redirect("/dashboard");

  return <WorkerLayoutClient>{children}</WorkerLayoutClient>;
}
