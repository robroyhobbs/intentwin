export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorBanner({
  message,
  onRetry,
  retryLabel = "Try again",
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3"
    >
      <span
        className="text-destructive text-lg leading-none mt-0.5"
        aria-hidden="true"
      >
        !
      </span>
      <div className="flex-1">
        <p className="text-sm text-destructive">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-medium text-primary hover:underline"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
