import type { ReactNode } from "react"
import { Inbox } from "lucide-react"

import { cn } from "@/lib/utils"

export type EmptyStateProps = {
  /** Primary line (default: "No data") */
  title?: string
  /** Optional supporting text below the title */
  description?: string
  /** Replace the default illustration */
  icon?: ReactNode
  className?: string
}

function EmptyState({
  title = "No data",
  description,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-[58px]",
        className
      )}
    >
      {icon ?? (
        <Inbox className="size-11 shrink-0 text-[#D1D5DB]" aria-hidden />
      )}
      <span className="text-[14px] font-[400] text-[#9CA3AF]">{title}</span>
      {description ? (
        <p className="max-w-sm text-center text-[13px] font-[400] text-[#9CA3AF]">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export { EmptyState }
