import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/ToastProvider';
import { apiRequest } from '../lib/apiClient';

interface InvitePreviewDto {
  id: string;
  tripId: string;
  tripTitle: string;
  destinations: string[];
  startDate: string;
  endDate: string;
  role: string;
  invitedByName: string;
  status: string;
}

export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { pushToast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['invitations', token],
    enabled: Boolean(token),
    queryFn: () => apiRequest<InvitePreviewDto>(`/api/invitations/${token}`),
  });

  const acceptMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ tripId: string }>(`/api/invitations/${token}/accept`, {
        method: 'POST',
      }),
    onSuccess: (out) => {
      void qc.invalidateQueries({ queryKey: ['trips'] });
      pushToast('Joined trip workspace!', 'success');
      navigate(`/trips/${out.tripId}`);
    },
  });

  const declineMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ declined: boolean }>(`/api/invitations/${token}/decline`, {
        method: 'POST',
      }),
    onSuccess: () => {
      pushToast('Declined invitation', 'info');
      navigate('/trips');
    },
  });

  return (
    <AppShell
      title="Trip Invitation"
      subtitle="Review collaboration access before joining"
    >
      <div className="mx-auto max-w-lg py-6">
        <Card className="space-y-5 p-6">
          {isLoading && (
            <p className="text-sm text-[var(--text-secondary)]">
              Loading invitation details…
            </p>
          )}
          {error && (
            <p className="text-sm font-medium text-[var(--status-danger)]">
              This invitation link is invalid or has expired.
            </p>
          )}
          {data && (
            <>
              <div className="space-y-1.5">
                <Badge variant="mint">Invited as {data.role}</Badge>
                <h2 className="font-display text-2xl font-bold">
                  {data.tripTitle}
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Invited by <strong>{data.invitedByName}</strong> ·{' '}
                  {data.destinations.join(', ')} ({data.startDate} →{' '}
                  {data.endDate})
                </p>
              </div>

              {data.status === 'PENDING' ? (
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    data-testid="accept-invite-btn"
                    disabled={acceptMutation.isPending}
                    onClick={() => acceptMutation.mutate()}
                  >
                    <Check className="h-4 w-4" />
                    Accept & Open Trip
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={declineMutation.isPending}
                    onClick={() => declineMutation.mutate()}
                  >
                    <X className="h-4 w-4" />
                    Decline
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">
                    Invitation status: {data.status}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(`/trips/${data.tripId}`)}
                  >
                    Go to Trip
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
