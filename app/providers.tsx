"use client";

import { LanguageProvider } from "@/lib/i18n";
import ErrorLogger from "@/components/ErrorLogger";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ErrorLogger />
      {children}
    </LanguageProvider>
  );
}
