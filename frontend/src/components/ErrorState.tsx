'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: 'default' | 'offline' | 'minimal';
  className?: string;
}

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
  variant = 'default',
  className = '',
}: ErrorStateProps) {
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  const defaultTitle = isOffline ? 'You\'re offline' : 'Something went wrong';
  const defaultMessage = isOffline
    ? 'Please check your internet connection and try again.'
    : 'We couldn\'t load the data. Please try again later.';

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 text-sm text-destructive ${className}`}>
        <AlertTriangle className="h-4 w-4" />
        <span>{message || defaultMessage}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="ml-auto">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'offline') {
    return (
      <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <WifiOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title || 'You\'re offline'}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
          {message || 'Please check your internet connection and try again.'}
        </p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        {isOffline ? (
          <WifiOff className="h-8 w-8 text-destructive" />
        ) : (
          <AlertTriangle className="h-8 w-8 text-destructive" />
        )}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title || defaultTitle}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
        {message || defaultMessage}
      </p>
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * Inline error message for smaller spaces
 */
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} className="shrink-0">
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}
