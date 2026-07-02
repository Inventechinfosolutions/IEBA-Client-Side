import { TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { TimeStudyTabProps } from "../types"

export function TimeStudyTab({ value, label }: TimeStudyTabProps) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "relative flex w-full !h-auto !py-3 min-h-0 shrink-0 items-center justify-center whitespace-normal md:whitespace-nowrap rounded-[8px] border border-[#E5E7EB] bg-white px-4 md:px-6 text-center text-[15px] leading-[1.35] font-normal text-[#6C5DD3] shadow-none transition-all",
        "data-[state=active]:bg-[#6C5DD3] data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-none",
        "md:w-auto md:!h-full md:!py-0 md:border-0 md:bg-transparent",
        "after:hidden"
      )}
    >
      {label}
    </TabsTrigger>
  )
}
