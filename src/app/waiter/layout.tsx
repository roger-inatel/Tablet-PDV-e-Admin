import type { ReactNode } from "react";
import { RequireSession } from "@/components/shell/RequireSession";

export default function WaiterLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSession allow={["waiter"]}>
      <main className="h-[100dvh] overflow-hidden bg-app-bg">{children}</main>
    </RequireSession>
  );
}
