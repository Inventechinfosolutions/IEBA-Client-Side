import { useHolidays } from "../queries/dashboardQueries"

function formatDate(dateStr: string): string {
  const t = dateStr.trim()
  // If YYYY-MM-DD
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t)
  if (m) return `${m[2]}-${m[3]}-${m[1]}`
  // If MM-DD-YYYY
  m = /^(\d{2})-(\d{2})-(\d{4})/.exec(t)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  return t
}

export function HolidayListCard() {
  const { data, isLoading } = useHolidays()
  const list = data?.list ?? []

  return (
    <div className="flex h-full flex-col rounded-[10px] border border-[#E8EAF6] bg-white shadow-[0_0_20px_0_#0000001a] overflow-hidden">
  
      <div className="flex items-center justify-center py-2 border-b border-[#F0F0F0] shrink-0">
        <span className="text-[16px] font-bold text-[#1a1a2e]">Holidays ({list.length})</span>
      </div>

      <div className="flex-1 overflow-y-auto">
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
            <div key={i} className="flex items-center gap-3 px-3 py-1.5 hover:bg-[#F9F8FF] transition-colors border-b border-[#F0F0F0]">
              <span className="rounded-full bg-[#7364D2] px-2.5 py-0.5 text-[10px] font-bold text-white shrink-0">
                {formatDate(h.date)}
              </span>
              <span className="text-[12px] font-medium text-[#111827] truncate">
                {h.description}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
