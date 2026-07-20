"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { RemovalQueue } from "@/components/admin/RemovalQueue";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";

export default function AdminRemovalsPage() {
  const hydrated = useAppStore((s) => s.hydrated);

  return (
    <>
      <AdminHeader kicker="Operação" title="Remoções de itens" />
      <div className="mx-auto w-full max-w-[1080px] px-4 pb-24 pt-5 md:px-6 lg:px-8">
        {!hydrated ? <Loader /> : <RemovalQueue />}
      </div>
    </>
  );
}
