"use client";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <div className="flex gap-1 rounded-[11px] bg-[#e9eef5] p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-lg px-4 py-2 text-[0.84rem] font-bold transition ${
              on
                ? "bg-white text-ink shadow-[0_2px_6px_-2px_rgba(15,23,42,.2)]"
                : "bg-transparent text-ink-muted"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
