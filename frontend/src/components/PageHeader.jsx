export function PageHeader({ title, description, rightAction }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-brand-100">Portfolio workspace</p>
        <h2 className="mt-1 text-3xl font-bold text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      {rightAction ? <div>{rightAction}</div> : null}
    </div>
  );
}
