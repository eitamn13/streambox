function SkeletonCard({ variant = 'row' }) {
  if (variant === 'hero') {
    return (
      <div className="relative w-full h-[60vh] bg-[#1a1a2e] animate-shimmer overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="h-8 w-32 bg-[#2a2a3e] rounded mb-4 animate-shimmer" />
          <div className="h-12 w-3/4 max-w-lg bg-[#2a2a3e] rounded mb-4 animate-shimmer" />
          <div className="h-4 w-1/2 max-w-md bg-[#2a2a3e] rounded mb-2 animate-shimmer" />
          <div className="h-4 w-1/3 max-w-sm bg-[#2a2a3e] rounded mb-6 animate-shimmer" />
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-[#2a2a3e] rounded animate-shimmer" />
            <div className="h-10 w-32 bg-[#2a2a3e] rounded animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[160px] sm:w-[200px] md:w-[240px] flex-shrink-0">
      <div className="aspect-[16/9] rounded-md bg-[#1a1a2e] animate-shimmer mb-2" />
      <div className="h-4 w-3/4 bg-[#1a1a2e] rounded animate-shimmer" />
    </div>
  );
}

export default SkeletonCard;
