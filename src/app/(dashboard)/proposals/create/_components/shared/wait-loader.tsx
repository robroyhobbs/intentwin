import { cn } from "@/lib/utils/cn";

interface WaitLoaderProps {
  label: string;
  detail?: string;
  className?: string;
}

export function WaitLoader({ label, detail, className }: WaitLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-xl border border-border bg-card px-4 py-3",
        "flex items-center gap-3",
        className,
      )}
    >
      <div className="relative size-9 shrink-0">
        <div className="absolute inset-0 rounded-full border-2 border-primary/40" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary motion-safe:animate-spin motion-reduce:animate-none" />
        <div className="absolute inset-[5px] rounded-full bg-primary/25 motion-safe:animate-pulse motion-reduce:animate-none" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground text-pretty">
          {label}
        </p>
        {detail && (
          <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
            {detail}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-primary/50 motion-safe:animate-bounce motion-reduce:animate-none" />
        <span
          className="size-1.5 rounded-full bg-primary/50 motion-safe:animate-bounce motion-reduce:animate-none"
          style={{ animationDelay: "120ms" }}
        />
        <span
          className="size-1.5 rounded-full bg-primary/50 motion-safe:animate-bounce motion-reduce:animate-none"
          style={{ animationDelay: "240ms" }}
        />
      </div>
    </div>
  );
}
