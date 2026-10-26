import { Skeleton } from '@/components/ui/skeleton';

export default function NewsLoading() {
  return (
    <div className="min-h-screen bg-[#fffdf6] dark:bg-[#0b1611]">
      <div className="mx-auto w-full max-w-[1344px] px-5 py-8 sm:px-8">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-3 h-10 w-72 max-w-full" />

        {/* Featured article */}
        <Skeleton className="mt-8 h-80 w-full rounded-3xl" />

        {/* Article grid */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl border border-[#15231d14] bg-white dark:border-[#ffffff14] dark:bg-[#10241b]">
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-5 w-full" />
                <Skeleton className="mt-2 h-5 w-3/4" />
                <Skeleton className="mt-4 h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
