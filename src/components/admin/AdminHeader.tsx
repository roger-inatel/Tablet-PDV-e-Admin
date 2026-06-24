interface AdminHeaderProps {
  kicker: string;
  title: string;
}

/** Sticky top bar for admin pages: page kicker/title + establishment chips. */
export function AdminHeader({ kicker, title }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/90 px-4 py-3.5 backdrop-blur md:px-6 md:py-[18px] lg:px-8">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink-muted">
            {kicker}
          </p>
          <h1 className="m-0 text-[1.2rem] font-extrabold leading-tight text-navy md:text-[1.42rem]">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="hidden flex-col gap-px rounded-[14px] border border-[#d5e2ef] bg-gradient-to-br from-[#eff6ff] to-[#f8fbff] px-[13px] py-2 leading-tight text-[#1f4e79] sm:flex">
            <span className="text-[0.64rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
              Estabelecimento
            </span>
            <span className="text-[0.88rem] font-bold">Bistrô Central</span>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-[14px] border border-[#dbe2ea] bg-white py-[7px] pl-2 pr-3">
            <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-gradient-to-br from-brand-900 to-[#1f4e79] text-[0.82rem] font-extrabold text-white">
              GR
            </span>
            <div className="grid gap-px">
              <strong className="text-[0.84rem]">Roberta</strong>
              <span className="text-[0.74rem] text-ink-muted">Gerente</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
