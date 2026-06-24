interface LoaderProps {
  label?: string;
  dark?: boolean;
}

/** Simple centered loading state used while the store hydrates. */
export function Loader({ label = "Carregando…", dark = false }: LoaderProps) {
  return (
    <div
      className={`flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 ${
        dark ? "text-white/80" : "text-ink-muted"
      }`}
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}
