import type { ReactNode } from "react";
import { RequireWaiter } from "@/components/shell/RequireWaiter";

export default function PdvLayout({ children }: { children: ReactNode }) {
  return (
    <RequireWaiter>
      <main className="h-[100dvh] overflow-hidden bg-app-bg">{children}</main>
    </RequireWaiter>
  );
}
