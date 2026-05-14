import { useNavigate } from "react-router-dom"
import { CheckCircle2, CircleDashed, Clock } from "lucide-react"
import type { TimeStudyStatusCardProps, StatusRowProps } from "../types"

export function TimeStudyStatusCard({ approved, pendingApproval, notSubmitted, isLoading }: TimeStudyStatusCardProps) {
  const navigate = useNavigate()

  const handleAction = () => {
    navigate("/personal-time-study")
    window.localStorage.setItem("value", "2")
  }

  return (
    <div className="flex h-full flex-col rounded-[10px] bg-white p-4 shadow-[0_0_20px_0_#0000001a]">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6C5DD3] shrink-0">
          <Clock className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <span className="text-[16px] font-medium text-[#1a1a2e]">Time Study Status</span>
      </div>

      <div className="flex flex-1 flex-col justify-around">
        {/* Row — Approved */}
        <StatusRow
          icon={<CheckCircle2 className="h-10 w-10 text-emerald-600" strokeWidth={1.75} aria-hidden />}
          label="Approved"
          count={approved}
          actionLabel="View"
          onAction={handleAction}
          loading={isLoading}
        />

        {/* Row — Pending Approval */}
        <StatusRow
          icon={<Clock className="h-10 w-10 text-amber-500" strokeWidth={1.75} aria-hidden />}
          label="Pending Approval"
          count={pendingApproval}
          actionLabel="Approve"
          onAction={handleAction}
          loading={isLoading}
        />

        {/* Row — Not Submitted */}
        <StatusRow
          icon={<CircleDashed className="h-10 w-10 text-slate-400" strokeWidth={1.75} aria-hidden />}
          label="Not Submitted"
          count={notSubmitted}
          actionLabel="Notify"
          onAction={handleAction}
          loading={isLoading}
        />
      </div>
    </div>
  )
}

function StatusRow({
  icon,
  label,
  count,
  actionLabel,
  onAction,
  loading,
}: StatusRowProps) {
  return (
    <div
      className="grid items-center gap-3"
      style={{ gridTemplateColumns: "40px 1fr 96px" }}
    >
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center">{icon}</div>

      {/* Label & Count Container */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-medium text-[#374151] truncate">{label}</span>
        {loading ? (
          <div className="h-4 w-5 animate-pulse rounded bg-[#e5e7eb]" />
        ) : (
          <span className="text-sm font-bold text-[#1a1a2e]">{count}</span>
        )}
      </div>

      {/* Button */}
      <button
        type="button"
        onClick={onAction}
        className="rounded-xl bg-[#6C5DD3] py-2.5 text-sm text-white hover:bg-[#5a4db8] active:scale-95 transition-all duration-150 w-full text-center shadow-[0_0_20px_0_#0003]"
      >
        {actionLabel}
      </button>
    </div>
  )
}
