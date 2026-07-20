-- App-owned audit table for item removals. NOT part of the introspected ERP.
-- Run this by hand against the database (SQL Server). Do NOT use prisma migrate
-- (the schema is db-pull introspected and migrate would try to reconcile the
-- whole ERP). Rows are append/upsert-only and are never deleted (audit).

IF NOT EXISTS (
  SELECT 1 FROM sys.tables WHERE name = 'APP_REMOCAO_AUDITORIA'
)
BEGIN
  CREATE TABLE dbo.APP_REMOCAO_AUDITORIA (
    ID_REMOCAO      VARCHAR(64)   NOT NULL PRIMARY KEY,
    DS_COMANDA      VARCHAR(64)   NOT NULL,
    MESA            INT           NOT NULL,
    DS_PRODUTO      VARCHAR(64)   NULL,
    DS_ITEM         VARCHAR(256)  NOT NULL,
    QTD             INT           NOT NULL,
    VL_VALOR        FLOAT         NOT NULL,
    DS_MOTIVO       VARCHAR(512)  NOT NULL,
    DS_STATUS       VARCHAR(16)   NOT NULL,
    ID_SOLICITANTE  VARCHAR(64)   NOT NULL,
    DS_SOLICITANTE  VARCHAR(128)  NOT NULL,
    DT_SOLICITACAO  DATETIME      NOT NULL,
    ID_APROVADOR    VARCHAR(64)   NULL,
    DS_APROVADOR    VARCHAR(128)  NULL,
    DT_DECISAO      DATETIME      NULL
  );

  CREATE INDEX IX_APP_REMOCAO_DT ON dbo.APP_REMOCAO_AUDITORIA (DT_SOLICITACAO);
  CREATE INDEX IX_APP_REMOCAO_SOLIC ON dbo.APP_REMOCAO_AUDITORIA (ID_SOLICITANTE);
END
