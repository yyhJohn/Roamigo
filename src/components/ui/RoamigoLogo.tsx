import { cn } from '../../lib/cn';

interface RoamigoLogoProps {
  showTagline?: boolean;
  compact?: boolean;
  className?: string;
}

export function RoamigoLogo({
  showTagline = false,
  compact = false,
  className,
}: RoamigoLogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        aria-hidden="true"
        className={cn(
          'shrink-0 rounded-lg shadow-xs',
          compact ? 'h-7 w-7' : 'h-8 w-8',
        )}
      >
        <rect width="32" height="32" rx="8" fill="#103D3B" />
        <path
          d="M9 22V10h7.2c3.1 0 5 1.5 5 4.1 0 1.9-1 3.2-2.7 3.7L22 22h-3.4l-3-3.7H12.2V22H9zm3.2-6.2h3.7c1.3 0 2.1-.6 2.1-1.6s-.8-1.6-2.1-1.6h-3.7v3.2z"
          fill="#FFFFFF"
        />
        <circle cx="25" cy="7" r="2.5" fill="#A7F3CF" />
      </svg>

      {!compact && (
        <div className="leading-tight">
          <span className="font-display block text-lg font-extrabold tracking-tight text-[var(--text-primary)]">
            Roamigo
          </span>
          {showTagline && (
            <span className="block text-xs font-medium text-[var(--text-secondary)]">
              Less Arguing, More Wandering.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
