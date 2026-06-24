interface KpiCardProps {
  label: string;
  value: string;
  helper: string;
  highlight?: boolean;
}

export function KpiCard({ label, value, helper, highlight = false }: KpiCardProps) {
  return (
    <div
      className={`rounded-card border p-4 ${
        highlight
          ? "border-[#cfe1f5] bg-gradient-to-br from-[#f8fbff] to-[#eef6ff]"
          : "border-line bg-white"
      }`}
    >
      <p className="m-0 mb-2.5 text-[0.8rem] font-bold uppercase tracking-[0.05em] text-ink-muted">
        {label}
      </p>
      <p className="m-0 text-[1.85rem] font-extrabold leading-none text-navy">{value}</p>
      <p className="mb-0 mt-[7px] text-[0.84rem] text-ink-muted">{helper}</p>
    </div>
  );
}
