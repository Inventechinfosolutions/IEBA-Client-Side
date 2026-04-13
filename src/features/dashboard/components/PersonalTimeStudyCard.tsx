import { Link } from "react-router-dom"
import iconPersonalTimeStudy from "@/Assets/icon-personal-time-study.png"

interface Props {
  totalApproved: number
  totalSubmitted: number
  percent: string
  periodLabel: string
  isLoading?: boolean
}

export function PersonalTimeStudyCard({
  totalApproved,
  totalSubmitted,
  percent,
  periodLabel,
  isLoading,
}: Props) {
  return (
    <Link to="/personal-time-study" className="block h-full">
      <div className="relative flex h-full flex-col rounded-[10px] border border-[#E8EAF6] bg-white p-5 shadow-[0_0_20px_0_#0000001a] hover:shadow-[0_4px_20px_rgba(108,93,211,0.12)] transition-shadow duration-200">
        {/* blurred overlay – covers the border with -inset-px */}
        <div className="absolute -inset-px rounded-[10px] backdrop-blur-[3px] bg-white/20 z-10 pointer-events-none" />

        {/* Header */}
        <div className="relative z-0 flex items-start gap-4 mb-6">
          <img src={iconPersonalTimeStudy} alt="Time study icon" className="h-10 w-10 shrink-0 object-contain rounded-xl" />
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
