"use client";

import { useEffect } from "react";
import { logError } from "@/lib/errorLog";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logError(error.message, error.stack);
  }, [error]);

  return (
    <html lang="ru">
      <body className="bg-[#F8FAFF] text-slate-900 antialiased min-h-screen flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm text-center shadow-sm">
          <div className="text-3xl mb-3">⚠️</div>
          <h2 className="font-bold text-lg mb-2">Что-то пошло не так</h2>
          <p className="text-sm text-slate-400 mb-6">Мы уже знаем об ошибке. Попробуйте обновить страницу.</p>
          <button onClick={reset}
            className="px-6 py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold shadow-md hover:bg-brand-blue/90 transition-all">
            Обновить
          </button>
        </div>
      </body>
    </html>
  );
}
