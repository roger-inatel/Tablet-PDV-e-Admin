"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Loader } from "@/components/ui/Loader";
import { StatusChip } from "@/components/ui/StatusChip";
import { useProducts } from "@/hooks/queries/use-products";

const PAGE_SIZE = 50;

export function ProductsPageContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isFetching } = useProducts({
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  const products = data?.items ?? [];
  const pagination = data?.pagination;
  const canGoBack = page > 1;
  const canGoForward = pagination ? page < pagination.totalPages : false;

  return (
    <>
      <AdminHeader kicker="Cadastros" title="Produtos" />
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-5 md:px-6 lg:px-8">
        <div className="grid gap-4 animate-[mfade_.22s_ease]">
          <div className="rounded-card border border-line bg-white px-5 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="m-0 mb-0.5 text-[1.08rem] text-navy">
                  Produtos cadastrados
                </h2>
                <p className="m-0 text-[0.88rem] text-ink-muted">
                  Dados carregados da tabela TB_PRODUTO.
                </p>
              </div>
              <label className="grid gap-1.5 text-[0.78rem] font-bold text-[#334155]">
                Buscar
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  className="h-10 w-full rounded-[9px] border border-[#d7e0ea] bg-white px-3 text-[0.9rem] font-medium text-navy outline-none focus:border-[#93c5fd] md:w-[320px]"
                  placeholder="Nome do produto"
                />
              </label>
            </div>
          </div>

          {isLoading ? <Loader /> : null}

          {error ? (
            <div className="rounded-card border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[0.9rem] font-semibold text-[#991b1b]">
              {error instanceof Error
                ? error.message
                : "Nao foi possivel carregar os produtos."}
            </div>
          ) : null}

          {!isLoading && !error ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-white px-4 py-3 text-[0.84rem] text-ink-muted">
                <span>
                  {pagination
                    ? `${pagination.total} produtos encontrados`
                    : "Produtos encontrados"}
                </span>
                {isFetching ? <span>Atualizando...</span> : null}
              </div>

              <div className="grid gap-2.5 md:hidden">
                {products.map((product) => (
                  <div
                    key={product.ID_PRODUTO}
                    className="grid gap-2 rounded-card border border-line bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[0.95rem] font-semibold text-navy">
                          {product.DS_PRODUTO}
                        </div>
                        <div className="mt-1 text-[0.78rem] text-ink-muted">
                          #{product.ID_PRODUTO}
                        </div>
                      </div>
                      <StatusChip kind={product.FL_ATIVO ? "green" : "neutral"}>
                        {product.FL_ATIVO ? "Ativo" : "Inativo"}
                      </StatusChip>
                    </div>
                    <div className="text-[0.82rem] text-[#475569]">
                      {product.DS_PROD_MOBILE || product.DS_PROD_FISCAL}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto rounded-card border border-line bg-white p-1.5 md:block">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {["Codigo", "Produto", "Fiscal", "Mobile", "Ordem", "Status"].map(
                        (header, index) => (
                          <th
                            key={header}
                            className={`border-b border-line bg-[#f8fafc] px-3.5 py-3 text-[0.78rem] font-bold text-[#334155] ${
                              index === 0 || index === 4 || index === 5
                                ? "text-center"
                                : "text-left"
                            }`}
                          >
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.ID_PRODUTO} className="border-b border-[#eef1f6]">
                        <td className="px-3.5 py-3 text-center text-[0.86rem] font-bold text-[#475569]">
                          {product.ID_PRODUTO}
                        </td>
                        <td className="px-3.5 py-3 text-[0.9rem] font-semibold text-navy">
                          {product.DS_PRODUTO}
                        </td>
                        <td className="px-3.5 py-3 text-[0.88rem] text-[#475569]">
                          {product.DS_PROD_FISCAL}
                        </td>
                        <td className="px-3.5 py-3 text-[0.88rem] text-[#475569]">
                          {product.DS_PROD_MOBILE || "-"}
                        </td>
                        <td className="px-3.5 py-3 text-center text-[0.88rem] text-[#475569]">
                          {product.NR_ORDEM_MOBILE ?? "-"}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <StatusChip kind={product.FL_ATIVO ? "green" : "neutral"}>
                            {product.FL_ATIVO ? "Ativo" : "Inativo"}
                          </StatusChip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {products.length === 0 ? (
                <div className="rounded-card border border-line bg-white px-4 py-8 text-center text-[0.9rem] font-semibold text-ink-muted">
                  Nenhum produto encontrado.
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={!canGoBack}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  className="rounded-[9px] border border-[#d7e0ea] bg-white px-3.5 py-2 text-[0.84rem] font-bold text-[#334155] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Anterior
                </button>
                <span className="min-w-[92px] text-center text-[0.84rem] font-bold text-[#334155]">
                  {pagination ? `${page} / ${Math.max(pagination.totalPages, 1)}` : page}
                </span>
                <button
                  type="button"
                  disabled={!canGoForward}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-[9px] border border-[#d7e0ea] bg-white px-3.5 py-2 text-[0.84rem] font-bold text-[#334155] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Proxima
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
