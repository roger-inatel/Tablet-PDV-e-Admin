import type { ReactNode } from "react";
import { RequireSession } from "@/components/shell/RequireSession";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSession allow={["manager"]}>
      <div className="grid min-h-screen bg-navy md:grid-cols-[248px_1fr]">
        <AdminSidebar />
        <div className="flex min-h-screen min-w-0 flex-col bg-app-bg">{children}</div>
      </div>
    </RequireSession>
  );
}
