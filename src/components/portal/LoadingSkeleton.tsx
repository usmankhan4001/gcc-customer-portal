interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

/** Shared loading treatment for lists/cards awaiting data. */
export default function LoadingSkeleton({ rows = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={`flex flex-col gap-3 ${className ?? ''}`} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-md border border-gray-200 p-4 h-20 flex flex-col gap-2 justify-center">
          <div className="w-2/5 h-3.5 rounded-md bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          <div className="w-4/5 h-3 rounded-md bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 0.1 + 0.05}s` }} />
        </div>
      ))}
    </div>
  );
}
