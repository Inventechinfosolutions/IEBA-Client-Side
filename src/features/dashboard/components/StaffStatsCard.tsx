import { Link } from "react-router-dom"
import PersonalLeaveIcon from "@/assets/icon-personal-leave.png"
import type { StaffStatsCardProps, StatRowProps, NavRowProps } from "../types"

export function StaffStatsCard({
  open,
  approved,
  rejected,
  deptCount,
  programCount,
  activitiesCount = 80,
  jobPools,
  costPools,
  isLoading,
}: StaffStatsCardProps) {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Staff Leave Requests */}
      <Link to="/leave-approval" className="block">
        <div className="rounded-[12px] bg-white p-5 sm:p-6 lg:p-5 shadow-[0px_4px_20px_0px_#0000000D] hover:shadow-[0_8px_30px_rgba(108,93,211,0.12)] transition-all duration-200 border border-transparent flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <img src={PersonalLeaveIcon} alt="Staff Leave" className="h-10 w-10 shrink-0 object-contain" />
            <h3 className="text-sm font-semibold text-[#1a1a2e] leading-snug flex-1">
              Staff Leave Requests
            </h3>
          </div>
          <div className="flex flex-col gap-3 sm:gap-3.5 pt-1">
            <StatRow label="Open" value={open} loading={isLoading} />
            <StatRow label="Approved" value={approved} loading={isLoading} />
            <StatRow label="Rejected" value={rejected} loading={isLoading} />
          </div>
        </div>
      </Link>

      {/* System Stats */}
      <div className="rounded-[12px] bg-white p-5 sm:p-6 lg:p-5 shadow-[0px_4px_20px_0px_#0000000D] border border-transparent flex flex-col">
        <div className="flex flex-col gap-3 sm:gap-3.5">
          <NavRow to="/department" label="Departments" value={deptCount} loading={isLoading} />
          <NavRow to="/program" label="Programs" value={programCount} loading={isLoading} />
          <NavRow to="/county-activity-code" label="Activities" value={activitiesCount} loading={isLoading} />
          {(jobPools !== undefined || costPools !== undefined) && (
            <>
              <NavRow to="/job-pool" label="Job Pools" value={jobPools} loading={isLoading} />
              <NavRow to="/costpool" label="Cost Pools" value={costPools} loading={isLoading} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatRow({
  label,
  value,
  loading,
}: StatRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px] font-medium text-[#4B5563]">{label}</span>
      {loading ? (
        <div className="h-5 w-8 animate-pulse rounded bg-[#e5e7eb]" />
      ) : (
        <span className="text-[14px] font-semibold text-[#1a1a2e]">{value}</span>
      )}
    </div>
  )
}

function NavRow({
  to,
  label,
  value,
  loading,
}: NavRowProps) {
  const content = (
    <div className="flex items-center justify-between group">
      <span className="text-[14px] font-semibold text-[#1a1a2e] group-hover:text-[#6C5DD3] transition-colors cursor-pointer">
        {label}
      </span>
      {loading ? (
        <div className="h-5 w-10 animate-pulse rounded bg-[#e5e7eb]" />
      ) : (
        <span className="text-[14px] font-semibold text-[#1a1a2e]">{value ?? "–"}</span>
      )}
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="block group">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold text-[#1a1a2e] group-hover:text-[#6C5DD3] transition-colors cursor-pointer">
            {label}
          </span>
          {loading ? (
            <div className="h-5 w-10 animate-pulse rounded bg-[#e5e7eb]" />
          ) : (
            <span className="text-[14px] font-semibold text-[#1a1a2e]">{value ?? "–"}</span>
          )}
        </div>
      </Link>
    )
  }
  return content
}
