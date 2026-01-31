import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm overflow-hidden">
      <div className="h-0.5 bg-[var(--border)] -mx-6 -mt-6 mb-5" />
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
      <div className="mt-4">
        <div className="flex justify-between mb-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-1 w-full rounded-full" />
      </div>
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function SkeletonSection() {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
      <Skeleton className="h-2 w-2 rounded-full" />
      <Skeleton className="h-3.5 w-32" />
    </div>
  );
}
