import { AUDIT_STATUS_LABEL, auditDateTime, type AuditRow } from "./index";
import { fmt } from "@/lib/format";

// Client-side exporters. Heavy libs (xlsx / jspdf) are dynamically imported so
// they never weigh on the initial bundle.

const HEADERS = [
  "Pedido",
  "Mesa",
  "Item",
  "Qtd",
  "Valor",
  "Motivo",
  "Solicitante",
  "Aprovador",
  "Data/Hora",
  "Status",
] as const;

function toMatrix(rows: AuditRow[]): (string | number)[][] {
  return rows.map((r) => [
    r.id,
    r.tableNum,
    r.itemName,
    r.qty,
    r.amount,
    r.reason,
    r.requesterName,
    r.approverName,
    auditDateTime(r.requestedAt),
    AUDIT_STATUS_LABEL[r.status],
  ]);
}

export async function exportAuditExcel(rows: AuditRow[]): Promise<void> {
  const XLSX = await import("xlsx");
  const aoa = [HEADERS as unknown as string[], ...toMatrix(rows)];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 16 },
    { wch: 6 },
    { wch: 26 },
    { wch: 6 },
    { wch: 12 },
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
  XLSX.writeFile(wb, `auditoria-remocoes-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportAuditPdf(rows: AuditRow[]): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("Auditoria de remoções de itens", 14, 16);
  doc.setFontSize(9);
  doc.text(`Gerado em ${auditDateTime(new Date().toISOString())}`, 14, 22);

  autoTable(doc, {
    startY: 26,
    head: [HEADERS as unknown as string[]],
    body: rows.map((r) => [
      r.id,
      String(r.tableNum),
      r.itemName,
      String(r.qty),
      fmt(r.amount),
      r.reason,
      r.requesterName,
      r.approverName,
      auditDateTime(r.requestedAt),
      AUDIT_STATUS_LABEL[r.status],
    ]),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [31, 78, 121] },
    columnStyles: { 0: { cellWidth: 26 }, 5: { cellWidth: 45 } },
  });

  doc.save(`auditoria-remocoes-${new Date().toISOString().slice(0, 10)}.pdf`);
}
