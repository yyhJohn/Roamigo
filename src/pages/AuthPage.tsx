import { Link, useSearchParams } from 'react-router-dom';
import { AuthCredentialsForm } from '../components/auth/AuthCredentialsForm';
import { AuthEditorialAside } from '../components/auth/AuthEditorialAside';
import {
  ForgotPasswordForm,
  ResetPasswordForm,
} from '../components/auth/PasswordResetForms';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { Card } from '../components/ui/Card';
import { RoamigoLogo } from '../components/ui/RoamigoLogo';

export type AuthViewMode = 'login' | 'register' | 'forgot' | 'reset';

export function AuthPage({ mode }: { mode: AuthViewMode }) {
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || '/trips';

  return (
    <div className="grid min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] lg:grid-cols-12">
      <AuthEditorialAside />

      <div className="flex flex-col justify-between p-6 sm:p-10 lg:col-span-7">
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:invisible">
            <RoamigoLogo showTagline />
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-md py-8">
          <Card className="p-6 sm:p-8">
            <h2 className="font-display text-2xl font-bold">
              {mode === 'login' && 'Welcome back'}
              {mode === 'register' && 'Create your Roamigo account'}
              {mode === 'forgot' && 'Reset your password'}
              {mode === 'reset' && 'Choose a new password'}
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {mode === 'login' &&
                'Sign in to access your shared trips, votes, and budgets.'}
              {mode === 'register' &&
                'Start planning collaborative trips with friends in seconds.'}
              {mode === 'forgot' &&
                'Enter your account email to receive a one-hour reset link.'}
              {mode === 'reset' &&
                'Enter a strong password to secure your account.'}
            </p>

            <div className="mt-6">
              {mode === 'forgot' && <ForgotPasswordForm />}
              {mode === 'reset' && <ResetPasswordForm />}
              {(mode === 'login' || mode === 'register') && (
                <AuthCredentialsForm mode={mode} nextPath={nextPath} />
              )}
            </div>
          </Card>
        </div>

        <p className="text-center text-xs text-[var(--text-secondary)]">
          Want a quick no-signup test first?{' '}
          <Link to="/#instant-sandbox" className="font-semibold underline">
            Try the Instant Sandbox
          </Link>
        </p>
      </div>
    </div>
  );
}
