"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SessionBadge } from "@/components/shell/SessionBadge";
import { useAppStore } from "@/store/useAppStore";
import type { Station } from "@/types";

/** Live clock (client-only; the KDS pages render behind the hydration gate). */
function Clock() {
  const [time, setTime] = useState<string>(() =>
    new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  );
  useEffect(() => {
    const t = setInterval(
      () =>
        setTime(
          new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        ),
      10_000,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <span className="hidden text-[1.2rem] font-extrabold tabular-nums text-slate-200 sm:block">
      {time}
    </span>
  );
}

export function KdsHeader({ station }: { station: Station }) {
  const stations = useAppStore((s) => s.stations);
  const config = stations.find((s) => s.id === station);

  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-white"
          style={{ background: config?.color ?? "#334155" }}
        >
          <Icon name={config?.icon ?? "flame"} size={19} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[1.1rem] font-extrabold text-white">
            KDS · {config?.name ?? station}
          </div>
          <div className="truncate text-[0.8rem] text-slate-400">
            {config?.description}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Clock />
        <SessionBadge dark />
      </div>
    </div>
  );
}
