"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Droplets, BarChart3, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void; expand: () => void;
        setHeaderColor: (c: string) => void; setBackgroundColor: (c: string) => void;
        initData: string;
        initDataUnsafe?: { user?: { id: number; first_name?: string } };
      };
    };
  }
}

type Tile = { label: string; value: string; accent?: boolean };
type Stats = { connected: boolean; name?: string; roleLabel?: string; tiles?: Tile[] };

export default function TelegramStatsApp() {
  const [state, setState] = useState<"loading" | "ok" | "notConnected" | "error">("loading");
  const [data, setData] = useState<Stats | null>(null);

  async function load(initData: string) {
    setState("loading");
    try {
      const res = await fetch("/api/telegram/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      if (!res.ok) { setState("error"); return; }
      const j = (await res.json()) as Stats;
      if (!j.connected) { setState("notConnected"); return; }
      setData(j);
      setState("ok");
    } catch {
      setState("error");
    }
  }

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => {
      const tg = window.Telegram?.WebApp;
      if (!tg) { setState("error"); return; }
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#0EA5E9");
      tg.setBackgroundColor("#F0F7FF");
      load(tg.initData || "");
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const refresh = () => {
    const tg = window.Telegram?.WebApp;
    load(tg?.initData || "");
  };

  return (
    <main className="min-h-screen bg-[#F0F7FF] px-4 py-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-brand-blue" />
            </div>
            <span className="font-bold text-slate-900">Wash<span className="text-brand-blue"> Go</span></span>
          </div>
          {state === "ok" && (
            <button onClick={refresh} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-blue transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {state === "loading" && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mb-3" />
            Загружаем статистику…
          </div>
        )}

        {state === "notConnected" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm mt-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-2xl">👋</div>
            <div className="font-bold text-slate-900 mb-1">Аккаунт не привязан</div>
            <p className="text-sm text-slate-500">Откройте бота и нажмите «Поделиться номером», чтобы войти — тогда здесь появится ваша статистика.</p>
          </div>
        )}

        {state === "error" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm mt-8">
            <div className="font-bold text-slate-900 mb-1">Не удалось загрузить</div>
            <p className="text-sm text-slate-500 mb-4">Откройте эту страницу из Telegram-бота.</p>
            <button onClick={refresh} className="text-sm font-semibold text-brand-blue">Повторить</button>
          </div>
        )}

        {state === "ok" && data && (
          <>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-brand-blue to-brand-purple rounded-2xl p-5 text-white shadow-lg mb-4">
              <div className="flex items-center gap-2 text-xs opacity-80 mb-1">
                <BarChart3 className="w-3.5 h-3.5" /> Моя статистика
              </div>
              <div className="text-xl font-black">{data.name}</div>
              <div className="text-sm opacity-90">{data.roleLabel}</div>
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              {(data.tiles ?? []).map((tl, i) => (
                <motion.div key={tl.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl p-4 border shadow-sm ${tl.accent ? "bg-brand-blue/10 border-brand-blue/20" : "bg-white border-slate-200"}`}>
                  <div className={`text-2xl font-black ${tl.accent ? "text-brand-blue" : "text-slate-900"}`}>{tl.value}</div>
                  <div className="text-xs text-slate-400 mt-1">{tl.label}</div>
                </motion.div>
              ))}
            </div>

            <p className="text-center text-xs text-slate-400 mt-6">Данные обновляются в реальном времени · нажмите ⟳</p>
          </>
        )}
      </div>
    </main>
  );
}
