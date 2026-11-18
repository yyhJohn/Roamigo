import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AuthSessionDto, AuthUserDto } from './contracts/auth.schemas';
import type {
  DeleteAccountInput,
  UpdateProfileInput,
} from './contracts/user.schemas';
import { apiRequest, setMemoryCsrfToken } from './apiClient';
import { AUTH_QUERY_KEY } from './useAuth';

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const res = await apiRequest<{ user: AuthUserDto }>('/api/users/me', {
        method: 'PATCH',
        body: input,
      });
      queryClient.setQueryData<AuthSessionDto | undefined>(
        AUTH_QUERY_KEY,
        (prev) => (prev ? { ...prev, user: res.user } : prev),
      );
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      return res.user;
    },
  });
}

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DeleteAccountInput) => {
      await apiRequest<{ deleted: boolean }>('/api/users/me', {
        method: 'DELETE',
        body: input,
      });
      setMemoryCsrfToken(null);
      queryClient.setQueryData<AuthSessionDto>(AUTH_QUERY_KEY, {
        authenticated: false,
        user: null,
        csrfToken: null,
        oauthGoogleEnabled: false,
        smtpEnabled: false,
      });
      queryClient.removeQueries({ queryKey: ['trips'] });
    },
  });
}
