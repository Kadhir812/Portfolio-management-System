import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await api.auth.login(form);
      localStorage.setItem('portfolio_token', response.token);
      localStorage.setItem('portfolio_user', JSON.stringify(response));
      navigate('/portfolios', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Portfolio manager"
      title="Welcome back"
      description="Sign in to continue building and monitoring your investment portfolios."
      footer={<>New here? <Link className="font-semibold text-sky-300 hover:text-sky-200" to="/register">Create an account</Link></>}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error ? <ErrorMessage message={error} /> : null}
        <Field
          label="Username"
          icon={Mail}
          value={form.username}
          onChange={(event) => updateField('username', event.target.value)}
          autoComplete="username"
          required
        />
        <Field
          label="Password"
          icon={LockKeyhole}
          type="password"
          value={form.password}
          onChange={(event) => updateField('password', event.target.value)}
          autoComplete="current-password"
          required
        />
        <Button className="h-12 w-full justify-between rounded-xl bg-sky-300 px-5 text-slate-950 hover:bg-sky-200" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ eyebrow, title, description, footer, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#07111f] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_85%_80%,rgba(16,185,129,0.12),transparent_32%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/10 bg-slate-900/80 shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden min-h-[620px] flex-col justify-between border-r border-white/10 bg-gradient-to-br from-sky-400/20 via-slate-900 to-emerald-400/10 p-10 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-300 font-bold text-slate-950">PM</div>
              <span className="text-sm font-semibold tracking-wide">Portfolio Manager</span>
            </div>
            <p className="mt-24 max-w-sm text-5xl font-semibold leading-[1.05] tracking-tight">Make every allocation deliberate.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs text-slate-300">
            <Metric value="01" label="Account" />
            <Metric value="24h" label="Token life" />
            <Metric value="100%" label="Ownership" />
          </div>
        </div>
        <div className="flex min-h-[620px] flex-col justify-center p-7 sm:p-12">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.25em] text-sky-300">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{description}</p>
          </div>
          {children}
          <p className="mt-8 text-center text-sm text-slate-400">{footer}</p>
        </div>
      </div>
    </main>
  );
}

function Field({ label, icon: Icon, type = 'text', ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type={type}
          className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-300/70 focus:ring-2 focus:ring-sky-300/10"
          {...props}
        />
      </span>
    </label>
  );
}

function ErrorMessage({ message }) {
  return <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{message}</div>;
}

function Metric({ value, label }) {
  return <div className="border-l border-white/15 pl-3"><p className="font-semibold text-white">{value}</p><p className="mt-1 text-slate-500">{label}</p></div>;
}

export { AuthShell, Field, ErrorMessage };
