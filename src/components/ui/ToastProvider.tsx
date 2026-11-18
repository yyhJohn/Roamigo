import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

interface ToastItem {
  id: string;
  title: string;
  tone: ToastTone;
}

interface ToastContextValue {
  pushToast: (title: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue>({
  pushToast: () => undefined,
});

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const TONE_STYLES: Record<ToastTone, string> = {
  info: 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)]',
  success:
    'border-[var(--status-success)]/30 bg-[var(--status-success-bg)] text-[var(--status-success)]',
  warning:
    'border-[var(--status-warning)]/30 bg-[var(--status-warning-bg)] text-[var(--status-warning)]',
  error:
    'border-[var(--status-error)]/30 bg-[var(--status-error-bg)] text-[var(--status-error)]',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (title: string, tone: ToastTone = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((prev) => [...prev.slice(-3), { id, title, tone }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div
        aria-live="polite"
        className="no-print pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-xs font-semibold shadow-md ${TONE_STYLES[item.tone]}`}
          >
            <span>{item.title}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(item.id)}
              className="opacity-70 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
