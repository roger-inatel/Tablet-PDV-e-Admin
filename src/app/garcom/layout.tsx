import type { ReactNode } from "react";
import { RequireSessao } from "@/components/shell/RequireSessao";

export default function GarcomLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSessao permitir={["garcom"]}>
      <main className="h-[100dvh] overflow-hidden bg-app-bg">{children}</main>
    </RequireSessao>
  );
}
