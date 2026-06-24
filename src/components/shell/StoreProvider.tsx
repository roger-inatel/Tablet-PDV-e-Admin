"use client";

import { useEffect, type ReactNode } from "react";
import { useAppStore } from "@/store/useAppStore";

/**
 * Boots the client-side store: rehydrates the persisted session/prefs slice,
 * loads reference + table data from the repos, then flips `hydrated` so guarded
 * screens can render without an SSR mismatch.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let active = true;
    (async () => {
      await useAppStore.persist.rehydrate();
      await useAppStore.getState().init();
      if (active) useAppStore.getState().setHydrated();
    })();
    return () => {
      active = false;
    };
  }, []);

  return <>{children}</>;
}
