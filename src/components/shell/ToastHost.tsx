"use client";

import { useAppStore } from "@/store/useAppStore";

export function ToastHost() {
  const toast = useAppStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="fixed bottom-[78px] left-1/2 z-[400] max-w-[calc(100vw-2rem)] -translate-x-1/2 break-words rounded-xl bg-navy px-5 py-3 text-center text-[0.9rem] font-semibold text-white shadow-[0_18px_40px_-14px_rgba(15,23,42,.6)] animate-[toastIn_.2s_ease]">
      {toast}
    </div>
  );
}
