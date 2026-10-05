import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AtSign, LockKeyhole, UserRound } from 'lucide-react';
import { api } from '../api/client';
import { AuthShell, Field } from '../components/AuthShell';
import { Notice } from '../components/Notice';
import { Button } from '../components/ui/button';

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await api.auth.register(form);
      localStorage.setItem('portfolio_token', response.token);
      localStorage.setItem('portfolio_user', JSON.stringify(response));
      navigate('/portfolios', { replace: true });
    } catch (e) {
      setError(e.message || 'Unable to create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      description="Your portfolios stay private to this account."
      footer={<>Already registered? <Link className="font-semibold text-primary hover:underline" to="/login">Sign in</Link></>}
    >
      <form className="space-y-4" onSubmit={submit}>
        <Notice tone="error">{error}</Notice>
        <Field label="Email" icon={AtSign} type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        <Field label="Username" icon={UserRound} value={form.username} onChange={set('username')} autoComplete="username" required />
        <Field label="Password" icon={LockKeyhole} type="password" value={form.password} onChange={set('password')} autoComplete="new-password" minLength={8} required />
        <Button className="h-11 w-full" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</Button>
      </form>
    </AuthShell>
  );
}
