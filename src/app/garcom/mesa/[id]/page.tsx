"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ComandaHeader } from "@/components/garcom/ComandaHeader";
import { ComandaDrafts } from "@/components/garcom/ComandaDrafts";
import { ComandaPedidos } from "@/components/garcom/ComandaPedidos";
import { ComandaFooter } from "@/components/garcom/ComandaFooter";
import { CatalogPanel } from "@/components/garcom/CatalogPanel";
import { CatalogDrawer } from "@/components/garcom/CatalogDrawer";
import { EnviarPedidoModal } from "@/components/garcom/EnviarPedidoModal";
import { FechamentoModal } from "@/components/comanda/FechamentoModal";
import { Loader } from "@/components/ui/Loader";
import { useAppStore } from "@/store/useAppStore";
import {
  comandaById,
  garconsById,
  pedidosDaComanda,
} from "@/store/selectors";
import { contagensDaComanda } from "@/lib/domain/comanda";
import { totalCobrado, totalComanda } from "@/lib/domain/pedido";
import {
  ehResponsavel,
  podeCancelarFechamento,
  podeEditarDraft,
} from "@/lib/domain/permissions";
import { firstName } from "@/lib/format";
import { useMediaQuery } from "@/lib/useMediaQuery";
import type { Category } from "@/types";

