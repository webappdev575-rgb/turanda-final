import { Skeleton } from '@/components/ui/skeleton';

export default function JobsLoading() {
  return (
    <div className="min-h-screen bg-[#fffdf6] dark:bg-[#0b1611]">
      <div className="mx-auto w-full max-w-[1344px] px-5 py-8 sm:px-8">
        {/* Toolbar: search button + filters */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-40 rounded-full" />
          <Skeleton className="h-10 w-44 rounded-full" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          {/* Sidebar filters */}
          <div className="hidden w-72 shrink-0 flex-col gap-4 lg:flex">
            <Skeleton className="h-[420px] rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
          </div>

          {/* Content: job cards grid */}
          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-3xl border border-[#15231d14] bg-white p-5 dark:border-[#ffffff14] dark:bg-[#10241b]">
                  <div className="flex items-start justify-between gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="mt-4 h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                  <div className="mt-4 flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="mt-4 h-9 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
