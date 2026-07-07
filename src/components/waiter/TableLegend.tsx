const ITEMS = [
  { label: "Livre", color: "#16a34a" },
  { label: "Sua mesa", color: "#2563eb" },
  { label: "Outro garçom", color: "#dc2626" },
  { label: "Em fechamento", color: "#d97706" },
];

export function TableLegend() {
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[0.82rem] text-ink-muted">
      {ITEMS.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}
