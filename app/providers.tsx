"use client";

import { LanguageProvider } from "@/lib/i18n";
import ErrorLogger from "@/components/ErrorLogger";
import PushInit from "@/components/PushInit";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ErrorLogger />
      <PushInit />
      {children}
    </LanguageProvider>
  );
}
