import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LoadingSkeletonProps {
  type?: 'card' | 'text' | 'avatar' | 'table' | 'list';
  count?: number;
}

export function LoadingSkeleton({ type = 'card', count = 3 }: LoadingSkeletonProps) {
  if (type === 'card') {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-48 w-full bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-3/4 bg-muted" />
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 w-5/6 bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full bg-muted" />
        ))}
      </div>
    );
  }

  if (type === 'avatar') {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full bg-muted" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/4 bg-muted" />
          <Skeleton className="h-3 w-1/3 bg-muted" />
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full bg-muted" />
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-muted" />
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-lg bg-muted shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4 bg-muted" />
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 w-2/3 bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
