import { cn } from '@/lib/utils';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeMap: Record<SpinnerSize, { container: string; svg: string }> = {
  sm: { container: '', svg: 'h-4 w-4' },
  md: { container: '', svg: 'h-8 w-8' },
  lg: { container: '', svg: 'h-12 w-12' },
  xl: { container: '', svg: 'h-16 w-16' },
};

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

/**
 * LoadingSpinner — brand-aligned SVG spinner with CSS animation.
 * Supports four sizes and optional label text.
 */
export function LoadingSpinner({
  size = 'md',
  label,
  className,
}: LoadingSpinnerProps) {
  const { container, svg } = sizeMap[size];

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', container, className)}>
      <svg
        className={cn('animate-spin text-primary', svg)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
