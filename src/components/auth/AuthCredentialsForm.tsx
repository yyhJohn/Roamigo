import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { ApiClientError } from '../../lib/apiClient';
import { LoginInputSchema, RegisterInputSchema } from '../../lib/contracts/auth.schemas';
import type { Currency } from '../../lib/schemas';
import { useLoginMutation, useRegisterMutation } from '../../lib/useAuth';
import { Button } from '../ui/Button';

const INPUT_CLS =
  'mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-sm';

export function AuthCredentialsForm({
  mode,
  nextPath,
}: {
  mode: 'login' | 'register';
  nextPath: string;
}) {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [currency, setCurrency] = useState<Currency>('GBP');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = loginMutation.isPending || registerMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        const parsed = LoginInputSchema.safeParse({ email, password });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Check your credentials.');
          return;
        }
        await loginMutation.mutateAsync(parsed.data);
      } else {
        const parsed = RegisterInputSchema.safeParse({
          email,
          password,
          displayName,
          preferredCurrency: currency,
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Check your details.');
          return;
        }
        await registerMutation.mutateAsync(parsed.data);
      }
      navigate(nextPath);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Authentication failed.');
    }
  }

  async function handleDemoLogin() {
    setError(null);
    try {
      await loginMutation.mutateAsync({
        email: 'alice@roamigo.demo',
        password: 'RoamigoDemo2026!',
      });
      navigate(nextPath);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Demo login unavailable.');
    }
  }

  const encodedNext = encodeURIComponent(nextPath);

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
      {mode === 'register' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="auth-name" className="block text-xs font-semibold">Display name</label>
            <input id="auth-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Maya Patel" className={INPUT_CLS} />
          </div>
          <div>
            <label htmlFor="auth-currency" className="block text-xs font-semibold">Currency</label>
            <select id="auth-currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={INPUT_CLS}>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="auth-email" className="block text-xs font-semibold">Email address</label>
        <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={INPUT_CLS} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="auth-password" className="block text-xs font-semibold">Password</label>
          {mode === 'login' && (
            <Link to="/auth/forgot-password" className="text-xs font-medium text-[var(--text-secondary)] hover:underline">
              Forgot password?
            </Link>
          )}
        </div>
        <div className="relative mt-1">
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? 'Min 8 chars, letter + number' : '••••••••'}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] py-2 pr-10 pl-3 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[var(--text-secondary)]"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" data-testid="auth-error" className="rounded-lg border border-red-300 bg-[var(--status-danger-bg)] px-3 py-2 text-xs font-medium text-[var(--status-danger)]">
          {error}
        </p>
      )}

      <Button type="submit" data-testid="auth-submit-btn" className="w-full" disabled={busy}>
        {busy ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
      </Button>

      <Button type="button" variant="secondary" data-testid="demo-login-btn" className="w-full" disabled={busy} onClick={() => void handleDemoLogin()}>
        Try Demo Account (Alice Chen)
      </Button>

      <p className="text-center text-xs text-[var(--text-secondary)]">
        {mode === 'login' ? (
          <>New to Roamigo? <Link to={`/auth/register?next=${encodedNext}`} className="font-semibold text-[var(--text-primary)] underline">Create an account</Link></>
        ) : (
          <>Already have an account? <Link to={`/auth/login?next=${encodedNext}`} className="font-semibold text-[var(--text-primary)] underline">Sign in</Link></>
        )}
      </p>
    </form>
  );
}
