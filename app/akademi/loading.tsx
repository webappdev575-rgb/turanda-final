import { Skeleton } from '@/components/ui/skeleton';

export default function AcademyLoading() {
  return (
    <div className="min-h-screen bg-[#fffdf6] dark:bg-[#0b1611]">
      <div className="mx-auto w-full max-w-[1344px] px-5 py-8 sm:px-8">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-3 h-12 w-[28rem] max-w-full" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />

        {/* Course grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl border border-[#15231d14] bg-white dark:border-[#ffffff14] dark:bg-[#10241b]">
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
                <div className="mt-4 flex items-center justify-between">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-9 w-24 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
