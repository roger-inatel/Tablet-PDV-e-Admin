"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { useAppStore } from "@/store/useAppStore";
import { WAITERS } from "@/data/waiters";

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
  const login = useAppStore((s) => s.login);
  const storeWaiters = useAppStore((s) => s.waiters);
  // Reflect admin edits when the store is loaded; fall back to the seed otherwise.
  const waiters = storeWaiters.length ? storeWaiters : WAITERS;
  const [pickId, setPickId] = useState<string>("carlos");
  const [pin, setPin] = useState("");

  const picked = waiters.find((w) => w.id === pickId);
  const canEnter = pin.length >= 4;

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
    const ok = await login(pickId, pin);
    if (ok) {
      router.push("/pdv");
    } else {
      setPin("");
    }
  };

  return (
    <div className="login-root flex min-h-[100dvh] flex-col lg:flex-row">
      {/* Left: identity */}
      <div className="login-pane flex flex-1 flex-col justify-center px-6 py-8 md:px-10 lg:px-16 lg:py-12 [background:radial-gradient(circle_at_18%_18%,#dbeafe,#f4f7fc_48%,#e8eef7)]">
        <div className="mb-8 flex items-center gap-3">
          <span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-[15px] bg-gradient-to-br from-brand-600 to-[#1e3a8a] text-[1.1rem] font-extrabold text-white shadow-[0_10px_22px_-10px_rgba(37,99,235,.7)]">
            M+
          </span>
          <div>
            <div className="text-[1.4rem] font-extrabold text-navy">Mesa+</div>
            <div className="text-[0.9rem] font-semibold text-ink-muted">
              PDV do Garçom
            </div>
          </div>
        </div>
        <h1 className="m-0 mb-[7px] text-[1.7rem] leading-tight text-navy">
          Identifique-se para começar
        </h1>
        <p className="m-0 mb-[22px] max-w-md text-[0.98rem] leading-relaxed text-ink-muted">
          Toque no seu nome e digite seu PIN de 4 dígitos para abrir as mesas.
        </p>
        <div className="grid max-w-xl grid-cols-1 gap-[11px] sm:grid-cols-2">
          {waiters.map((w) => {
            const sel = pickId === w.id;
            const paused = w.status === "PAUSA";
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  setPickId(w.id);
                  setPin("");
                }}
                className={`flex items-center gap-3 rounded-[13px] border-2 p-3.5 text-left ${
                  sel
                    ? "border-brand-600 bg-[#eff6ff] shadow-[0_8px_20px_-10px_rgba(37,99,235,.5)]"
                    : "border-line bg-white"
                }`}
              >
                <Avatar initials={w.initials} color={w.color} size={42} />
                <span className="grid min-w-0 gap-px">
                  <strong className="text-[0.94rem] leading-tight text-navy">
                    {w.name}
                  </strong>
                  <span className="text-[0.78rem] text-ink-muted">
                    {paused ? "Em pausa" : w.role}
                  </span>
                </span>
              </button>
            );
          })}
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
          Entrar no PDV
        </button>
      </div>
    </div>
  );
}
