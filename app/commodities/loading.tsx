import { Skeleton } from '@/components/ui/skeleton';

export default function CommoditiesLoading() {
  return (
    <div className="min-h-screen bg-[#fffdf6] dark:bg-[#0b1611]">
      <div className="mx-auto w-full max-w-[1344px] px-5 py-8 sm:px-8">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-3 h-10 w-72" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
          {/* Chart card */}
          <div className="rounded-3xl border border-[#15231d14] bg-white p-6 dark:border-[#ffffff14] dark:bg-[#10241b]">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-6 h-64 w-full rounded-2xl" />
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          </div>

          {/* List card */}
          <div className="rounded-3xl border border-[#15231d14] bg-white p-6 dark:border-[#ffffff14] dark:bg-[#10241b]">
            <Skeleton className="h-8 w-32" />
            <div className="mt-6 flex flex-col gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
