import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/apiFetch";
import type { ProductsResponse } from "@/types/product";

interface UseProductsParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export const productsQueryKey = {
  all: ["products"] as const,
  list: (params: Required<UseProductsParams>) =>
    [...productsQueryKey.all, "list", params] as const,
};

export function useProducts({
  search = "",
  page = 1,
  pageSize = 50,
}: UseProductsParams = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  return useQuery({
    queryKey: productsQueryKey.list({ search: search.trim(), page, pageSize }),
    queryFn: () => apiFetch<ProductsResponse>(`/api/products?${params.toString()}`),
    placeholderData: keepPreviousData,
  });
}
