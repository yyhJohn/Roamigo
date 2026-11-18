import type { ReactNode } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  errorTestId?: string;
  children: ReactNode;
}

export function FormField({
  id,
  label,
  error,
  errorTestId,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          role="alert"
          data-testid={errorTestId}
          className="mt-1 text-xs text-rose-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
