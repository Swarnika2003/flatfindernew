export default function FlatCardSkeleton() {
  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-[4/3] bg-muted" />
      
      {/* Content Skeleton */}
      <div className="p-4">
        <div className="h-5 bg-muted rounded w-3/4 mb-3" />
        <div className="h-4 bg-muted rounded w-1/2 mb-4" />
        
        {/* Details Skeleton */}
        <div className="flex items-center gap-4 pt-3 border-t border-border">
          <div className="h-4 bg-muted rounded w-12" />
          <div className="h-4 bg-muted rounded w-12" />
          <div className="h-4 bg-muted rounded w-16" />
        </div>
      </div>
    </div>
  )
}
