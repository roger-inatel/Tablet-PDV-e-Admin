export interface ProductListItem {
  ID_PRODUTO: number;
  DS_PRODUTO: string;
  DS_PROD_FISCAL: string;
  DS_PROD_MOBILE: string | null;
  NR_ORDEM_MOBILE: number | null;
  FL_ATIVO: boolean;
}

export interface ProductsResponse {
  items: ProductListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
