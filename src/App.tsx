import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastProvider';
import { applyThemeToDom, useThemeStore } from './lib/theme';
import { HomePage } from './pages/HomePage';
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
            <Route path="/workspace-preview" element={<WorkspaceShellPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
