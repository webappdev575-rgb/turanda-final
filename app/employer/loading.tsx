import { Skeleton } from '@/components/ui/skeleton';

export default function EmployerLoading() {
  return (
    <div className="min-h-screen bg-[#fffdf6] dark:bg-[#0b1611]">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-8 sm:px-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
          {/* Job posting form */}
          <div className="flex flex-col gap-4 rounded-3xl border border-[#15231d14] bg-white p-6 dark:border-[#ffffff14] dark:bg-[#10241b]">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <Skeleton className="mt-2 h-12 w-full rounded-full" />
          </div>

          {/* Tips / summary panel */}
          <div className="flex flex-col gap-4">
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-56 rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
