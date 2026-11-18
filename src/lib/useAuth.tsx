import type { ReactNode } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';
import type {
  AuthSessionDto,
  LoginInput,
  RegisterInput,
} from './contracts/auth.schemas';
import { apiRequest, setMemoryCsrfToken } from './apiClient';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function useSessionQuery() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const session = await apiRequest<AuthSessionDto>('/api/auth/me');
      setMemoryCsrfToken(session.csrfToken);
      return session;
    },
    staleTime: 60_000,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const session = await apiRequest<AuthSessionDto>('/api/auth/login', {
        method: 'POST',
        body: input,
      });
      setMemoryCsrfToken(session.csrfToken);
      queryClient.setQueryData(AUTH_QUERY_KEY, session);
      return session;
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const session = await apiRequest<AuthSessionDto>('/api/auth/register', {
        method: 'POST',
        body: input,
      });
      setMemoryCsrfToken(session.csrfToken);
      queryClient.setQueryData(AUTH_QUERY_KEY, session);
      return session;
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiRequest<{ loggedOut: boolean }>('/api/auth/logout', {
        method: 'POST',
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

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data, isLoading } = useSessionQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-canvas)] text-sm text-[var(--text-secondary)]">
        Checking your Roamigo session…
      </div>
    );
  }

  if (!data?.authenticated) {
    const redirectTarget = encodeURIComponent(
      `${location.pathname}${location.search}`,
    );
    return <Navigate to={`/auth/login?next=${redirectTarget}`} replace />;
  }

  return <>{children}</>;
}
