import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { ApiClientError } from '../../lib/apiClient';
import { useDeleteAccountMutation } from '../../lib/useUserSettings';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../ui/ToastProvider';

export function DeleteAccountCard({ isDemo }: { isDemo: boolean }) {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const deleteMut = useDeleteAccountMutation();
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (confirmPhrase !== 'DELETE MY ACCOUNT') {
      setError('Type DELETE MY ACCOUNT in exact uppercase letters.');
      return;
    }
    try {
      navigate('/', { replace: true });
      await deleteMut.mutateAsync({ confirmPhrase: 'DELETE MY ACCOUNT' });
      pushToast('Your account and personal data have been deleted.', 'success');
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Could not delete account.',
      );
    }
  }

  return (
    <Card
      className="space-y-3 border-[var(--status-error)]/40 p-5"
      data-testid="privacy-delete-card"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-error)]" />
        <div>
          <h2 className="font-display text-base font-bold text-[var(--status-error)]">
            Privacy &amp; Account Deletion
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Deleting your account immediately revokes active sessions, deletes
            your private owned trips, removes your votes and invitations, and
            anonymizes any shared collaborator expense rows so group balances
            remain intact without retaining your personal identity.
          </p>
        </div>
      </div>

      {isDemo ? (
        <p className="rounded-lg bg-[var(--bg-muted)] px-3 py-2 text-xs text-[var(--text-secondary)]">
          System demo accounts are protected so shared evaluation data remains
          intact. Register a personal account to test permanent deletion.
        </p>
      ) : (
        <form onSubmit={(e) => void handleDelete(e)} className="space-y-3 text-xs">
          <div>
            <label
              htmlFor="delete-confirm-phrase"
              className="block font-semibold text-[var(--text-primary)]"
            >
              Type <code>DELETE MY ACCOUNT</code> to confirm:
            </label>
            <input
              id="delete-confirm-phrase"
              type="text"
              data-testid="delete-confirm-input"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="mt-1.5 w-full max-w-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 font-mono text-xs"
            />
          </div>

          {error && (
            <p
              role="alert"
              data-testid="delete-account-error"
              className="font-semibold text-[var(--status-error)]"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="danger"
            size="sm"
            data-testid="delete-account-btn"
            disabled={deleteMut.isPending}
          >
            Permanently Delete My Account
          </Button>
        </form>
      )}
    </Card>
  );
}
