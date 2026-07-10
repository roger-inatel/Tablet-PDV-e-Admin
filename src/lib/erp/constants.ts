import type { PaymentMethod } from "@/types";

// Fixed IDs used when writing orders into the real ERP tables
// (TB_PEDIDO/TB_PEDIDO_ITEM/TB_PEDIDO_PARCELA). Mirrors the master data
// created by prisma/seed.cjs — keep both in sync.
export const EMPRESA_ID = 900001;
export const PESSOA_AVULSA_ID = 900001;
export const ENDERECO_AVULSO_ID = 900001;
export const USUARIO_SISTEMA_ID = 900001;
export const TIPO_OPERACAO_VENDA = 1;
export const UNIDADE_MEDIDA_PADRAO = 3;
export const TABELA_VENDA_ID = 1;
export const CONDICAO_PAGTO_A_VISTA = 1;
export const STATUS_PEDIDO_FECHADO = 5;
export const STATUS_PARCELA_BAIXADO = 17;

export const FORMA_PAGTO_BY_METHOD: Record<PaymentMethod, number> = {
  cash: 1,
  card: 3,
  pix: 11,
};
