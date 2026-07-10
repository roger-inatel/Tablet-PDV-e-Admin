require("dotenv/config");

const path = require("node:path");
const adapterPath = require.resolve("@prisma/adapter-mssql");
const sql = require(require.resolve("mssql", {
  paths: [path.dirname(adapterPath)],
}));

const connectionString =
  process.env.DATABASE_URL ||
  "sqlserver://localhost:1433;database=DB_POWER_SYS;user=sa;password=SqlServer@123456;encrypt=true;trustServerCertificate=true";

function parseSqlServerUrl(url) {
  const [origin, ...propertyParts] = url.replace(/^sqlserver:\/\//, "").split(";");
  const [server, portText] = origin.split(":");
  const properties = Object.fromEntries(
    propertyParts.map((part) => {
      const [key, ...valueParts] = part.split("=");
      return [key, valueParts.join("=")];
    }),
  );

  return {
    server,
    port: Number(portText || 1433),
    database: properties.database,
    user: properties.user,
    password: properties.password,
    options: {
      encrypt: properties.encrypt === "true",
      trustServerCertificate: properties.trustServerCertificate === "true",
    },
  };
}

const IDS = {
  user: 900001,
  company: 900001,
  icmsGroup: 900001,
  productType: 900001,
  brand: 900001,
  flavor: 900001,
  analysisGroup: 900001,
  foodFamily: 900001,
  drinkFamily: 900002,
  foodCategory: 900001,
  drinkCategory: 900002,
  // Cliente avulso (mesa/balcão) e forma de pagamento PIX usados ao gravar
  // pedidos reais (TB_PEDIDO/TB_PEDIDO_ITEM/TB_PEDIDO_PARCELA) — ver
  // src/lib/erp/constants.ts, que espelha estes mesmos IDs.
  walkInCustomer: 900001,
  walkInAddress: 900001,
  pixPaymentMethod: 11,
  salesTable: 1,
};

// Preço de demonstração (não há tabela de preço cadastrada ainda para os
// produtos seedados) — VL_UNITARIO em TB_TABELA_VENDA_PRECO.
const PRODUCT_PRICES = {
  900001: 42, // Macarronada
  900002: 46, // Lasanha Bolonhesa
  900003: 22, // Batida de Vodka
  900004: 8, // Refrigerante Cola
};

const UNIT_OF_SALE = 3; // TB_UNIDADE_MEDIDA "UNIDADE" (UN)

const products = [
  {
    id: 900001,
    name: "Macarronada",
    fiscalName: "Macarronada da casa",
    categoryId: IDS.foodCategory,
    familyId: IDS.foodFamily,
    coldDrink: false,
    barcode: "7899000000011",
  },
  {
    id: 900002,
    name: "Lasanha Bolonhesa",
    fiscalName: "Lasanha bolonhesa",
    categoryId: IDS.foodCategory,
    familyId: IDS.foodFamily,
    coldDrink: false,
    barcode: "7899000000028",
  },
  {
    id: 900003,
    name: "Batida de Vodka",
    fiscalName: "Batida de vodka",
    categoryId: IDS.drinkCategory,
    familyId: IDS.drinkFamily,
    coldDrink: true,
    barcode: "7899000000035",
  },
  {
    id: 900004,
    name: "Refrigerante Cola",
    fiscalName: "Refrigerante cola",
    categoryId: IDS.drinkCategory,
    familyId: IDS.drinkFamily,
    coldDrink: true,
    barcode: "7899000000042",
  },
];

async function upsertById(transaction, table, idColumn, id, values) {
  const columns = Object.keys(values);
  const request = new sql.Request(transaction);
  request.input("id", sql.Int, id);

  for (const [column, value] of Object.entries(values)) {
    if (typeof value === "boolean") {
      request.input(column, sql.Bit, value);
    } else if (typeof value === "number") {
      request.input(column, Number.isInteger(value) ? sql.Int : sql.Float, value);
    } else {
      request.input(column, sql.VarChar, value);
    }
  }

  const assignments = columns
    .filter((column) => column !== idColumn)
    .map((column) => `${column} = @${column}`)
    .join(", ");
  const insertColumns = columns.join(", ");
  const insertValues = columns.map((column) => `@${column}`).join(", ");

  await request.query(`
    IF EXISTS (SELECT 1 FROM dbo.${table} WHERE ${idColumn} = @id)
      UPDATE dbo.${table}
         SET ${assignments}
       WHERE ${idColumn} = @id
    ELSE
      INSERT INTO dbo.${table} (${insertColumns})
      VALUES (${insertValues});
  `);
}

async function main() {
  const pool = await sql.connect(parseSqlServerUrl(connectionString));
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await upsertById(transaction, "TB_USUARIO", "ID_USUARIO", IDS.user, {
      ID_USUARIO: IDS.user,
      NM_USUARIO: "Seed Restaurante",
      DS_LOGIN: "seed",
      DS_SENHA: "seed",
      FL_ATIVO: true,
      ID_USER_INC: IDS.user,
    });

    await upsertById(transaction, "TB_EMPRESA", "ID_EMPRESA", IDS.company, {
      ID_EMPRESA: IDS.company,
      DS_ATIV_PRINCIPAL: "01",
      DS_REG_TRIBUTARIO: "01",
      FL_ATIVO: true,
      ID_USER_INC: IDS.user,
      NM_EMPRESA: "Restaurante Demo",
      TP_TIPO: "J",
    });

    await upsertById(transaction, "TB_GRUPO_ICMS", "ID_GRUPO_ICMS", IDS.icmsGroup, {
      ID_GRUPO_ICMS: IDS.icmsGroup,
      DS_GRUPO_ICMS: "Padrao Restaurante",
      TP_GRUPO_ICMS: "N",
      CD_SIT_TRIB_ESTADUAL: "00",
      DS_ABREV: "PADRAO",
      ID_EMPRESA: IDS.company,
      FL_ENVIA_PDV: true,
      FL_ATIVO: true,
      ID_USER_INC: IDS.user,
    });

    await upsertById(transaction, "TB_TIPO_PRODUTO", "ID_TIPO_PRODUTO", IDS.productType, {
      ID_TIPO_PRODUTO: IDS.productType,
      DS_TIPO_PRODUTO: "Cardapio",
      FL_ATIVO: true,
      ID_USER_INC: IDS.user,
      CODIGO_SPED: "00",
    });

    await upsertById(transaction, "TB_MARCA", "ID_MARCA", IDS.brand, {
      ID_MARCA: IDS.brand,
      DS_MARCA: "Casa",
      FL_ATIVO: true,
      ID_USER_INC: IDS.user,
    });

    await upsertById(transaction, "TB_COR_SABOR", "ID_COR_SABOR", IDS.flavor, {
      ID_COR_SABOR: IDS.flavor,
      DS_COR_SABOR: "Tradicional",
      FL_ATIVO: true,
      ID_USER_INC: IDS.user,
    });

    await upsertById(
      transaction,
      "TB_PRODUTO_GRUPO_ANALISE",
      "ID_PRODUTO_GRUPO_ANALISE",
      IDS.analysisGroup,
      {
        ID_PRODUTO_GRUPO_ANALISE: IDS.analysisGroup,
        DS_PRODUTO_GRUPO_ANALISE: "Cardapio",
        FL_ATIVO: true,
        ID_USER_INC: IDS.user,
      },
    );

    await upsertById(transaction, "TB_FAMILIA", "ID_FAMILIA", IDS.foodFamily, {
      ID_FAMILIA: IDS.foodFamily,
      DS_FAMILIA: "Alimentos",
      NR_ORDEM_CARGA: 1,
      FL_ATIVO: true,
      ID_USER_INC: IDS.user,
      FL_ENVIAR_MO: true,
    });

    await upsertById(transaction, "TB_FAMILIA", "ID_FAMILIA", IDS.drinkFamily, {
      ID_FAMILIA: IDS.drinkFamily,
      DS_FAMILIA: "Bebidas",
      NR_ORDEM_CARGA: 2,
      FL_ATIVO: true,
      ID_USER_INC: IDS.user,
      FL_ENVIAR_MO: true,
    });

    await upsertById(transaction, "TB_CATEGORIA", "ID_CATEGORIA", IDS.foodCategory, {
      ID_CATEGORIA: IDS.foodCategory,
      DS_CATEGORIA: "Pratos",
      NR_ORDEM_CARGA: 1,
      FL_ATIVO: true,
      ID_USER_INC: IDS.user,
    });

    await upsertById(transaction, "TB_CATEGORIA", "ID_CATEGORIA", IDS.drinkCategory, {
      ID_CATEGORIA: IDS.drinkCategory,
      DS_CATEGORIA: "Bebidas",
      NR_ORDEM_CARGA: 2,
      FL_ATIVO: true,
      ID_USER_INC: IDS.user,
    });

    for (const product of products) {
      await upsertById(transaction, "TB_PRODUTO", "ID_PRODUTO", product.id, {
        ID_PRODUTO: product.id,
        DS_PRODUTO: product.name,
        DS_PROD_FISCAL: product.fiscalName,
        DS_PROD_MOBILE: product.name,
        CD_BARRA_UNIDADE: product.barcode,
        ID_TIPO_PRODUTO: IDS.productType,
        ID_MARCA: IDS.brand,
        ID_FAMILIA: product.familyId,
        ID_COR_SABOR: IDS.flavor,
        ID_PRODUTO_GRUPO_ANALISE: IDS.analysisGroup,
        FL_BEBIDA_FRIA: product.coldDrink,
        FL_PAGAR_COMISSAO: false,
        FL_ENVIAR_MO: true,
        FL_PROD_ESP: false,
        FL_PERMITE_COM: true,
        FL_ATIVO: true,
        ID_USER_INC: IDS.user,
        FL_COMBO: false,
        ID_GRUPO_ICMS: IDS.icmsGroup,
        TP_MODALIDADE: "N",
        ID_CATEGORIA: product.categoryId,
      });
    }

    // Cliente avulso (mesa/balcão) — usado como ID_PESSOA em todo pedido
    // gravado a partir do app, já que não há cadastro de cliente por mesa.
    await upsertById(transaction, "TB_PESSOA", "ID_PESSOA", IDS.walkInCustomer, {
      ID_PESSOA: IDS.walkInCustomer,
      ID_EMPRESA: IDS.company,
      TP_TIPO: "F",
      NM_PESSOA: "Consumidor Mesa",
      FL_ATIVO: true,
      ID_USER_INC: IDS.user,
      TP_CONTRIBUINTE: 9, // Nao contribuinte
    });

    await upsertById(
      transaction,
      "TB_PESSOA_ENDERECO",
      "ID_PESSOA_ENDERECO",
      IDS.walkInAddress,
      {
        ID_PESSOA_ENDERECO: IDS.walkInAddress,
        ID_PESSOA: IDS.walkInCustomer,
        TP_ENDERECO: 1,
        DS_ENDERECO: "Balcao",
        DS_CIDADE: "Restaurante",
        DS_UF: "SP",
        DS_PAIS: "Brasil",
        FL_ATIVO: true,
        ID_USER_INC: IDS.user,
        FL_END_FAT_PADRAO: true,
        FL_END_ENT_PADRAO: true,
      },
    );

    // Forma de pagamento PIX (nao existia no ERP) — clonada da config de
    // CARTAO (id 3): a vista, sem troco, habilitada pro PDV.
    await upsertById(
      transaction,
      "TB_FORMA_PAGTO",
      "ID_FORMA_PAGTO",
      IDS.pixPaymentMethod,
      {
        ID_FORMA_PAGTO: IDS.pixPaymentMethod,
        DS_FORMA_PAGTO: "PIX",
        ID_TIPO_DOCUMENTO: 24,
        ID_BANCO_HISTORICO: 10,
        ID_BANCO_C_CORRENTE: 1,
        ID_CENTRO_CUSTO: 2,
        TP_FORMA_PAGTO: "A",
        TP_OPCAO_PAGTO: "V",
        FL_ATIVO: true,
        ID_USER_INC: IDS.user,
        FL_PARA_PDV: true,
        FL_PERMITE_TROCO: false,
      },
    );

    // Preco de venda dos produtos demo (nenhum tinha linha em
    // TB_TABELA_VENDA_PRECO ainda) — necessario pra gravar TB_PEDIDO_ITEM.
    for (const product of products) {
      await upsertById(
        transaction,
        "TB_TABELA_VENDA_PRECO",
        "ID_TABELA_VENDA_PRECO",
        product.id,
        {
          ID_TABELA_VENDA_PRECO: product.id,
          ID_TABELA_VENDA: IDS.salesTable,
          ID_PRODUTO: product.id,
          ID_UNIDADE_MEDIDA: UNIT_OF_SALE,
          VL_UNITARIO: PRODUCT_PRICES[product.id],
          VL_VALOR_EMBALAGEM: 0,
          FL_ATIVO: true,
          ID_USER_INC: IDS.user,
        },
      );
    }

    await transaction.commit();

    console.table(
      products.map((product) => ({
        ID_PRODUTO: product.id,
        DS_PRODUTO: product.name,
        CATEGORIA: product.categoryId === IDS.foodCategory ? "Pratos" : "Bebidas",
      })),
    );
    console.log("Seed do restaurante concluido.");
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
