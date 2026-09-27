export function Badge({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-slate-800 text-slate-200 border-slate-700',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    info: 'bg-sky-500/15 text-sky-300 border-sky-500/30'
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] ${tones[tone]}`}>
      {children}
    </span>
  );
}
