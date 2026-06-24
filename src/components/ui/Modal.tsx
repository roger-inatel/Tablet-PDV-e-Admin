"use client";

import type { ReactNode } from "react";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/** Full-screen dimmed overlay with a centered card. Click outside to close. */
export function Modal({ onClose, children, className = "w-[min(460px,94vw)]" }: ModalProps) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(8,12,22,.62)] p-6 animate-[ovin_.16s_ease]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${className} overflow-hidden rounded-[18px] bg-white shadow-[0_40px_90px_-30px_rgba(0,0,0,.6)] animate-[popin_.22s_ease]`}
      >
        {children}
      </div>
    </div>
  );
}
