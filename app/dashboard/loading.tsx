import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#fffdf6] dark:bg-[#0b1611]">
      <div className="mx-auto w-full max-w-[1344px] px-5 py-8 sm:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-56" />
            <Skeleton className="mt-2 h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-11 w-36 rounded-full" />
        </div>

        {/* Stat cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-[#15231d14] bg-white p-5 dark:border-[#ffffff14] dark:bg-[#10241b]">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Main panels */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-96 rounded-3xl" />
          <div className="flex flex-col gap-5">
            <Skeleton className="h-44 rounded-3xl" />
            <Skeleton className="h-44 rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
