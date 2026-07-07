"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useAppStore } from "@/store/useAppStore";
import { WAITERS } from "@/data/waiters";
import { STATIONS } from "@/data/stations";
import type { Station } from "@/types";

const KEYS: { label: string; alt?: boolean; action: "digit" | "clear" | "back" }[] = [
  { label: "1", action: "digit" },
  { label: "2", action: "digit" },
  { label: "3", action: "digit" },
  { label: "4", action: "digit" },
  { label: "5", action: "digit" },
  { label: "6", action: "digit" },
  { label: "7", action: "digit" },
  { label: "8", action: "digit" },
  { label: "9", action: "digit" },
  { label: "Limpar", alt: true, action: "clear" },
  { label: "0", action: "digit" },
  { label: "←", alt: true, action: "back" },
];

export default function LoginPage() {
  const router = useRouter();
  const loginWaiter = useAppStore((s) => s.loginWaiter);
  const enterStation = useAppStore((s) => s.enterStation);
  const storeWaiters = useAppStore((s) => s.waiters);
  const storeStations = useAppStore((s) => s.stations);

  // Reflect admin edits when loaded; fall back to seeds pre-hydration.
  const staff = storeWaiters.length ? storeWaiters : WAITERS;
  const stations = storeStations.length ? storeStations : STATIONS;
  const waiters = staff.filter((w) => w.role === "waiter");
  const managers = staff.filter((w) => w.role === "manager");

  const [pickId, setPickId] = useState<string>("carlos");
  const [pin, setPin] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const picked = staff.find((w) => w.id === pickId);
  const canEnter = pin.length >= 4 && !signingIn;

  const press = (key: (typeof KEYS)[number]) => {
    if (key.action === "digit") {
      setPin((p) => (p.length < 4 ? p + key.label : p));
    } else if (key.action === "clear") {
      setPin("");
    } else {
      setPin((p) => p.slice(0, -1));
    }
  };

  const onEnter = async () => {
    if (!canEnter) return;
    setSigningIn(true);
    const role = await loginWaiter(pickId, pin);
    setSigningIn(false);
    if (role) {
      router.push(role === "manager" ? "/admin" : "/waiter");
    } else {
      setPin("");
    }
  };

  const onStation = (station: Station) => {
    enterStation(station);
    router.push(`/kds/${station}`);
  };

  const cardCls = (selected: boolean) =>
    `flex items-center gap-3 rounded-[13px] border-2 p-3.5 text-left ${
      selected
        ? "border-brand-600 bg-[#eff6ff] shadow-[0_8px_20px_-10px_rgba(37,99,235,.5)]"
        : "border-line bg-white"
    }`;

  return (
    <div className="login-root flex min-h-[100dvh] flex-col lg:flex-row">
      {/* Left: profile hub */}
      <div className="login-pane flex flex-1 flex-col justify-center px-6 py-8 md:px-10 lg:px-16 lg:py-12 [background:radial-gradient(circle_at_18%_18%,#dbeafe,#f4f7fc_48%,#e8eef7)]">
        <div className="mb-7 flex items-center gap-3">
          <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-[15px] bg-gradient-to-br from-brand-600 to-[#1e3a8a] text-[1.1rem] font-extrabold text-white shadow-[0_10px_22px_-10px_rgba(37,99,235,.7)]">
            M+
          </span>
          <div>
            <div className="text-[1.4rem] font-extrabold text-navy">Mesa+</div>
            <div className="text-[0.9rem] font-semibold text-ink-muted">
              Bistrô Central
            </div>
          </div>
        </div>
        <h1 className="m-0 mb-[7px] text-[1.6rem] leading-tight text-navy">
          Identifique-se para começar
        </h1>
        <p className="m-0 mb-5 max-w-md text-[0.95rem] leading-relaxed text-ink-muted">
          Escolha seu perfil. Garçons e gerência entram com PIN; as estações de
          preparo entram direto.
        </p>

        <div className="grid max-w-2xl gap-5">
          {/* Waiters */}
          <div>
            <div className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
              Garçons
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {waiters.map((w) => {
                const selected = pickId === w.id;
                const onBreak = w.status === "ON_BREAK";
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setPickId(w.id);
                      setPin("");
                    }}
                    className={cardCls(selected)}
                  >
                    <Avatar initials={w.initials} color={w.color} size={40} />
                    <span className="grid min-w-0 gap-px">
                      <strong className="text-[0.92rem] leading-tight text-navy">
                        {w.name}
                      </strong>
                      <span className="text-[0.76rem] text-ink-muted">
                        {onBreak ? "Em pausa" : w.roleLabel}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Managers + KDS side by side */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
                Gerência
              </div>
              <div className="grid gap-2.5">
                {managers.map((w) => {
                  const selected = pickId === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setPickId(w.id);
                        setPin("");
                      }}
                      className={cardCls(selected)}
                    >
                      <Avatar initials={w.initials} color={w.color} size={40} />
                      <span className="grid min-w-0 gap-px">
                        <strong className="text-[0.92rem] leading-tight text-navy">
                          {w.name}
                        </strong>
                        <span className="text-[0.76rem] text-ink-muted">
                          {w.roleLabel} · Painel
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
                Estações (KDS)
              </div>
              <div className="grid gap-2.5">
                {stations.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onStation(st.id)}
                    className="flex items-center gap-3 rounded-[13px] border-2 border-line bg-white p-3.5 text-left"
                  >
                    <span
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-white"
                      style={{ background: st.color }}
                    >
                      <Icon name={st.icon} size={19} />
                    </span>
                    <span className="grid min-w-0 gap-px">
                      <strong className="text-[0.92rem] leading-tight text-navy">
                        {st.name}
                      </strong>
                      <span className="text-[0.76rem] text-ink-muted">
                        Entrar direto →
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: PIN pad */}
      <div className="login-pane flex flex-col items-center justify-center border-t border-line bg-white px-6 py-8 lg:w-[440px] lg:border-l lg:border-t-0 lg:py-12 lg:shadow-[-20px_0_60px_-40px_rgba(15,23,42,.4)]">
        <div className="mb-2 whitespace-nowrap text-center text-[0.8rem] font-bold uppercase tracking-[0.12em] text-ink-muted">
          PIN de acesso
        </div>
        <div className="mb-[18px] text-[1.1rem] font-extrabold text-navy">
          {picked?.name ?? ""}
        </div>
        <div className="pin-dots mb-[26px] flex gap-3.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-4 w-4 rounded-full transition-colors"
              style={{ background: i < pin.length ? "#1f4e79" : "#e2e8f0" }}
            />
          ))}
        </div>
        <div className="pin-pad grid grid-cols-3 gap-3" style={{ width: "min(294px,80vw)" }}>
          {KEYS.map((k) => (
            <button
              key={k.label}
              type="button"
              onClick={() => press(k)}
              className={`pin-key h-16 rounded-[14px] border border-line font-bold ${
                k.alt
                  ? "bg-[#f1f5f9] text-[0.95rem] text-[#475569]"
                  : "bg-white text-[1.5rem] text-navy"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onEnter}
          disabled={!canEnter}
          className={`pin-enter mt-6 w-full max-w-[294px] rounded-[14px] py-4 text-[1rem] font-extrabold text-white ${
            canEnter ? "cursor-pointer bg-[#1f4e79]" : "cursor-not-allowed bg-[#cbd5e1]"
          }`}
        >
          {signingIn ? "Entrando…" : "Entrar"}
        </button>
      </div>
    </div>
  );
}
