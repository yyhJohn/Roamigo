import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../ui/Button';
import type { AuthSessionDto } from '../../lib/contracts/auth.schemas';
import {
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
} from '../../lib/contracts/auth.schemas';
import {
  ApiClientError,
  apiRequest,
  setMemoryCsrfToken,
} from '../../lib/apiClient';
import { AUTH_QUERY_KEY } from '../../lib/useAuth';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = ForgotPasswordInputSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a valid email.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest<{
        message: string;
        devResetUrl?: string;
      }>('/api/auth/forgot-password', {
        method: 'POST',
        body: parsed.data,
      });
      setStatusMessage(res.message);
      setDevResetUrl(res.devResetUrl ?? null);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Could not request password reset.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <label
          htmlFor="forgot-email"
          className="block text-xs font-semibold text-[var(--text-primary)]"
        >
          Account email
        </label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@university.ac.uk"
          className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
        />
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-[var(--status-danger)]">
          {error}
        </p>
      )}
      {statusMessage && (
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] p-3 text-xs text-[var(--text-primary)]">
          <p>{statusMessage}</p>
          {devResetUrl && (
            <p className="mt-2">
              <span className="font-semibold">Dev sandbox link: </span>
              <a
                href={devResetUrl}
                data-testid="dev-reset-link"
                className="underline"
              >
                Continue to reset password
              </a>
            </p>
          )}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Preparing reset link…' : 'Send Reset Link'}
      </Button>
      <p className="text-center text-xs text-[var(--text-secondary)]">
        Remembered it?{' '}
        <Link to="/auth/login" className="font-semibold underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = ResetPasswordInputSchema.safeParse({ token, newPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your reset details.');
      return;
    }
    setSubmitting(true);
    try {
      const session = await apiRequest<AuthSessionDto>(
        '/api/auth/reset-password',
        {
          method: 'POST',
          body: parsed.data,
        },
      );
      setMemoryCsrfToken(session.csrfToken);
      queryClient.setQueryData(AUTH_QUERY_KEY, session);
      navigate('/trips');
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Could not reset password.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <label
          htmlFor="reset-token"
          className="block text-xs font-semibold text-[var(--text-primary)]"
        >
          Reset token
        </label>
        <input
          id="reset-token"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
        />
      </div>
      <div>
        <label
          htmlFor="reset-new-password"
          className="block text-xs font-semibold text-[var(--text-primary)]"
        >
          New password
        </label>
        <input
          id="reset-new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 chars with letter & number"
          className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
        />
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-[var(--status-danger)]">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Updating password…' : 'Update Password & Sign In'}
      </Button>
    </form>
  );
}
