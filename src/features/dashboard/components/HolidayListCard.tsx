import type { Holiday } from "../types"

interface Props {
  list: Holiday[]
  isLoading?: boolean
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split("T")[0].split("-")
  // Returns MM-DD-YYYY
  return `${parts[1]}-${parts[2]}-${parts[0]}`
}

export function HolidayListCard({ list, isLoading }: Props) {
  return (
    <div className="flex h-full flex-col rounded-[10px] border border-[#E8EAF6] bg-white shadow-[0_0_20px_0_#0000001a] overflow-hidden">
      {/* Header centered as per target */}
      <div className="flex items-center justify-center py-3 border-b border-[#F0F0F0] shrink-0">
        <span className="text-[16px] font-medium text-[#1a1a2e]">Holidays</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[#F3F4F6]">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2 animate-pulse">
              <div className="h-5 w-20 rounded-full bg-[#e5e7eb]" />
              <div className="h-4 flex-1 rounded bg-[#e5e7eb]" />
            </div>
          ))}

        {!isLoading && list.length === 0 && (
          <div className="flex items-center justify-center py-6 text-[#9CA3AF] text-xs italic">
            No holidays scheduled
          </div>
        )}

        {!isLoading &&
          list.map((h, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2 hover:bg-[#F9F8FF] transition-colors">
              <span className="rounded-full bg-[#6C5DD3] px-3 py-1 text-[11px] font-bold text-white shrink-0 shadow-sm">
                {formatDate(h.date)}
              </span>
              <span className="text-[12px] font-semibold text-[#374151] leading-tight">
                {h.description}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
