import { Check, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type WeekStatusIconProps = {
  status: unknown
}

/** Renders one of four week statuses: Approved, Rejected, Submitted, Not Submitted. */
export function WeekStatusIcon({ status }: WeekStatusIconProps) {
  const s = String(status ?? "").toLowerCase()

  if (s === "approved") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#6C757D] shrink-0 cursor-help">
            <Check className="size-2.5 text-white" aria-hidden />
          </span>
        </TooltipTrigger>
        <TooltipContent className="text-xs">Approved</TooltipContent>
      </Tooltip>
    )
  }

  if (s === "rejected") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#EF4444] shrink-0 cursor-help">
            <X className="size-2.5 text-white" aria-hidden />
          </span>
        </TooltipTrigger>
        <TooltipContent className="text-xs">Rejected</TooltipContent>
      </Tooltip>
    )
  }

  if (s === "submitted" || s === "submittedexceed" || s === "submittedless") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#3b82f6] shrink-0 cursor-help">
            <Check className="size-2.5 text-white" aria-hidden />
          </span>
        </TooltipTrigger>
        <TooltipContent className="text-xs">Submitted</TooltipContent>
      </Tooltip>
    )
  }

  if (s === "notsubmitted" || s === "not_submitted") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-white border border-[#F97316] shrink-0 cursor-help shadow-sm">
            <X className="size-2.5 text-[#F97316]" aria-hidden />
          </span>
        </TooltipTrigger>
        <TooltipContent className="text-xs">Not Submitted</TooltipContent>
      </Tooltip>
    )
  }

  return null
}
