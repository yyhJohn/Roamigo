import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastProvider';
import { applyThemeToDom, useThemeStore } from './lib/theme';
import { ProtectedRoute } from './lib/useAuth';
import { AuthPage } from './pages/AuthPage';
import { CreateTripWizardPage } from './pages/CreateTripWizardPage';
import { HomePage } from './pages/HomePage';
import { InviteAcceptPage } from './pages/InviteAcceptPage';
import { SettingsPage } from './pages/SettingsPage';
import { TripPrintPage } from './pages/TripPrintPage';
import { TripWorkspacePage } from './pages/TripWorkspacePage';
import { TripsDashboardPage } from './pages/TripsDashboardPage';
import { WorkspaceShellPage } from './pages/WorkspaceShellPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  const preference = useThemeStore((s) => s.preference);

  useEffect(() => {
    applyThemeToDom(preference);
  }, [preference]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/login" element={<AuthPage mode="login" />} />
            <Route path="/auth/register" element={<AuthPage mode="register" />} />
            <Route
              path="/auth/forgot-password"
              element={<AuthPage mode="forgot" />}
            />
            <Route
              path="/auth/reset-password"
              element={<AuthPage mode="reset" />}
            />
            <Route
              path="/trips"
              element={
                <ProtectedRoute>
                  <TripsDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/new"
              element={
                <ProtectedRoute>
                  <CreateTripWizardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:tripId/wizard"
              element={
                <ProtectedRoute>
                  <CreateTripWizardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:tripId"
              element={
                <ProtectedRoute>
                  <TripWorkspacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:tripId/print"
              element={
                <ProtectedRoute>
                  <TripPrintPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invites/:token"
              element={
                <ProtectedRoute>
                  <InviteAcceptPage />
                </ProtectedRoute>
              }
            />
            <Route path="/workspace-preview" element={<WorkspaceShellPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
