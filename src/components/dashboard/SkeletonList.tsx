import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const SkeletonList: React.FC = () => {
  // Create an array of 6 items to render skeleton cards
  const skeletonItems = Array(6).fill(0);
  
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {skeletonItems.map((_, index) => (
        <div key={index} className="rounded-lg border border-gray-700 bg-background p-5">
          <Skeleton className="mb-3 h-6 w-3/4" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};