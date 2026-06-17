'use client';

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({
  message = 'Loading...',
  variant = 'spinner',
  size = 'md',
  className = '',
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  if (variant === 'skeleton') {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
        <div className="h-2 w-2 bg-primary rounded-full animate-pulse delay-150" />
        <div className="h-2 w-2 bg-primary rounded-full animate-pulse delay-300" />
        {message && <span className="text-sm text-muted-foreground ml-2">{message}</span>}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

export function PageLoading({ message = 'Loading page...' }: { message?: string }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <LoadingState message={message} size="lg" />
    </div>
  );
}

export function InlineLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <LoadingState size="sm" variant="pulse" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}
