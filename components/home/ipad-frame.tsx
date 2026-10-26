'use client';

/** Silver iPad Pro landscape frame (bezel, camera, side buttons) wrapping app content. */
export function IpadFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[1105px]">
      {/* Side buttons — left edge (volume) and top edge (power), visible on wide screens */}
      <div
        aria-hidden="true"
        className="absolute -left-[3px] top-[29%] hidden h-16 w-[3px] rounded-l-md bg-[#b8bcc2] lg:block"
      />
      <div
        aria-hidden="true"
        className="absolute -left-[3px] top-[42%] hidden h-16 w-[3px] rounded-l-md bg-[#b8bcc2] lg:block"
      />
      <div
        aria-hidden="true"
        className="absolute -top-[3px] left-[12%] hidden h-[3px] w-24 rounded-t-md bg-[#b8bcc2] lg:block"
      />
      <div
        aria-hidden="true"
        className="absolute -top-[3px] left-[24%] hidden h-[3px] w-24 rounded-t-md bg-[#b8bcc2] lg:block"
      />

      {/* Silver aluminum body */}
      <div className="rounded-[2.4rem] bg-gradient-to-b from-[#e8eaee] via-[#c8ccd3] to-[#9ba0a9] p-[3px] shadow-[0px_35px_70px_-15px_#00000059,0px_12px_24px_-8px_#00000040]">
        {/* Black front bezel */}
        <div className="relative rounded-[2.25rem] bg-[#0a0a0c] p-3 sm:p-4 lg:p-6">
          {/* Front camera + sensor dots, left edge (landscape) */}
          <div
            aria-hidden="true"
            className="absolute left-[1.1%] top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#1c1c22]" />
            <span className="h-1 w-1 rounded-full bg-[#26262c]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#1b2a4a]" />
            <span className="h-2 w-2 rounded-full bg-[#1c1c22]" />
          </div>

          {/* Screen */}
          <div className="overflow-hidden rounded-[1.7rem] lg:mx-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
