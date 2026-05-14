import { Link } from "react-router-dom"
import { ClipboardList } from "lucide-react"
import type { PersonalTimeStudyCardProps } from "../types"

function PersonalTimeStudyCardIcon({ className }: { className?: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-[#6C5DD3]/10 ${className ?? ""}`}
      aria-hidden
    >
      <ClipboardList className="text-[#6C5DD3]" strokeWidth={2} />
    </div>
  )
}

export function PersonalTimeStudyCard({
  totalApproved,
  totalSubmitted,
  percent,
  periodLabel,
  isLoading,
  noBlur = false,
}: PersonalTimeStudyCardProps) {
  if (noBlur) {
    return (
      <Link to="/personal-time-study" className="block h-full">
        <div className="relative flex h-full flex-col rounded-[15px] border border-[#E8EAF6] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(108,93,211,0.08)] transition-all duration-300">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <PersonalTimeStudyCardIcon className="h-9 w-9 [&>svg]:h-[22px] [&>svg]:w-[22px]" />
            <h3 className="text-[16px] font-bold text-[#111827] leading-tight pt-1">Personal Time Study</h3>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col gap-1">
            {isLoading ? (
              <div className="space-y-2 animate-pulse mt-2">
                <div className="h-4 w-2/3 rounded bg-[#f3f4f6]" />
                <div className="h-4 w-1/2 rounded bg-[#f3f4f6]" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[14px] text-[#9CA3AF]">
                  <span>Total Time approved :</span>
                  <span className="text-[#111827] font-semibold">{totalApproved}</span>
                </div>
                <div className="flex items-center gap-2 text-[14px] text-[#9CA3AF]">
                  <span>Total Time submitted :</span>
                  <span className="text-[#111827] font-semibold">{totalSubmitted}</span>
                </div>

                <div className="flex items-center gap-2 mt-auto pt-2 text-[15px]">
                  <span className="font-bold text-[#6C5DD3]">{percent}</span>
                  <span className="text-[#9CA3AF] text-[13px]">{periodLabel}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to="/personal-time-study" className="block h-full">
      <div className="relative flex h-full flex-col rounded-[10px] border border-[#E8EAF6] bg-white p-5 shadow-[0_0_20px_0_#0000001a] hover:shadow-[0_4px_20px_rgba(108,93,211,0.12)] transition-shadow duration-200">
        {/* blurred overlay – covers the border with -inset-px */}
        <div className="absolute -inset-px rounded-[10px] backdrop-blur-[3px] bg-white/20 z-10 pointer-events-none" />

        {/* Header */}
        <div className="relative z-0 flex items-start gap-4 mb-6">
          <PersonalTimeStudyCardIcon className="h-10 w-10 [&>svg]:h-6 [&>svg]:w-6" />
          <span className="text-[15px] font-bold text-[#1a1a2e] leading-tight pt-1">
            Personal Time Study
          </span>
        </div>

        {/* Content */}
        <div className="relative z-0 flex-1 flex flex-col">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-5 w-2/3 rounded bg-[#f3f4f6]" />
              <div className="h-5 w-1/2 rounded bg-[#f3f4f6]" />
              <div className="h-5 w-full rounded bg-[#f3f4f6]" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[15px]">
                  <span className="text-[#374151] font-medium">Total Time approved :</span>
                  <span className="font-bold text-[#1a1a2e]">{totalApproved}</span>
                </div>
                <div className="flex items-center justify-between text-[15px]">
                  <span className="text-[#374151] font-medium">Total Time submitted :</span>
                  <span className="font-bold text-[#1a1a2e]">{totalSubmitted}</span>
                </div>
              </div>

              <div className="flex items-end justify-between mt-4">
                <span className="text-[16px] font-bold text-[#6C5DD3]">{percent}%</span>
                <span className="text-[14px] font-medium text-[#6B7280]">{periodLabel}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
