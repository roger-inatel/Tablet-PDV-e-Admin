"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useAppStore } from "@/store/useAppStore";

function minutesAgo(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  return min === 0 ? "agora" : `há ${min} min`;
}

/**
 * "Order ready" alerts for the logged-in waiter. Fed by the store, which
 * raises one notification when every item of one of their orders turns READY.
 */
export function NotificationBell() {
  const router = useRouter();
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markTableNotificationsRead);
  const clearAll = useAppStore((s) => s.clearNotifications);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ""}`}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-[11px] border ${
          unread
            ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
            : "border-line bg-white text-[#475569]"
        }`}
      >
        <Icon name="bell" size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#16a34a] px-1 text-[0.68rem] font-extrabold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[46px] z-[300] w-[280px] overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_18px_40px_-14px_rgba(15,23,42,.35)] animate-[popin_.16s_ease]">
          <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
            <strong className="text-[0.88rem] text-navy">Pedidos prontos</strong>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setOpen(false);
                }}
                className="text-[0.76rem] font-bold text-ink-muted"
              >
                Limpar
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-3.5 py-6 text-center text-[0.84rem] text-ink-muted">
              Nenhum pedido pronto por enquanto.
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    markRead(n.tableId);
                    setOpen(false);
                    router.push(`/waiter/table/${n.tableId}`);
                  }}
                  className={`flex w-full items-center justify-between gap-2 border-b border-[#f1f5f9] px-3.5 py-2.5 text-left last:border-0 ${
                    n.read ? "bg-white" : "bg-[#f0fdf4]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-[0.9rem] font-bold text-navy">
                      Mesa {n.tableNum} · Pedido #{n.orderSeq}
                    </span>
                    <span className="block text-[0.76rem] text-ink-muted">
                      pronto para entrega · {minutesAgo(n.createdAt)}
                    </span>
                  </span>
                  {!n.read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#16a34a]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
