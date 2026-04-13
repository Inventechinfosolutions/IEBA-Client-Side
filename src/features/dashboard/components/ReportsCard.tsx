import { Link, useNavigate } from "react-router-dom"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { ReportItem } from "../types"

interface Props {
  reports: ReportItem[]
  isLoading?: boolean
}

export function ReportsCard({ reports, isLoading }: Props) {
  const navigate = useNavigate()

  const handleClick = (item: ReportItem) => {
    navigate("/reports", {
      state: {
        key: item.id,
        number: item.code,
        name: item.name,
        filename: item.filename,
        path: item.path,
        criteria: item.criteria,
      },
    })
  }

  return (
    <div className="flex h-full flex-col rounded-[10px] border border-[#E8EAF6] bg-white shadow-[0_0_20px_0_#0000001a]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#F0F0F0]">
        <div className="flex items-center gap-2">
          <ChevronDown className="h-4 w-4 text-[#6C5DD3]" />
          <span className="text-[18px]  text-[#1a1a2e]">Reports</span>
        </div>
        <Link
          to="/reports"
          className="flex items-center gap-1 rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-[#374151] hover:bg-[#E5E7EB] transition-colors"
        >
          More <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Left accent bar + list */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="w-[4px] bg-[#6C5DD3] rounded-full my-2 ml-4 shrink-0" />
        <div className="flex-1 overflow-y-auto divide-y divide-[#F5F5F7] min-h-0 ieba-scrollbar">
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
                <div className="h-5 w-10 rounded-full bg-[#e5e7eb]" />
                <div className="h-4 flex-1 rounded bg-[#e5e7eb]" />
              </div>
            ))}

          {!isLoading &&
            reports.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClick(item)}
                className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-[#F9F8FF] text-left transition-colors"
              >
                <span className="shrink-0 rounded-full bg-[#6C5DD3] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                  {item.code}
                </span>
                <span className="truncate text-sm text-[#374151]">{item.name}</span>
              </button>
            ))}

          {!isLoading && (
            <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9F8FF]">
              <span className="shrink-0 rounded-full bg-[#6C5DD3]/20 px-2 py-0.5 text-[10px] font-bold text-[#6C5DD3] uppercase tracking-wide">
                TSCR
              </span>
              <span className="truncate text-sm text-[#6C5DD3] underline-offset-2 hover:underline cursor-pointer">
                Time Study Calculation Report
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