export default function ComandaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const mesaId = Number(id);
  const router = useRouter();

  // Side-by-side catalog only fits on large screens; below lg the catalog is
  // a bottom drawer (single-column "Foco" flow).
  const canSplit = useMediaQuery("(min-width: 1024px)");

  const hydrated = useAppStore((s) => s.hydrated);
  const sessao = useAppStore((s) => s.sessao);
  const mesas = useAppStore((s) => s.mesas);
  const comandas = useAppStore((s) => s.comandas);
  const pedidos = useAppStore((s) => s.pedidos);
  const garcons = useAppStore((s) => s.garcons);
  const produtos = useAppStore((s) => s.produtos);
  const categorias = useAppStore((s) => s.categorias);
  const comandaVariant = useAppStore((s) => s.comandaVariant);
  const setComandaVariant = useAppStore((s) => s.setComandaVariant);
  const addItemDraft = useAppStore((s) => s.addItemDraft);
  const incDraft = useAppStore((s) => s.incDraft);
  const decDraft = useAppStore((s) => s.decDraft);
  const enviarPedidoAction = useAppStore((s) => s.enviarPedido);
  const cancelarFechamento = useAppStore((s) => s.cancelarFechamento);

  const [catCat, setCatCat] = useState<Category>("Entradas");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [enviarOpen, setEnviarOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  // Pinned comanda id while the fechamento modal is open — keeps the success
  // screen visible after comanda.fechada frees the mesa (comandaId -> null).
  const [fechamentoId, setFechamentoId] = useState<string | null>(null);

  const mesa = mesas.find((m) => m.id === mesaId);
  const comandaAtiva = comandaById(comandas, mesa?.comandaId ?? null);
  const comandaFechamento = fechamentoId
    ? comandas.find((c) => c.id === fechamentoId)
    : undefined;
  const comanda = comandaAtiva ?? comandaFechamento;
  const valid = !!mesa && !!comanda;

  // Free/unknown mesa via direct URL -> back to the grid.
  useEffect(() => {
    if (!hydrated) return;
    if (!valid) router.replace("/garcom");
  }, [hydrated, valid, router]);

  const meusPedidos = useMemo(
    () => (comanda ? pedidosDaComanda(pedidos, comanda.id) : []),
    [pedidos, comanda],
  );

  const contagens = useMemo(
    () =>
      comanda
        ? contagensDaComanda(comanda, meusPedidos)
        : { aEnviar: 0, porStatus: { ENVIADO: 0, RECEBIDO: 0, EM_PREPARO: 0, PRONTO: 0 } },
    [comanda, meusPedidos],
  );

  if (!hydrated || !valid || !comanda) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  const readOnly = !ehResponsavel(sessao, comanda);
  const editavel = podeEditarDraft(sessao, comanda);
  const emFechamento = comanda.status === "EM_FECHAMENTO";
  const responsavel = garconsById(garcons)[comanda.garcomId];
  const total = totalComanda(comanda, meusPedidos);
  const vazia = comanda.itensDraft.length === 0 && meusPedidos.length === 0;
  const dividido = canSplit && comandaVariant === "dividido" && editavel;

  const catalogProps = {
    categories: categorias,
    products: produtos,
    activeCat: catCat,
    onCat: setCatCat,
    onAdd: (produtoId: string) => addItemDraft(comanda.id, produtoId),
  };

  const confirmarEnvio = async () => {
    setEnviando(true);
    const ok = await enviarPedidoAction(comanda.id);
    setEnviando(false);
    if (ok) setEnviarOpen(false);
  };

  return (
    <div className="relative flex h-full flex-col">
      <ComandaHeader
        mesaNum={comanda.mesaNum}
        seats={mesa.seats}
        garcomNome={responsavel ? firstName(responsavel.name) : ""}
        readOnly={readOnly}
        contagens={contagens}
        variant={comandaVariant}
        showToggle={canSplit && editavel}
        onVariant={(v) => {
          setComandaVariant(v);
          setDrawerOpen(false);
        }}
        onBack={() => router.push("/garcom")}
      />

      {emFechamento && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#fde68a] bg-[#fffbeb] px-4 py-2.5 md:px-6 lg:px-8">
          <span className="text-[0.86rem] font-semibold text-[#92400e]">
            {comanda.fiscal?.status === "ERRO"
              ? "Erro na emissão fiscal · reemissão pelo caixa"
              : comanda.pagamento
                ? "Pagamento registrado · emitindo NFC-e"
                : "Em fechamento · aguardando pagamento"}
          </span>
          <div className="flex gap-2">
            {!readOnly && (
              <button
                type="button"
                onClick={() => setFechamentoId(comanda.id)}
                className="rounded-[8px] bg-[#92400e] px-3 py-1.5 text-[0.8rem] font-bold text-white"
              >
                Abrir fechamento
              </button>
            )}
            {podeCancelarFechamento(sessao, comanda) && (
              <button
                type="button"
                onClick={() => cancelarFechamento(comanda.id)}
                className="rounded-[8px] border border-[#fcd34d] bg-white px-3 py-1.5 text-[0.8rem] font-bold text-[#92400e]"
              >
                Cancelar fechamento
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className="grid min-h-0 flex-1"
        style={{
          gridTemplateColumns: dividido ? "minmax(0,1fr) 358px" : "minmax(0,1fr)",
        }}
      >
        <div
          className={`flex min-h-0 flex-col ${dividido ? "border-r border-line" : ""}`}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-[18px] lg:px-8">
            {vazia ? (
              <div className="px-5 py-16 text-center text-[#94a3b8]">
                <div className="mb-1.5 text-[1.05rem] font-bold text-[#475569]">
                  Comanda vazia
                </div>
                <div className="text-[0.9rem]">
                  Adicione itens pelo catálogo para começar o pedido.
                </div>
              </div>
            ) : (
              <div className="grid gap-[18px]">
                <ComandaDrafts
                  drafts={comanda.itensDraft}
                  editable={editavel}
                  onInc={(k) => incDraft(comanda.id, k)}
                  onDec={(k) => decDraft(comanda.id, k)}
                />
                <ComandaPedidos pedidos={meusPedidos} />
              </div>
            )}
          </div>

          {/* Foco/mobile: in-flow add button (no floating FAB, no overlap). */}
          {editavel && !dividido && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="pdv-chrome flex items-center justify-center gap-2 border-t border-line bg-[#1f4e79] px-4 py-3 text-[0.95rem] font-extrabold text-white md:px-6 lg:px-8"
            >
              + Adicionar itens
            </button>
          )}

          {!readOnly && comanda.status === "ABERTA" && (
            <ComandaFooter
              total={total}
              aEnviar={contagens.aEnviar}
              onEnviar={() => setEnviarOpen(true)}
              onFechar={() => setFechamentoId(comanda.id)}
            />
          )}
        </div>

        {dividido && <CatalogPanel {...catalogProps} cols={1} />}
      </div>

      {editavel && !dividido && drawerOpen && (
        <CatalogDrawer {...catalogProps} onClose={() => setDrawerOpen(false)} />
      )}

      {enviarOpen && (
        <EnviarPedidoModal
          drafts={comanda.itensDraft}
          enviando={enviando}
          onClose={() => setEnviarOpen(false)}
          onConfirm={confirmarEnvio}
        />
      )}

      {fechamentoId && comandaFechamento && (
        <FechamentoModal
          comanda={comandaFechamento}
          total={totalCobrado(meusPedidos)}
          onClose={() => {
            const fechou = comandaFechamento.status === "FECHADA";
            setFechamentoId(null);
            if (fechou) router.replace("/garcom");
          }}
        />
      )}
    </div>
  );
}
