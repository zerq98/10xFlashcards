import { Skeleton } from '../ui/skeleton';

export function FlashcardSkeletonList() {
  // Create an array of 6 items to render skeleton flashcards
  const skeletonItems = Array(6).fill(0);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {skeletonItems.map((_, index) => (
        <div key={index} className="h-56 rounded-lg border border-gray-700 bg-background p-5 shadow-medium">
          <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/6 rounded-full" />
            </div>
            <div className="flex-grow flex items-center justify-center">
              <Skeleton className="h-16 w-5/6" />
            </div>
            <div className="flex justify-center gap-3 mt-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
