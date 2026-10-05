import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, UserRound } from 'lucide-react';
import { api } from '../api/client';
import { AuthShell, Field } from '../components/AuthShell';
import { Notice } from '../components/Notice';
import { Button } from '../components/ui/button';

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await api.auth.login(form);
      localStorage.setItem('portfolio_token', response.token);
      localStorage.setItem('portfolio_user', JSON.stringify(response));
      navigate('/portfolios', { replace: true });
    } catch (e) {
      setError(e.message || 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      description="Continue to your portfolios."
      footer={<>New here? <Link className="font-semibold text-primary hover:underline" to="/register">Create an account</Link></>}
    >
      <form className="space-y-4" onSubmit={submit}>
        <Notice tone="error">{error}</Notice>
        <Field label="Username" icon={UserRound} value={form.username} onChange={set('username')} autoComplete="username" required />
        <Field label="Password" icon={LockKeyhole} type="password" value={form.password} onChange={set('password')} autoComplete="current-password" required />
        <Button className="h-11 w-full" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</Button>
      </form>
    </AuthShell>
  );
}
