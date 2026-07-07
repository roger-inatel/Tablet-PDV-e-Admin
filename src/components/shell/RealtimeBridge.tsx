"use client";

import { useEffect } from "react";
import { getRealtimeClient } from "@/lib/realtime";
import { useAppStore } from "@/store/useAppStore";

/**
 * Connects the realtime layer to the store: applies incoming events (version-
 * guarded upserts) and heals missed events by refetching when the tab becomes
 * visible again (background tabs get throttled and can drop events).
 */
export function RealtimeBridge() {
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    const unsubscribe = getRealtimeClient().subscribe((event) => {
      useAppStore.getState().applyEvent(event);
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void useAppStore.getState().refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hydrated]);

  return null;
}
