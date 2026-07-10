import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parsePageParam(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() ?? "";
    const page = parsePageParam(searchParams.get("page"), 1, 10_000);
    const pageSize = parsePageParam(searchParams.get("pageSize"), 50, 200);

    const where: Prisma.TB_PRODUTOWhereInput = search
      ? {
          DS_PRODUTO: {
            contains: search,
          },
        }
      : {};

    const [items, total] = await prisma.$transaction([
      prisma.tB_PRODUTO.findMany({
        where,
        select: {
          ID_PRODUTO: true,
          DS_PRODUTO: true,
          DS_PROD_FISCAL: true,
          DS_PROD_MOBILE: true,
          NR_ORDEM_MOBILE: true,
          FL_ATIVO: true,
        },
        orderBy: {
          ID_PRODUTO: "asc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.tB_PRODUTO.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Failed to list products:", error);

    return NextResponse.json(
      { message: "Erro interno ao listar produtos." },
      { status: 500 },
    );
  }
}
