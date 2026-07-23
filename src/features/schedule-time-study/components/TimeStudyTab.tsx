import { TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { TimeStudyTabProps } from "../types"

export function TimeStudyTab({ value, label }: TimeStudyTabProps) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "relative flex h-11 sm:!h-full min-h-[44px] w-full items-center justify-center rounded-[6px] sm:rounded-[8px] border border-transparent px-3 sm:px-6 py-2.5 sm:!py-0 text-center text-[13px] sm:text-[15px] leading-tight font-medium sm:font-normal text-[#6C5DD3] shadow-none cursor-pointer transition-colors",
        "data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white data-[state=active]:shadow-none",
        "after:hidden"
      )}
    >
      <span className="whitespace-normal leading-tight">{label}</span>
    </TabsTrigger>
  )
}
