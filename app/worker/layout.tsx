import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WorkerLayoutClient from "./WorkerLayoutClient";

export default async function WorkerLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const role = user.user_metadata?.role ?? "USER";
  if (role !== "WORKER" && role !== "ADMIN") redirect("/dashboard");

  return <WorkerLayoutClient>{children}</WorkerLayoutClient>;
}
