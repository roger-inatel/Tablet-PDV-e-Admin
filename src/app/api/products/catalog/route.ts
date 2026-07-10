import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Product, Station } from "@/types";

export const dynamic = "force-dynamic";

// Sale price lives in TB_TABELA_VENDA_PRECO, keyed by ID_TABELA_VENDA (there
// can be several active price tables). Until the right one is chosen, the
// catalog shows price 0. Set this env var once it's decided.
const PRICE_TABELA_VENDA_ID = process.env.PRODUCTS_PRICE_TABELA_VENDA_ID
  ? Number(process.env.PRODUCTS_PRICE_TABELA_VENDA_ID)
  : null;

// TB_FAMILIA has no "is a beverage" flag — DS_FAMILIA mixes drink types,
// drink brands and non-drink goods. KDS routing (kitchen vs bar) is derived
// from this manually reviewed list of beverage families.
const BAR_FAMILIES = new Set([
  "CERVEJAS",
  "VINHOS",
  "REFRIGERANTES",
  "SUCO",
  "AGUAS",
  "VODKA",
  "GIN",
  "WHISKYS",
  "CONHAQUE",
  "CACHACA",
  "ESPUMANTE",
  "ENERGETICO",
  "BEBIDAS QUENTES",
  "ERVA MATE",
  "JAMEL",
  "VELHO BARREIRO",
  "PIRASSUNUNGA",
  "AMBEV",
  "ASTECA",
  "ICE",
  "REFRIKO",
]);

function stationFor(familyName: string): Station {
  return BAR_FAMILIES.has(familyName) ? "bar" : "kitchen";
}

export async function GET() {
  try {
    const produtos = await prisma.tB_PRODUTO.findMany({
      where: { FL_ATIVO: true },
      select: {
        ID_PRODUTO: true,
        DS_PRODUTO: true,
        DS_PROD_MOBILE: true,
        NR_ORDEM_MOBILE: true,
        TB_CATEGORIA: { select: { DS_CATEGORIA: true } },
        TB_FAMILIA: { select: { DS_FAMILIA: true } },
      },
      orderBy: [{ NR_ORDEM_MOBILE: "asc" }, { ID_PRODUTO: "asc" }],
    });

    const priceByProductId = new Map<number, number>();

    if (PRICE_TABELA_VENDA_ID !== null) {
      const precos = await prisma.tB_TABELA_VENDA_PRECO.findMany({
        where: { ID_TABELA_VENDA: PRICE_TABELA_VENDA_ID, FL_ATIVO: true },
        select: { ID_PRODUTO: true, VL_UNITARIO: true },
      });
      for (const preco of precos) {
        priceByProductId.set(preco.ID_PRODUTO, preco.VL_UNITARIO);
      }
    }

    const products: Product[] = produtos.map((p) => ({
      id: String(p.ID_PRODUTO),
      name: p.DS_PROD_MOBILE || p.DS_PRODUTO,
      category: p.TB_CATEGORIA.DS_CATEGORIA,
      station: stationFor(p.TB_FAMILIA.DS_FAMILIA),
      price: priceByProductId.get(p.ID_PRODUTO) ?? 0,
    }));

    const categories = Array.from(new Set(products.map((p) => p.category)));

    return NextResponse.json({ products, categories });
  } catch (error) {
    console.error("Failed to list catalog products:", error);

    return NextResponse.json(
      { message: "Erro interno ao listar catálogo." },
      { status: 500 },
    );
  }
}
