"use client";

import { useMemo, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  GarcomEditDrawer,
  type GarcomFormData,
} from "@/components/admin/GarcomEditDrawer";
import { Avatar } from "@/components/ui/Avatar";
import { StatusChip } from "@/components/ui/StatusChip";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";
import { garcomStatusMeta, mesasDoGarcom } from "@/store/selectors";
import type { Garcom } from "@/types";

type DrawerState = { mode: "edit"; garcom: Garcom } | { mode: "create" } | null;

export default function GarconsPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const garcons = useAppStore((s) => s.garcons);
  const comandas = useAppStore((s) => s.comandas);
  const salvarGarcom = useAppStore((s) => s.salvarGarcom);
  const criarGarcom = useAppStore((s) => s.criarGarcom);

  const [drawer, setDrawer] = useState<DrawerState>(null);

  const rows = useMemo(
    () =>
      garcons
        .filter((g) => g.papel === "garcom")
        .map((g) => ({
          garcom: g,
          mesas: mesasDoGarcom(comandas, g.id),
          statusMeta: garcomStatusMeta(g.status),
        })),
    [garcons, comandas],
  );

  const onSave = async (data: GarcomFormData) => {
    if (drawer?.mode === "edit") {
      await salvarGarcom(drawer.garcom.id, {
        name: data.name,
        login: data.login,
        status: data.status,
        phone: data.phone,
        note: data.note,
      });
    } else {
      await criarGarcom(data);
    }
    setDrawer(null);
  };

  return (
    <>
      <AdminHeader kicker="Cadastros" title="Garçons" />
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 md:px-6 lg:px-8">
        {!hydrated ? (
          <Loader />
        ) : (
          <div className="grid gap-4 animate-[mfade_.22s_ease]">
            <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-card border border-line bg-white px-5 py-4">
              <div>
                <h2 className="m-0 mb-0.5 text-[1.08rem] text-navy">Equipe de garçons</h2>
                <p className="m-0 text-[0.88rem] text-ink-muted">
                  Cadastre garçons, defina o status e acompanhe a carga de mesas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawer({ mode: "create" })}
                className="inline-flex items-center gap-1.5 rounded-[9px] bg-brand-900 px-[15px] py-2.5 text-[0.88rem] font-bold text-white"
              >
                + Novo garçom
              </button>
            </div>

            {/* Mobile: cards */}
            <div className="grid gap-3 md:hidden">
              {rows.map(({ garcom: g, mesas, statusMeta }) => (
                <div
                  key={g.id}
                  className="grid gap-3 rounded-card border border-line bg-white p-4"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={g.initials} color={g.color} size={38} />
                    <div className="grid min-w-0 gap-px">
                      <strong className="text-[0.95rem] text-navy">{g.name}</strong>
                      <span className="text-[0.78rem] text-ink-muted">{g.cargo}</span>
                    </div>
                    <StatusChip kind={statusMeta.kind} className="ml-auto">
                      {statusMeta.label}
                    </StatusChip>
                  </div>
                  <div className="flex items-center justify-between text-[0.84rem] text-[#475569]">
                    <span>
                      <span className="font-semibold text-navy">{g.login}</span> · PIN ••••
                    </span>
                    <span className="font-semibold">{mesas} mesas</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawer({ mode: "edit", garcom: g })}
                    className="rounded-lg border border-[#dbe2ea] bg-white py-2.5 text-[0.85rem] font-bold text-[#334155]"
                  >
                    Editar
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop/tablet: table */}
            <div className="hidden overflow-x-auto rounded-card border border-line bg-white p-1.5 md:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Garçom", "Login / PIN", "Mesas atribuídas", "Status", "Ações"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`border-b border-line bg-[#f8fafc] px-3.5 py-3 text-[0.78rem] font-bold text-[#334155] ${
                            i <= 1 ? "text-left" : i === 4 ? "text-right" : "text-center"
                          }`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ garcom: g, mesas, statusMeta }) => (
                    <tr key={g.id} className="border-b border-[#eef1f6]">
                      <td className="px-3.5 py-[13px]">
                        <span className="inline-flex items-center gap-2.5">
                          <Avatar initials={g.initials} color={g.color} size={34} />
                          <span className="grid gap-px">
                            <strong className="text-[0.9rem] text-navy">{g.name}</strong>
                            <span className="text-[0.76rem] text-ink-muted">{g.cargo}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3.5 py-[13px] text-[0.88rem] text-[#475569]">
                        <span className="font-semibold text-navy">{g.login}</span> · PIN
                        ••••
                      </td>
                      <td className="px-3.5 py-[13px] text-center text-[0.9rem] font-semibold text-[#475569]">
                        {mesas}
                      </td>
                      <td className="px-3.5 py-[13px] text-center">
                        <StatusChip kind={statusMeta.kind}>{statusMeta.label}</StatusChip>
                      </td>
                      <td className="px-3.5 py-[13px] text-right">
                        <button
                          type="button"
                          onClick={() => setDrawer({ mode: "edit", garcom: g })}
                          className="rounded-lg border border-[#dbe2ea] bg-white px-3 py-1.5 text-[0.82rem] font-semibold text-[#334155]"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {drawer && (
        <GarcomEditDrawer
          garcom={drawer.mode === "edit" ? drawer.garcom : null}
          onClose={() => setDrawer(null)}
          onSave={onSave}
        />
      )}
    </>
  );
}
