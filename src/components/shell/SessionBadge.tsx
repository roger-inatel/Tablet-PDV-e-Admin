"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useAppStore } from "@/store/useAppStore";
import { waitersById } from "@/store/selectors";

interface SessionBadgeProps {
  /** Dark chrome (KDS) variant. */
  dark?: boolean;
}

/** Current profile chip + "Sair". */
export function SessionBadge({ dark }: SessionBadgeProps) {
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const waiters = useAppStore((s) => s.waiters);
  const stations = useAppStore((s) => s.stations);
  const logout = useAppStore((s) => s.logout);

  if (!session) return null;

  const signOut = () => {
    logout();
    router.replace("/login");
  };

  let avatar: React.ReactNode = null;
  let name = "";
  let subtitle = "";

  if (session.role === "station") {
    const station = stations.find((s) => s.id === session.station);
    name = station?.name ?? session.station;
    subtitle = "Estação KDS";
    avatar = (
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] text-white"
        style={{ background: station?.color ?? "#334155" }}
      >
        <Icon name={station?.icon ?? "flame"} size={16} />
      </span>
    );
  } else {
    const w = waitersById(waiters)[session.waiterId];
    name = w?.name ?? "";
    subtitle = w?.roleLabel ?? "";
    avatar = (
      <Avatar initials={w?.initials ?? ""} color={w?.color ?? "#94a3b8"} size={32} />
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-[12px] border py-1.5 pl-1.5 pr-2 ${
        dark ? "border-white/15 bg-white/[0.06]" : "border-[#dbe2ea] bg-white"
      }`}
    >
      {avatar}
      <div className="hidden min-w-0 leading-tight sm:grid">
        <strong
          className={`truncate text-[0.82rem] ${dark ? "text-slate-100" : "text-navy"}`}
        >
          {name}
        </strong>
        <span
          className={`text-[0.7rem] ${dark ? "text-slate-400" : "text-ink-muted"}`}
        >
          {subtitle}
        </span>
      </div>
      <button
        type="button"
        onClick={signOut}
        className={`rounded-[8px] border px-2.5 py-1.5 text-[0.78rem] font-bold ${
          dark
            ? "border-white/15 bg-transparent text-slate-300"
            : "border-[#dbe2ea] bg-white text-[#475569]"
        }`}
      >
        Sair
      </button>
    </div>
  );
}
