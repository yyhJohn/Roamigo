import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import type { TripRoleValue } from '../../lib/contracts/trip.schemas';
import type { TripDetailDto } from '../../lib/contracts/tripDetail.types';
import {
  useCreateInvitationMutation,
  useUpdateMemberRoleMutation,
} from '../../lib/useTrips';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ModalDialog } from '../ui/ModalDialog';
import { useToast } from '../ui/ToastProvider';

export function TripMembersModal({
  open,
  onOpenChange,
  detail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: TripDetailDto;
}) {
  const qc = useQueryClient();
  const { pushToast } = useToast();
  const tripId = detail.summary.id;
  const inviteMutation = useCreateInvitationMutation(tripId);
  const roleMutation = useUpdateMemberRoleMutation(tripId);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const canInvite =
    !detail.isDemoReadOnly &&
    (detail.summary.myRole === 'OWNER' || detail.summary.myRole === 'EDITOR');
  const isOwner = !detail.isDemoReadOnly && detail.summary.myRole === 'OWNER';

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    try {
      const out = await inviteMutation.mutateAsync({ email, role });
      setGeneratedUrl(out.inviteUrl);
      setEmail('');
      pushToast('Invitation link created!', 'success');
    } catch {
      pushToast('Enter a valid email to generate an invite.', 'error');
    }
  }

  async function handleRevoke(invitationId: string) {
    await apiRequest(`/api/trips/${tripId}/invitations/${invitationId}`, {
      method: 'DELETE',
    });
    void qc.invalidateQueries({ queryKey: ['trips', 'detail', tripId] });
  }

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Group Members & Share Links"
      description="Invite friends via secure single-trip links and manage role permissions."
    >
      <div className="space-y-5">
        {canInvite && (
          <form onSubmit={(e) => void handleInvite(e)} className="space-y-2.5">
            <div className="flex flex-wrap gap-2">
              <input
                type="email"
                aria-label="Invitee email"
                data-testid="invite-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@university.ac.uk"
                className="min-w-0 flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs"
              />
              <select
                aria-label="Invitee role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as 'EDITOR' | 'MEMBER' | 'VIEWER')
                }
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs"
              >
                <option value="EDITOR">Editor</option>
                <option value="MEMBER">Member</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <Button
                type="submit"
                size="sm"
                data-testid="create-invite-btn"
                disabled={inviteMutation.isPending}
              >
                Create Link
              </Button>
            </div>
            {generatedUrl && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] p-2.5 text-xs">
                <code
                  data-testid="generated-invite-url"
                  className="truncate font-mono"
                >
                  {generatedUrl}
                </code>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard?.writeText(generatedUrl);
                    pushToast('Copied invite URL', 'info');
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
            )}
          </form>
        )}

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase">
            Active Members ({detail.members.length})
          </h4>
          {detail.members.map((m) => (
            <div
              key={m.memberId}
              className="flex items-center justify-between rounded-lg border border-[var(--border-default)] px-3 py-2 text-xs"
            >
              <div>
                <p className="font-semibold">{m.displayName}</p>
                {m.email && (
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {m.email}
                  </p>
                )}
              </div>
              {isOwner && m.role !== 'OWNER' ? (
                <select
                  aria-label={`Role for ${m.displayName}`}
                  value={m.role}
                  onChange={(e) =>
                    roleMutation.mutate({
                      memberId: m.memberId,
                      role: e.target.value as TripRoleValue,
                    })
                  }
                  className="rounded-md border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-1 text-xs"
                >
                  <option value="EDITOR">EDITOR</option>
                  <option value="MEMBER">MEMBER</option>
                  <option value="VIEWER">VIEWER</option>
                  <option value="OWNER">Transfer OWNER</option>
                </select>
              ) : (
                <Badge variant="default">{m.role}</Badge>
              )}
            </div>
          ))}
        </div>

        {detail.invitations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase">
              Pending Invites
            </h4>
            {detail.invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg bg-[var(--bg-canvas)] px-3 py-2 text-xs"
              >
                <span>
                  {inv.email} ({inv.role})
                </span>
                {canInvite && (
                  <button
                    type="button"
                    aria-label={`Revoke invite for ${inv.email}`}
                    onClick={() => void handleRevoke(inv.id)}
                    className="text-[var(--status-danger)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalDialog>
  );
}
