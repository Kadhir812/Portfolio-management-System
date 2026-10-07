import { LockKeyhole } from 'lucide-react';

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground">PM</div>
      <span className="text-base font-bold tracking-tight">Portfolio Manager</span>
    </div>
  );
}

/** Sign-in and register share this frame. */
export function AuthShell({ title, description, footer, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <Brand />
        <div className="mt-8 rounded-2xl border border-border bg-card p-7 sm:p-9">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-7">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
          <LockKeyhole className="h-3.5 w-3.5" /> Your portfolios are visible only to your account.
        </p>
      </div>
    </main>
  );
}

export function Field({ label, icon: Icon, ...props }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input className="field h-11 pl-10" {...props} />
      </span>
    </label>
  );
}
