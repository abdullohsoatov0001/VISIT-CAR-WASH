"use client";

import { useEffect } from "react";
import { logError } from "@/lib/errorLog";

export default function ErrorLogger() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      logError(e.message, e.error?.stack);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      logError(reason?.message ?? String(reason), reason?.stack);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
