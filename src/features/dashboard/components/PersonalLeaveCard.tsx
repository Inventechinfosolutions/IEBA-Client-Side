import { Link } from "react-router-dom"
import iconPersonalLeave from "@/Assets/icon-personal-leave.png"

interface Props {
  total: number
  approved: number
  open: number
  rejected: number
  nextHolidayMonth: string
  nextHolidayDay: string
  isLoading?: boolean
}

export function PersonalLeaveCard({
  total,
  approved,
  open,
  rejected,
  nextHolidayMonth,
  nextHolidayDay,
  isLoading,
}: Props) {
  return (
    <Link to="/leave-approval" className="block h-full">
      <div className="flex h-full flex-col rounded-[10px] border border-[#E8EAF6] bg-white shadow-[0_0_20px_0_#0000001a] hover:shadow-[0_4px_16px_rgba(108,93,211,0.10)] transition-shadow duration-200">

        {/* Header */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-2">
          <img src={iconPersonalLeave} alt="Leave icon" className="h-10 w-10 shrink-0 rounded-xl object-contain" />
          <span className="text-[16px] font-medium text-[#1a1a2e] leading-tight pt-1">
            Personal Leave Requests ({isLoading ? "–" : total})
          </span>
        </div>

        {/* Stats rows */}
        <div className="flex-1 flex flex-col justify-evenly px-4 py-2">
          <StatRow label="Approved" value={approved} loading={isLoading} />
          <StatRow label="Open" value={open} loading={isLoading} />
          <StatRow label="Rejected" value={rejected} loading={isLoading} />
        </div>

        {/* Holiday footer */}
        <div className="flex items-stretch rounded-b-[10px] border-t border-[#F0F0F0] bg-[#f8f8fb] overflow-hidden min-h-[46px]">
          <div className="flex flex-1 items-center justify-center py-2">
            <span className="text-[14px] font-bold text-[#1a1a2e]">Holiday</span>
          </div>
          <div className="flex flex-col border-l border-[#F0F0F0]" style={{ width: "50%" }}>
            <div className="flex flex-1 items-center justify-center border-b border-[#F0F0F0] py-1.5">
              <span className="text-sm font-bold text-[#6C5DD3]">
                {nextHolidayMonth || "–"}
              </span>
            </div>
            <div className="flex flex-1 items-center justify-center py-1.5">
              <span className="text-sm font-bold text-[#6C5DD3]">
                {nextHolidayDay === "0" ? "–" : nextHolidayDay}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function StatRow({
  label,
  value,
  loading,
}: {
  label: string
  value: number
  loading?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[15px] text-[#4B5563]">{label}</span>
      {loading ? (
        <div className="h-4 w-5 animate-pulse rounded bg-[#e5e7eb]" />
      ) : (
        <span className="text-[15px] font-bold text-[#1a1a2e]">{value}</span>
      )}
    </div>
  )
}
