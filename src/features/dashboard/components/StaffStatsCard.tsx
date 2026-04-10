import { Link } from "react-router-dom"
import PersonalLeaveIcon from "@/assets/icon-personal-leave.png"

interface Props {
  open: number
  approved: number
  rejected: number
  deptCount: number
  programCount: number
  activitiesCount?: number
  jobPools?: number
  costPools?: number
  isLoading?: boolean
}

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
}: Props) {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Staff Leave Requests */}
      <Link to="/leave-approval" className="block">
        <div className="rounded-[12px] bg-white p-5 shadow-[0px_4px_20px_0px_#0000000D] hover:shadow-[0_8px_30px_rgba(108,93,211,0.12)] transition-all duration-200 border border-transparent flex flex-col h-full">
          <div className="flex items-center gap-4 mb-5">
            <img src={PersonalLeaveIcon} alt="Staff Leave" className="h-12 w-12 object-contain" />
            <h3 className="text-[15px] text-[#1a1a2e] leading-tight flex-1">
              Staff Leave Requests
            </h3>
          </div>
          <div className="flex flex-col justify-between flex-1">
            <StatRow label="Open" value={open} loading={isLoading} />
            <StatRow label="Approved" value={approved} loading={isLoading} />
            <StatRow label="Rejected" value={rejected} loading={isLoading} />
          </div>
        </div>
      </Link>

      {/* System Stats */}
      <div className="flex-1 rounded-[12px] bg-white p-6 shadow-[0px_4px_20px_0px_#0000000D] border border-transparent flex flex-col">
        <div className="flex flex-col justify-between h-full">
          <NavRow to="/department" label="Departments" value={deptCount} loading={isLoading} />
          <NavRow to="/program" label="Programs" value={programCount} loading={isLoading} />
          <NavRow label="Activities" value={activitiesCount} loading={isLoading} />
          <NavRow label="Job Pools" value={jobPools} loading={isLoading} />
          <NavRow label="Cost Pools" value={costPools} loading={isLoading} />
        </div>
      </div>
    </div>
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
}: {
  to?: string
  label: string
  value?: number
  loading?: boolean
}) {
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
    return <Link to={to}>{content}</Link>
  }
  return content
}
