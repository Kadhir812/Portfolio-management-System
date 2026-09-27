import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, AtSign, LockKeyhole, UserRound } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/ui/button';
import { AuthShell, ErrorMessage, Field } from './LoginPage';

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await api.auth.register(form);
      localStorage.setItem('portfolio_token', response.token);
      localStorage.setItem('portfolio_user', JSON.stringify(response));
      navigate('/portfolios', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Unable to create account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Create your workspace"
      title="Start with one account"
      description="Register your secure portfolio workspace. Your portfolios remain scoped to this account."
      footer={<>Already registered? <Link className="font-semibold text-sky-300 hover:text-sky-200" to="/login">Sign in</Link></>}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error ? <ErrorMessage message={error} /> : null}
        <Field
          label="Email address"
          icon={AtSign}
          type="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          autoComplete="email"
          required
        />
        <Field
          label="Username"
          icon={UserRound}
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
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Button className="h-12 w-full justify-between rounded-xl bg-sky-300 px-5 text-slate-950 hover:bg-sky-200" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthShell>
  );
}
