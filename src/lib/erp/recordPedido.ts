import { prisma } from "@/lib/prisma";
import { nextId } from "./nextId";
import {
  CONDICAO_PAGTO_A_VISTA,
  EMPRESA_ID,
  ENDERECO_AVULSO_ID,
  FORMA_PAGTO_BY_METHOD,
  PESSOA_AVULSA_ID,
  STATUS_PARCELA_BAIXADO,
  STATUS_PEDIDO_FECHADO,
  TABELA_VENDA_ID,
  TIPO_OPERACAO_VENDA,
  UNIDADE_MEDIDA_PADRAO,
  USUARIO_SISTEMA_ID,
} from "./constants";
import type { PaymentMethod } from "@/types";

export interface PedidoItemInput {
  productId: string;
  qty: number;
  unitPrice: number;
}

export interface RecordPedidoInput {
  checkId: string;
  tableNum: number;
  method: PaymentMethod;
  items: PedidoItemInput[];
  amount: number;
}

/**
 * Writes a paid order into the real ERP tables (TB_PEDIDO/ITEM/PARCELA).
 * None of these PKs are IDENTITY columns, so every id is computed as
 * MAX+1 inside this same transaction (see nextId).
 */
export async function recordPedido(input: RecordPedidoInput): Promise<void> {
  const idFormaPagto = FORMA_PAGTO_BY_METHOD[input.method];
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const idPedido = await nextId(tx, "TB_PEDIDO", "ID_PEDIDO");
    const nrPedido = await nextId(tx, "TB_PEDIDO", "NR_PEDIDO");

    await tx.tB_PEDIDO.create({
      data: {
        ID_PEDIDO: idPedido,
        NR_PEDIDO: nrPedido,
        DT_PEDIDO: now,
        ID_STATUS: STATUS_PEDIDO_FECHADO,
        TP_PESSOA: "F",
        ID_PESSOA: PESSOA_AVULSA_ID,
        ID_ENDERECO_FATURAMENTO: ENDERECO_AVULSO_ID,
        ID_ENDERECO_ENTREGA: ENDERECO_AVULSO_ID,
        ID_FILIAL: EMPRESA_ID,
        ID_FORMA_PAGTO: idFormaPagto,
        ID_CONDICAO_PAGTO: CONDICAO_PAGTO_A_VISTA,
        FL_BLOQUEADO: false,
        TP_FRETE: "9",
        ESPECIE_FRETE: "9",
        VL_FINANCEIRO: input.amount,
        FL_PDV: true,
        ID_USER_INC: USUARIO_SISTEMA_ID,
        DS_OBS_PEDIDO: `Mesa ${input.tableNum} - comanda ${input.checkId}`,
      },
    });

    for (const item of input.items) {
      const idProduto = Number(item.productId);
      const preco = await tx.tB_TABELA_VENDA_PRECO.findFirst({
        where: { ID_TABELA_VENDA: TABELA_VENDA_ID, ID_PRODUTO: idProduto },
        select: { ID_TABELA_VENDA_PRECO: true },
      });
      if (!preco) {
        throw new Error(
          `Produto ${item.productId} sem preço cadastrado na tabela de venda ${TABELA_VENDA_ID}.`,
        );
      }

      const idPedidoItem = await nextId(tx, "TB_PEDIDO_ITEM", "ID_PEDIDO_ITEM");
      const valorItem = item.unitPrice * item.qty;

      await tx.tB_PEDIDO_ITEM.create({
        data: {
          ID_PEDIDO_ITEM: idPedidoItem,
          ID_PEDIDO: idPedido,
          ID_TIPO_OPERACAO: TIPO_OPERACAO_VENDA,
          ID_PRODUTO: idProduto,
          ID_TABELA_VENDA_PRECO: preco.ID_TABELA_VENDA_PRECO,
          QTD_VENDA: item.qty,
          VL_UNITARIO: item.unitPrice,
          ID_UNIDADE_VENDA: UNIDADE_MEDIDA_PADRAO,
          VL_PRODUTO: valorItem,
          VL_FINANCEIRO: valorItem,
          VL_CONTABIL: valorItem,
          ID_USER_INC: USUARIO_SISTEMA_ID,
        },
      });
    }

    const idPedidoParcela = await nextId(
      tx,
      "TB_PEDIDO_PARCELA",
      "ID_PEDIDO_PARCELA",
    );

    await tx.tB_PEDIDO_PARCELA.create({
      data: {
        ID_PEDIDO_PARCELA: idPedidoParcela,
        ID_PEDIDO: idPedido,
        NR_PARCELA: 1,
        DT_VENCIMENTO: now,
        VL_PARCELA: input.amount,
        VL_PARCELA_2: input.amount,
        VL_PARCELA_3: input.amount,
        ID_STATUS: STATUS_PARCELA_BAIXADO,
        ID_FORMA_PAGTO: idFormaPagto,
        ID_CONDICAO_PAGTO: CONDICAO_PAGTO_A_VISTA,
        ID_USER_INC: USUARIO_SISTEMA_ID,
        DT_RECEBIMENTO: now,
        VL_RECEBIDO: input.amount,
      },
    });
  });
}
