"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import type { Waiter, WaiterStatus } from "@/types";

export interface WaiterFormData {
  name: string;
  login: string;
  status: WaiterStatus;
  phone: string;
  note: string;
}

interface WaiterEditDrawerProps {
  /** Waiter being edited, or null to create a new one. */
  waiter: Waiter | null;
  onClose: () => void;
  onSave: (data: WaiterFormData) => void | Promise<void>;
}

const STATUS_OPTIONS: { value: WaiterStatus; label: string }[] = [
  { value: "ATIVO", label: "Ativo" },
  { value: "PAUSA", label: "Em pausa" },
  { value: "INATIVO", label: "Inativo" },
];

const inputCls =
  "h-11 w-full rounded-[9px] border border-[#dbe2ea] bg-white px-3 text-[0.92rem] text-navy outline-none focus:border-brand-600";
const labelCls =
  "text-[0.74rem] font-bold uppercase tracking-[0.05em] text-ink-muted";

export function WaiterEditDrawer({ waiter, onClose, onSave }: WaiterEditDrawerProps) {
  const isEdit = !!waiter;
  const [form, setForm] = useState<WaiterFormData>({
    name: waiter?.name ?? "",
    login: waiter?.login ?? "",
    status: waiter?.status ?? "ATIVO",
    phone: waiter?.phone ?? "",
    note: waiter?.note ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof WaiterFormData>(key: K, value: WaiterFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canSave = form.name.trim().length > 0 && !saving;

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    await onSave(form);
    // Parent unmounts the drawer on success; no need to reset state here.
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] flex justify-end bg-[rgba(8,12,22,.55)] animate-[ovin_.16s_ease]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[min(440px,92vw)] flex-col bg-app-bg shadow-[-24px_0_60px_-30px_rgba(15,23,42,.5)] animate-[popin_.2s_ease]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            {isEdit && waiter && (
              <Avatar initials={waiter.initials} color={waiter.color} size={38} />
            )}
            <div>
              <div className="text-[1.05rem] font-extrabold text-navy">
                {isEdit ? "Editar garçom" : "Novo garçom"}
              </div>
              <div className="text-[0.8rem] text-ink-muted">
                {isEdit ? waiter?.role : "Cadastro de demonstração"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[9px] border border-[#dbe2ea] bg-white text-[1.1rem] text-[#475569]"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-4">
            <label className="grid gap-1.5">
              <span className={labelCls}>Nome</span>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Nome do garçom"
              />
            </label>

            <label className="grid gap-1.5">
              <span className={labelCls}>Usuário / login</span>
              <input
                className={inputCls}
                value={form.login}
                onChange={(e) => set("login", e.target.value)}
                placeholder="@usuario"
              />
            </label>

            <label className="grid gap-1.5">
              <span className={labelCls}>Status</span>
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) => set("status", e.target.value as WaiterStatus)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className={labelCls}>Telefone</span>
              <input
                className={inputCls}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(11) 90000-0000"
                inputMode="tel"
              />
            </label>

            <label className="grid gap-1.5">
              <span className={labelCls}>Observação</span>
              <textarea
                className="min-h-[88px] w-full resize-y rounded-[9px] border border-[#dbe2ea] bg-white px-3 py-2.5 text-[0.92rem] text-navy outline-none focus:border-brand-600"
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                placeholder="Anotações internas (opcional)"
              />
            </label>

            {isEdit && (
              <p className="m-0 text-[0.78rem] text-ink-muted">
                PIN de acesso permanece inalterado neste protótipo.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 border-t border-line bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[11px] border border-[#dbe2ea] bg-white py-3 text-[0.9rem] font-bold text-[#334155]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSave}
            className={`flex-1 rounded-[11px] py-3 text-[0.9rem] font-extrabold text-white ${
              canSave ? "cursor-pointer bg-[#1f4e79]" : "cursor-not-allowed bg-[#cbd5e1]"
            }`}
          >
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}
