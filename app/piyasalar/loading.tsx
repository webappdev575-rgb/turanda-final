import { Skeleton } from '@/components/ui/skeleton';

export default function MarketLoading() {
  return (
    <div className="min-h-screen bg-[#fffdf6] dark:bg-[#0b1611]">
      <div className="mx-auto w-full max-w-[1344px] px-5 py-8 sm:px-8">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="mt-3 h-10 w-80 max-w-full" />

        {/* Ticker strip */}
        <Skeleton className="mt-8 h-14 w-full rounded-2xl" />

        {/* Cards grid */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_1fr]">
          <Skeleton className="h-[420px] rounded-3xl" />
          <Skeleton className="h-[420px] rounded-3xl" />
        </div>

        {/* Table rows */}
        <div className="mt-6 rounded-3xl border border-[#15231d14] bg-white p-6 dark:border-[#ffffff14] dark:bg-[#10241b]">
          <Skeleton className="h-6 w-40" />
          <div className="mt-5 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
