"use client";

import { Icon } from "@/components/ui/Icon";
import { fmt } from "@/lib/format";

interface ComandaFooterProps {
  total: number;
  pendCoz: number;
  pendBar: number;
  onSendCoz: () => void;
  onSendBar: () => void;
  onClose: () => void;
}

export function ComandaFooter({
  total,
  pendCoz,
  pendBar,
  onSendCoz,
  onSendBar,
  onClose,
}: ComandaFooterProps) {
  return (
    <div className="pdv-chrome grid gap-2.5 border-t border-line bg-white px-4 py-3 md:px-6 md:py-3.5 lg:px-8">
      <div className="flex items-center justify-between">
        <span className="text-[0.92rem] font-semibold text-ink-muted">
          Total da comanda
        </span>
        <strong className="text-[1.35rem] text-navy md:text-[1.5rem]">{fmt(total)}</strong>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <SendButton
          active={pendCoz > 0}
          color="#b45309"
          icon="flame"
          label={`Enviar cozinha ${pendCoz > 0 ? `(${pendCoz})` : ""}`}
          onClick={onSendCoz}
        />
        <SendButton
          active={pendBar > 0}
          color="#2563eb"
          icon="wine"
          label={`Enviar bar ${pendBar > 0 ? `(${pendBar})` : ""}`}
          onClick={onSendBar}
        />
        <button
          type="button"
          onClick={onClose}
          className="col-span-2 rounded-[11px] border border-[#dbe2ea] bg-white px-3 py-[13px] text-[0.92rem] font-bold text-[#334155] sm:col-span-1"
        >
          Fechar conta
        </button>
      </div>
    </div>
  );
}

function SendButton({
  active,
  color,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  color: string;
  icon: "flame" | "wine";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={active ? onClick : undefined}
      className={`flex items-center justify-center gap-2 rounded-[11px] px-3 py-[13px] text-[0.9rem] font-extrabold md:text-[0.92rem] ${
        active ? "text-white" : "cursor-not-allowed bg-[#e2e8f0] text-[#94a3b8]"
      }`}
      style={active ? { background: color } : undefined}
    >
      <Icon name={icon} size={16} />
      <span className="truncate">{label}</span>
    </button>
  );
}
