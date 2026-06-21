"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertOctagon, Trash2, X, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ErrorLog = {
  id: string;
  message: string;
  stack: string | null;
  url: string | null;
  user_agent: string | null;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminErrorsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ErrorLog | null>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("error_logs")
      .select("id, message, stack, url, user_agent, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const clearAll = async () => {
    if (!confirm("Удалить все записи журнала ошибок?")) return;
    const supabase = createClient();
    await supabase.from("error_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setLogs([]);
  };

  return (
    <>
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-lg font-bold text-slate-900">Журнал ошибок</div>
          <div className="text-xs text-slate-400">{logs.length} записей за последнее время</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          {logs.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-red-50 border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-100 transition-all">
              <Trash2 className="w-3.5 h-3.5" /> Очистить
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-white border border-slate-200 rounded-2xl h-16 animate-pulse" />)}</div>
        ) : logs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <AlertOctagon className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
            <div className="font-bold text-slate-900 mb-1">Ошибок не зафиксировано</div>
            <div className="text-sm text-slate-400">Здесь появятся ошибки клиентского приложения, если они возникнут</div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
            {logs.map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                onClick={() => setSelected(log)}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                  <AlertOctagon className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{log.message}</div>
                  <div className="text-xs text-slate-400 truncate">{log.url ?? "—"}</div>
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0">{formatDate(log.created_at)}</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Детали ошибки</h3>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3 text-sm">
                <div><span className="text-slate-400 block mb-1">Сообщение</span><span className="font-medium text-slate-900">{selected.message}</span></div>
                <div><span className="text-slate-400 block mb-1">URL</span><span className="font-medium text-slate-900 break-all">{selected.url ?? "—"}</span></div>
                <div><span className="text-slate-400 block mb-1">Время</span><span className="font-medium text-slate-900">{new Date(selected.created_at).toLocaleString("ru-RU")}</span></div>
                <div><span className="text-slate-400 block mb-1">User agent</span><span className="text-slate-700 text-xs break-all">{selected.user_agent ?? "—"}</span></div>
                {selected.stack && (
                  <div>
                    <span className="text-slate-400 block mb-1">Stack trace</span>
                    <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 whitespace-pre-wrap overflow-x-auto">{selected.stack}</pre>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
