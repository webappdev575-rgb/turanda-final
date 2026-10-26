import { Skeleton } from '@/components/ui/skeleton';

export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-[#fffdf6] dark:bg-[#0b1611]">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-8 sm:px-8">
        <Skeleton className="h-8 w-48" />

        <div className="mt-8 grid h-[70vh] grid-cols-1 gap-5 overflow-hidden rounded-3xl border border-[#15231d14] bg-white md:grid-cols-[300px_1fr] dark:border-[#ffffff14] dark:bg-[#10241b]">
          {/* Conversation list */}
          <div className="flex flex-col gap-3 border-r border-[#15231d14] p-4 dark:border-[#ffffff14]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl p-2">
                <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-1.5 h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>

          {/* Chat pane */}
          <div className="hidden flex-col justify-end gap-3 p-6 md:flex">
            <Skeleton className="h-12 w-2/5 rounded-2xl" />
            <Skeleton className="ml-auto h-12 w-1/3 rounded-2xl" />
            <Skeleton className="h-12 w-1/2 rounded-2xl" />
            <Skeleton className="ml-auto h-12 w-2/5 rounded-2xl" />
            <Skeleton className="mt-4 h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
