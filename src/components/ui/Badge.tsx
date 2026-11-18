import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-[var(--bg-muted)] text-[var(--text-primary)]',
        mint: 'bg-[var(--brand-accent)] text-[var(--brand-on-accent)]',
        success: 'bg-[var(--status-success-bg)] text-[var(--status-success)]',
        warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning)]',
        danger: 'bg-[var(--status-error-bg)] text-[var(--status-error)]',
        outline:
          'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
